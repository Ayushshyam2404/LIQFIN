import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Expense } from '../models/Expense';
import { ProcessedEmail } from '../models/ProcessedEmail';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDbState = async () => {
  const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
  await mongoose.connect(connString);

  console.log('--- Processed Emails ---');
  const processed = await ProcessedEmail.find();
  console.log(`Total processed emails: ${processed.length}`);
  processed.forEach(p => {
    console.log(` - UserID: ${p.userId} | Message-ID: ${p.messageId} | ProcessedAt: ${p.processedAt}`);
  });

  console.log('\n--- Expenses ---');
  const expenses = await Expense.find();
  console.log(`Total expenses: ${expenses.length}`);
  expenses.forEach(e => {
    console.log(` - Title: ${e.title} | Amount: ${e.amount} | Date: ${e.date} | Notes: ${e.notes}`);
  });

  console.log('\n--- Credit Cards ---');
  const { CreditCard } = require('../models/CreditCard');
  const cards = await CreditCard.find();
  console.log(`Total credit cards: ${cards.length}`);
  cards.forEach((c: any) => {
    console.log(` - Card: ${c.cardName} | Limit: ${c.creditLimit} | Balance: ${c.currentBalance} | LastFour: ${c.cardNumberLastFour}`);
  });

  await mongoose.disconnect();
};

checkDbState();
