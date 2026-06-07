import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { ImapFlow } from 'imapflow';
import { decrypt } from '../utils/crypto';
import { extractEmailBody } from '../utils/mimeParser';
import { parseTransactionEmail } from '../utils/emailParser';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testFetchAndParse = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
  await mongoose.connect(connString);

  const user = await User.findOne({ 'emailSyncSettings.enabled': true });
  if (!user || !user.emailSyncSettings) {
    console.error('No user found');
    process.exit(1);
  }

  const { host, port, secure, email, password } = user.emailSyncSettings;
  const decryptedPassword = decrypt(password || '');

  const client = new ImapFlow({
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
      } else {
        console.log(`\n--- Envelope ---`);
        console.log(`From: ${message.envelope.from?.[0]?.address}`);
        console.log(`Subject: "${message.envelope.subject}"`);
        
        const rawContent = message.source.toString();
        const emailBody = extractEmailBody(rawContent);
        
        console.log(`\n--- Extracted Body Text ---`);
        console.log(emailBody);
        console.log(`----------------------------`);
        
        const parsed = parseTransactionEmail(emailBody);
        console.log(`\n--- Parsed Transaction Object ---`);
        console.log(JSON.stringify(parsed, null, 2));
        console.log(`---------------------------------`);
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    console.error('Error:', err.message);
  }
  await mongoose.disconnect();
};

testFetchAndParse();
