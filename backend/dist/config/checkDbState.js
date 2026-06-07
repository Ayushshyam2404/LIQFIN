"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Expense_1 = require("../models/Expense");
const ProcessedEmail_1 = require("../models/ProcessedEmail");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const checkDbState = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    await mongoose_1.default.connect(connString);
    console.log('--- Processed Emails ---');
    const processed = await ProcessedEmail_1.ProcessedEmail.find();
    console.log(`Total processed emails: ${processed.length}`);
    processed.forEach(p => {
        console.log(` - UserID: ${p.userId} | Message-ID: ${p.messageId} | ProcessedAt: ${p.processedAt}`);
    });
    console.log('\n--- Expenses ---');
    const expenses = await Expense_1.Expense.find();
    console.log(`Total expenses: ${expenses.length}`);
    expenses.forEach(e => {
        console.log(` - Title: ${e.title} | Amount: ${e.amount} | Date: ${e.date} | Notes: ${e.notes}`);
    });
    console.log('\n--- Credit Cards ---');
    const { CreditCard } = require('../models/CreditCard');
    const cards = await CreditCard.find();
    console.log(`Total credit cards: ${cards.length}`);
    cards.forEach((c) => {
        console.log(` - Card: ${c.cardName} | Limit: ${c.creditLimit} | Balance: ${c.currentBalance} | LastFour: ${c.cardNumberLastFour}`);
    });
    await mongoose_1.default.disconnect();
};
checkDbState();
