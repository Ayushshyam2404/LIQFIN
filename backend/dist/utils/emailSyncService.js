"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllUsers = exports.syncEmailsForUser = void 0;
const imapflow_1 = require("imapflow");
const User_1 = require("../models/User");
const Expense_1 = require("../models/Expense");
const CreditCard_1 = require("../models/CreditCard");
const Notification_1 = require("../models/Notification");
const ProcessedEmail_1 = require("../models/ProcessedEmail");
const emailParser_1 = require("./emailParser");
const mimeParser_1 = require("./mimeParser");
const crypto_1 = require("./crypto");
const expenseController_1 = require("../controllers/expenseController");
const logger_1 = require("./logger");
const retry_1 = require("./retry");
/**
 * Synchronizes emails for a specific user.
 * Returns the number of new transactions parsed and added.
 */
const syncEmailsForUser = async (userId) => {
    const user = await User_1.User.findById(userId);
    if (!user || !user.emailSyncSettings || !user.emailSyncSettings.enabled) {
        return { success: false, count: 0, message: 'Email sync is disabled or user not found' };
    }
    const { host, port, secure, email, password } = user.emailSyncSettings;
    if (!email || !password) {
        return { success: false, count: 0, message: 'Email credentials are not configured' };
    }
    const decryptedPassword = (0, crypto_1.decrypt)(password);
    if (!decryptedPassword) {
        return { success: false, count: 0, message: 'Failed to decrypt email password' };
    }
    logger_1.logger.info(`[EmailSync] Starting sync for user ${user.email} (${userId})...`);
    const client = new imapflow_1.ImapFlow({
        host,
        port,
        secure,
        auth: {
            user: email,
            pass: decryptedPassword
        },
        logger: false
    });
    try {
        // Retry connection up to 3 times with 1000ms delay and backoff factor of 2
        await (0, retry_1.retry)(() => client.connect(), 3, 1000);
    }
    catch (err) {
        logger_1.logger.error(`[EmailSync] Connection failed for user ${user.email} after retries:`, err);
        // Create a warning notification for the user
        await Notification_1.Notification.create({
            userId: user._id,
            title: 'Email Sync Failed',
            message: `Unable to connect to IMAP server ${host} for ${email} after multiple attempts. Please check your credentials or security settings in Settings.`,
            type: 'danger'
        });
        return { success: false, count: 0, message: `Connection failed: ${err.message}` };
    }
    let newExpensesCount = 0;
    let lock = await client.getMailboxLock('INBOX');
    try {
        if (!client.mailbox) {
            logger_1.logger.error('[EmailSync] Mailbox not open.');
            return { success: false, count: 0, message: 'Mailbox not open' };
        }
        const totalMessages = client.mailbox.exists;
        logger_1.logger.info(`[EmailSync] Inbox contains ${totalMessages} messages. Fetching last 500 for evaluation...`);
        const startSeq = Math.max(1, totalMessages - 500);
        const range = `${startSeq}:${totalMessages}`;
        const messages = [];
        for await (let message of client.fetch(range, { envelope: true })) {
            if (message && message.envelope) {
                messages.push(message);
            }
        }
        // Sort descending (newest first)
        messages.sort((a, b) => b.uid - a.uid);
        logger_1.logger.info(`[EmailSync] Fetched ${messages.length} candidate email headers. Evaluating...`);
        for (const message of messages) {
            const uid = message.uid;
            try {
                const messageId = message.envelope.messageId;
                if (!messageId)
                    continue;
                // Skip if already processed
                const alreadyProcessed = await ProcessedEmail_1.ProcessedEmail.findOne({ userId: user._id, messageId });
                if (alreadyProcessed)
                    continue;
                const fromAddress = message.envelope.from && message.envelope.from[0]
                    ? `${message.envelope.from[0].address}`.toLowerCase()
                    : '';
                const subject = message.envelope.subject || '';
                logger_1.logger.debug(`[EmailSyncDebug] UID ${uid} | From: "${fromAddress}" | Subject: "${subject}"`);
                // Check if email is from Axis Bank alerts or matching transaction patterns
                const isAxisBank = fromAddress.includes('alerts@axis.bank.in') || fromAddress.includes('axis.bank');
                const isTransaction = subject.toLowerCase().includes('transaction') ||
                    subject.toLowerCase().includes('alert') ||
                    subject.toLowerCase().includes('spent') ||
                    subject.toLowerCase().includes('card');
                if (isAxisBank || isTransaction) {
                    logger_1.logger.info(`[EmailSync] Processing matching email: Subject "${subject}" from "${fromAddress}"`);
                    // Fetch the full source
                    const fullMessage = await client.fetchOne(uid, { source: true }, { uid: true });
                    if (!fullMessage || !fullMessage.source)
                        continue;
                    const rawContent = fullMessage.source.toString();
                    const emailBody = (0, mimeParser_1.extractEmailBody)(rawContent);
                    const parsed = (0, emailParser_1.parseTransactionEmail)(emailBody);
                    if (parsed) {
                        logger_1.logger.info(`[EmailSync] Parsed transaction: INR ${parsed.amount * 83} (${parsed.amount} USD) spent at ${parsed.merchant} on card ending ${parsed.cardDigits}`);
                        // 1. Identify or create Credit Card
                        let card = await CreditCard_1.CreditCard.findOne({ userId: user._id, cardNumberLastFour: parsed.cardDigits });
                        if (!card) {
                            card = await CreditCard_1.CreditCard.create({
                                userId: user._id,
                                cardName: `${parsed.bankName} ${parsed.cardDigits}`,
                                bank: parsed.bankName,
                                creditLimit: parsed.creditLimit || 500,
                                currentBalance: 0,
                                statementDate: 1,
                                dueDate: 20,
                                minimumPayment: 35,
                                annualFee: 0,
                                rewardsNotes: `Automatically created via ${parsed.bankName} transaction alert.`,
                                colorTheme: 'gold-black',
                                cardNumberLastFour: parsed.cardDigits
                            });
                        }
                        // 2. Create the Expense
                        const newExpense = await Expense_1.Expense.create({
                            userId: user._id,
                            title: parsed.merchant,
                            amount: parsed.amount,
                            category: parsed.category,
                            paymentMethod: 'credit_card',
                            creditCardId: card._id,
                            date: parsed.date || message.envelope.date || new Date(),
                            notes: `Auto-parsed from email: "${subject}". Original amount: ${parsed.originalAmount}`,
                            tags: ['auto-parsed', 'email-sync']
                        });
                        // 3. Synchronize Budgets and Credit Card balances
                        await (0, expenseController_1.syncBudgetAndNotify)(user._id.toString(), newExpense.category, newExpense.date);
                        await (0, expenseController_1.syncCreditCardBalance)(card._id.toString(), user._id.toString());
                        // 4. Create Notification
                        await Notification_1.Notification.create({
                            userId: user._id,
                            title: 'Transaction Auto-Logged',
                            message: `Logged ${parsed.originalAmount} spent at "${parsed.merchant}" on Axis card ending in ${parsed.cardDigits}.`,
                            type: 'success'
                        });
                        newExpensesCount++;
                        // Mark email as processed in our DB since it succeeded!
                        await ProcessedEmail_1.ProcessedEmail.create({
                            userId: user._id,
                            messageId,
                            processedAt: new Date()
                        });
                    }
                    else {
                        // It was a matching email but we failed to parse transaction details.
                        // If it is NOT a definite transaction email (e.g. general info newsletter),
                        // we should still mark it as processed so we don't waste time on it again.
                        // But if it is a transaction email (e.g., contains 'spent' or 'transaction'),
                        // we do NOT mark it as processed, allowing retrying if the parser is updated.
                        const emailText = emailBody.toLowerCase();
                        const isDefiniteTransaction = emailText.includes('spent') ||
                            emailText.includes('transaction') ||
                            emailText.includes('amount') ||
                            emailText.includes('rs.') ||
                            emailText.includes('inr');
                        if (!isDefiniteTransaction) {
                            await ProcessedEmail_1.ProcessedEmail.create({
                                userId: user._id,
                                messageId,
                                processedAt: new Date()
                            });
                        }
                        else {
                            logger_1.logger.warn(`[EmailSync] FAILED TO PARSE definite transaction alert. Message-ID: ${messageId}. Retaining in retry pool.`);
                        }
                    }
                }
            }
            catch (err) {
                logger_1.logger.error(`[EmailSync] Error processing message UID ${uid}:`, err);
            }
        }
        // Update user's last sync date
        user.emailSyncSettings.lastSync = new Date();
        await user.save();
    }
    finally {
        lock.release();
    }
    await client.logout();
    logger_1.logger.info(`[EmailSync] Completed sync for user ${user.email}. Added ${newExpensesCount} new expenses.`);
    return { success: true, count: newExpensesCount };
};
exports.syncEmailsForUser = syncEmailsForUser;
/**
 * Runs email synchronization for all active users.
 */
const syncAllUsers = async () => {
    try {
        const users = await User_1.User.find({ 'emailSyncSettings.enabled': true });
        if (users.length === 0)
            return;
        logger_1.logger.info(`[EmailSyncBackground] Triggering sync for ${users.length} active users...`);
        for (const user of users) {
            try {
                await (0, exports.syncEmailsForUser)(user._id.toString());
            }
            catch (err) {
                logger_1.logger.error(`[EmailSyncBackground] Failed sync for user ID ${user._id}:`, err);
            }
        }
    }
    catch (err) {
        logger_1.logger.error('[EmailSyncBackground] Error querying active users:', err);
    }
};
exports.syncAllUsers = syncAllUsers;
