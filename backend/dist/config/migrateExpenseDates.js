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
const imapflow_1 = require("imapflow");
const crypto_1 = require("../utils/crypto");
const mimeParser_1 = require("../utils/mimeParser");
const emailParser_1 = require("../utils/emailParser");
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
            console.log(`Evaluating ${messages.length} email headers to update existing expense dates...`);
            let updateCount = 0;
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
                    // The expense notes contain: `Auto-parsed from email: "${subject}"...`
                    // Let's search by notes
                    const matchingExpense = await Expense_1.Expense.findOne({
                        userId: user._id,
                        notes: { $regex: new RegExp(escapeRegExp(subject), 'i') }
                    });
                    if (matchingExpense) {
                        console.log(`Found matching expense in DB: "${matchingExpense.title}" (Amount: ${matchingExpense.amount}) for subject "${subject}"`);
                        // Fetch the email body to parse the exact transaction date
                        const fullMessage = await client.fetchOne(message.uid, { source: true }, { uid: true });
                        if (fullMessage && fullMessage.source) {
                            const rawContent = fullMessage.source.toString();
                            const emailBody = (0, mimeParser_1.extractEmailBody)(rawContent);
                            const parsed = (0, emailParser_1.parseTransactionEmail)(emailBody);
                            const transactionDate = (parsed && parsed.date) || message.envelope.date || new Date();
                            console.log(`Updating date from "${matchingExpense.date}" to "${transactionDate}"`);
                            matchingExpense.date = transactionDate;
                            await matchingExpense.save();
                            updateCount++;
                        }
                    }
                }
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
