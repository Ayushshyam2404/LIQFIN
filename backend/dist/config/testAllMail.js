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
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const testAllMail = async () => {
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
        // List all mailboxes
        console.log('--- Mailbox List ---');
        const mailboxes = await client.list();
        const folderPaths = mailboxes.map(box => box.path);
        console.log('Folders to scan:', folderPaths);
        // Keywords to search for in subjects
        const keywords = ['spent', 'Axis', '2629'];
        for (const folder of folderPaths) {
            if (folder === '[Gmail]')
                continue; // Skip the parent category folder
            try {
                console.log(`\n--------------------------------------`);
                console.log(`Scanning folder: ${folder}`);
                const lock = await client.getMailboxLock(folder);
                try {
                    for (const keyword of keywords) {
                        const searchResult = await client.search({ subject: keyword });
                        if (searchResult && searchResult.length > 0) {
                            console.log(` => Found ${searchResult.length} emails with subject keyword '${keyword}':`);
                            for (const uid of searchResult) {
                                const msg = await client.fetchOne(uid, { envelope: true }, { uid: true });
                                if (msg && msg.envelope) {
                                    console.log(`   * UID ${uid} | From: ${msg.envelope.from?.[0]?.address} | Subject: "${msg.envelope.subject}"`);
                                }
                            }
                        }
                    }
                }
                finally {
                    lock.release();
                }
            }
            catch (err) {
                console.log(` => Failed to scan folder ${folder}: ${err.message}`);
            }
        }
        await client.logout();
    }
    catch (err) {
        console.error('Error:', err.message);
    }
    await mongoose_1.default.disconnect();
};
testAllMail();
