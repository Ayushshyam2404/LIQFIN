"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("../models/User");
const Expense_1 = require("../models/Expense");
const CreditCard_1 = require("../models/CreditCard");
const imapflow_1 = require("imapflow");
const crypto_1 = require("../utils/crypto");
const mimeParser_1 = require("../utils/mimeParser");
const emailParser_1 = require("../utils/emailParser");
const expenseController_1 = require("../controllers/expenseController");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const runMigration = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    await mongoose_1.default.connect(connString);
    console.log('Connected to MongoDB.');
    const user = await User_1.User.findOne({ 'emailSyncSettings.enabled': true });
    if (!user || !user.emailSyncSettings) {
        console.error('No active user with email sync found');
        await mongoose_1.default.disconnect();
        return;
    }
    const { host, port, secure, email, password } = user.emailSyncSettings;
    const decryptedPassword = (0, crypto_1.decrypt)(password || '');
    if (!decryptedPassword) {
        console.error('Failed to decrypt email password');
        await mongoose_1.default.disconnect();
        return;
    }
    const client = new imapflow_1.ImapFlow({
        host,
        port,
        secure,
        auth: { user: email, pass: decryptedPassword },
        logger: false
    });
    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            if (!client.mailbox) {
                console.error('Mailbox not open.');
                return;
            }
            const totalMessages = client.mailbox.exists;
            const startSeq = Math.max(1, totalMessages - 150);
            const range = `${startSeq}:${totalMessages}`;
            console.log(`Fetching last 150 emails (range: ${range})...`);
            const messages = [];
            for await (let message of client.fetch(range, { envelope: true })) {
                if (message && message.envelope) {
                    messages.push(message);
                }
            }
            console.log(`Evaluating ${messages.length} email headers to update existing expense amounts...`);
            let updateCount = 0;
            let cardIdToSync = null;
            for (const message of messages) {
                const subject = message.envelope.subject || '';
                const fromAddress = message.envelope.from && message.envelope.from[0]
                    ? `${message.envelope.from[0].address}`.toLowerCase()
                    : '';
                const isAxisBank = fromAddress.includes('alerts@axis.bank.in') || fromAddress.includes('axis.bank');
                const isTransaction = subject.toLowerCase().includes('transaction') ||
                    subject.toLowerCase().includes('alert') ||
                    subject.toLowerCase().includes('spent') ||
                    subject.toLowerCase().includes('card');
                if (isAxisBank || isTransaction) {
                    // Find matching expense in database
                    const matchingExpense = await Expense_1.Expense.findOne({
                        userId: user._id,
                        notes: { $regex: new RegExp(escapeRegExp(subject), 'i') }
                    });
                    if (matchingExpense) {
                        console.log(`Found matching expense in DB: "${matchingExpense.title}" (Amount currently: ${matchingExpense.amount})`);
                        // Fetch the email body to parse the exact transaction amount
                        const fullMessage = await client.fetchOne(message.uid, { source: true }, { uid: true });
                        if (fullMessage && fullMessage.source) {
                            const rawContent = fullMessage.source.toString();
                            const emailBody = (0, mimeParser_1.extractEmailBody)(rawContent);
                            const parsed = (0, emailParser_1.parseTransactionEmail)(emailBody);
                            if (parsed) {
                                console.log(`Updating amount from "${matchingExpense.amount}" to "${parsed.amount}"`);
                                matchingExpense.amount = parsed.amount;
                                await matchingExpense.save();
                                // Find and update the credit card creditLimit if parsed
                                if (parsed.creditLimit) {
                                    let card = await CreditCard_1.CreditCard.findOne({ userId: user._id, cardNumberLastFour: parsed.cardDigits });
                                    if (card) {
                                        console.log(`Updating credit limit of card ending in ${parsed.cardDigits} to "${parsed.creditLimit}"`);
                                        card.creditLimit = parsed.creditLimit;
                                        await card.save();
                                        cardIdToSync = card._id.toString();
                                    }
                                }
                                // Sync budget for this category
                                await (0, expenseController_1.syncBudgetAndNotify)(user._id.toString(), matchingExpense.category, matchingExpense.date);
                                updateCount++;
                            }
                        }
                    }
                }
            }
            if (cardIdToSync) {
                console.log(`Syncing credit card balance for card ID: ${cardIdToSync}`);
                await (0, expenseController_1.syncCreditCardBalance)(cardIdToSync, user._id.toString());
            }
            console.log(`Migration complete. Updated ${updateCount} expenses.`);
        }
        finally {
            lock.release();
        }
        await client.logout();
    }
    catch (err) {
        console.error('Error during migration:', err.message);
    }
    await mongoose_1.default.disconnect();
};
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
runMigration();
