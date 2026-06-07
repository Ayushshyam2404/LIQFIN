"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("../models/User");
const imapflow_1 = require("imapflow");
const crypto_1 = require("../utils/crypto");
const mimeParser_1 = require("../utils/mimeParser");
const emailParser_1 = require("../utils/emailParser");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const testFetchAndParse = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    await mongoose_1.default.connect(connString);
    const user = await User_1.User.findOne({ 'emailSyncSettings.enabled': true });
    if (!user || !user.emailSyncSettings) {
        console.error('No user found');
        process.exit(1);
    }
    const { host, port, secure, email, password } = user.emailSyncSettings;
    const decryptedPassword = (0, crypto_1.decrypt)(password || '');
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
            const uid = 5519; // The UID for "INR 1539.1 spent..."
            console.log(`Fetching UID ${uid} from INBOX...`);
            const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
            if (!message || !message.source || !message.envelope) {
                console.error(`UID ${uid} not found, source or envelope empty.`);
            }
            else {
                console.log(`\n--- Envelope ---`);
                console.log(`From: ${message.envelope.from?.[0]?.address}`);
                console.log(`Subject: "${message.envelope.subject}"`);
                const rawContent = message.source.toString();
                const emailBody = (0, mimeParser_1.extractEmailBody)(rawContent);
                console.log(`\n--- Extracted Body Text ---`);
                console.log(emailBody);
                console.log(`----------------------------`);
                const parsed = (0, emailParser_1.parseTransactionEmail)(emailBody);
                console.log(`\n--- Parsed Transaction Object ---`);
                console.log(JSON.stringify(parsed, null, 2));
                console.log(`---------------------------------`);
            }
        }
        finally {
            lock.release();
        }
        await client.logout();
    }
    catch (err) {
        console.error('Error:', err.message);
    }
    await mongoose_1.default.disconnect();
};
testFetchAndParse();
