import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { ImapFlow } from 'imapflow';
import { decrypt } from '../utils/crypto';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const runDiagnostics = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
  console.log(`Connecting to database: ${connString}`);
  await mongoose.connect(connString);

  // Find user with sync enabled
  const user = await User.findOne({ 'emailSyncSettings.enabled': true });
  if (!user || !user.emailSyncSettings) {
    console.error('No user found with active email sync settings.');
    process.exit(1);
  }

  const { host, port, secure, email, password } = user.emailSyncSettings;
  console.log(`\n--- Mailbox Configuration ---`);
  console.log(`User: ${user.email}`);
  console.log(`Host: ${host}:${port} (SSL: ${secure})`);
  console.log(`Email: ${email}`);
  
  const decryptedPassword = decrypt(password || '');
  if (!decryptedPassword) {
    console.error('Failed to decrypt password.');
    process.exit(1);
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: {
      user: email,
      pass: decryptedPassword
    },
    logger: false,
    connectionTimeout: 15000
  });

  try {
    console.log('\nConnecting to IMAP server...');
    await client.connect();
    console.log('Connected!');

    const lock = await client.getMailboxLock('INBOX');
    try {
      console.log(`Current mailbox: INBOX`);
      
      // Test 1: Search from alerts@axis.bank.in
      console.log('\nTesting Search 1: from: alerts@axis.bank.in');
      const search1 = await client.search({ from: 'alerts@axis.bank.in' });
      console.log(`=> Result count: ${search1 ? search1.length : 0}`);
      if (search1 && search1.length > 0) {
        console.log('Matching UIDs (from alerts@axis.bank.in):');
        for (const uid of search1) {
          const msg = await client.fetchOne(uid, { envelope: true }, { uid: true });
          if (msg && msg.envelope) {
            console.log(` - UID ${uid} | From: ${msg.envelope.from?.[0]?.address} | Subject: "${msg.envelope.subject}"`);
          }
        }
      }

      // Test 2: Search subject: Axis
      console.log('\nTesting Search 2: subject: Axis');
      const search2 = await client.search({ subject: 'Axis' });
      console.log(`=> Result count: ${search2 ? search2.length : 0}`);

      // Test 3: Search subject: spent
      console.log('\nTesting Search 3: subject: spent');
      const search3 = await client.search({ subject: 'spent' });
      console.log(`=> Result count: ${search3 ? search3.length : 0}`);
      if (search3 && search3.length > 0) {
        console.log('Matching UIDs (up to 5):', search3.slice(0, 5));
        for (const uid of search3.slice(0, 5)) {
          const msg = await client.fetchOne(uid, { envelope: true }, { uid: true });
          if (msg && msg.envelope) {
            console.log(` - UID ${uid} | From: ${msg.envelope.from?.[0]?.address} | Subject: "${msg.envelope.subject}"`);
          }
        }
      }

      // Test 4: Search seen: false
      console.log('\nTesting Search 4: seen: false');
      const search4 = await client.search({ seen: false });
      console.log(`=> Result count: ${search4 ? search4.length : 0}`);

      // Test 5: Search for ANY email in the last 20 messages to see what's in there
      console.log('\nFetching last 15 emails in inbox...');
      const allMails = await client.search({ all: true });
      if (allMails && allMails.length > 0) {
        const last15 = allMails.sort((a, b) => b - a).slice(0, 15);
        for (const uid of last15) {
          const msg = await client.fetchOne(uid, { envelope: true }, { uid: true });
          if (msg && msg.envelope) {
            console.log(` - UID ${msg.uid} | From: ${msg.envelope.from?.[0]?.address} | Subject: "${msg.envelope.subject}"`);
          }
        }
      }

    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    console.error('Error during diagnostics:', err.message);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from database.');
};

runDiagnostics();
