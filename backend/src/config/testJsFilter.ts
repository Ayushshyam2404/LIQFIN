import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { ImapFlow } from 'imapflow';
import { decrypt } from '../utils/crypto';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testJsFilter = async () => {
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
      if (!client.mailbox) {
        console.error('Mailbox not open.');
        return;
      }
      console.log('Opened INBOX. Mailbox exists count:', client.mailbox.exists);
      
      const totalMessages = client.mailbox.exists;
      if (totalMessages === 0) {
        console.log('No messages in inbox.');
      } else {
        // Fetch last 150 messages in INBOX
        const startSeq = Math.max(1, totalMessages - 150);
        const range = `${startSeq}:${totalMessages}`;
        console.log(`Fetching envelopes for range: ${range}...`);

        let matchCount = 0;
        
        // Fetch all envelopes in the range
        for await (let message of client.fetch(range, { envelope: true })) {
          if (!message.envelope) continue;
          const subject = message.envelope.subject || '';
          const fromAddress = message.envelope.from && message.envelope.from[0]
            ? `${message.envelope.from[0].address}`.toLowerCase()
            : '';
          
          const isAxisBank = fromAddress.includes('alerts@axis.bank.in') || fromAddress.includes('axis.bank');
          const isTransaction = subject.toLowerCase().includes('transaction') ||
                               subject.toLowerCase().includes('alert') ||
                               subject.toLowerCase().includes('spent') ||
                               subject.toLowerCase().includes('card');
          
          if (isAxisBank || isTransaction || subject.includes('2629') || subject.toLowerCase().includes('inr')) {
            console.log(`[MATCH] UID ${message.uid} | From: ${fromAddress} | Subject: "${subject}"`);
            matchCount++;
          }
        }
        console.log(`\nScan complete. Found ${matchCount} matches in Javascript filtering.`);
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

testJsFilter();
