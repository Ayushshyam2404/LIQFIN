import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const clearCache = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
  console.log(`Connecting to: ${connString}`);
  await mongoose.connect(connString);
  try {
    const db = mongoose.connection.db;
    if (db) {
      await db.dropCollection('processedemails');
      console.log('Successfully dropped processedemails collection!');
    } else {
      console.error('Database connection not established.');
    }
  } catch (err) {
    console.log('Collection not found or already empty.');
  }
  await mongoose.disconnect();
};

clearCache();
