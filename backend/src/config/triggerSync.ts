import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { syncAllUsers } from '../utils/emailSyncService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
  await mongoose.connect(connString);
  console.log('Database connected. Triggering sync...');
  try {
    await syncAllUsers();
  } catch (err) {
    console.error('Error during sync:', err);
  }
  await mongoose.disconnect();
  console.log('Sync script completed.');
};

run();
