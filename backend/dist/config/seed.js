"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load config
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const User_1 = require("../models/User");
const Expense_1 = require("../models/Expense");
const CreditCard_1 = require("../models/CreditCard");
const Budget_1 = require("../models/Budget");
const Goal_1 = require("../models/Goal");
const Notification_1 = require("../models/Notification");
const seedDatabase = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    console.log(`Seeding database at: ${connString}`);
    try {
        await mongoose_1.default.connect(connString);
        console.log('Connected to database.');
        // Clear existing collections
        console.log('Cleaning existing data...');
        await User_1.User.deleteMany({});
        await Expense_1.Expense.deleteMany({});
        await CreditCard_1.CreditCard.deleteMany({});
        await Budget_1.Budget.deleteMany({});
        await Goal_1.Goal.deleteMany({});
        await Notification_1.Notification.deleteMany({});
        console.log('Creating demo user...');
        // Create Demo User
        const demoUser = new User_1.User({
            name: 'Julian Sterling',
            email: 'demo@liquid.finance',
            password: 'password123', // Will be hashed via pre-save hook
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Julian'
        });
        await demoUser.save();
        console.log(`Demo user created: ${demoUser.email}`);
        console.log('Creating credit cards...');
        // Create Credit Cards
        const appleCard = await CreditCard_1.CreditCard.create({
            userId: demoUser._id,
            cardName: 'Titanium Card',
            bank: 'Goldman Sachs',
            creditLimit: 15000,
            currentBalance: 0, // sync later
            statementDate: 31,
            dueDate: 25,
            minimumPayment: 35,
            annualFee: 0,
            rewardsNotes: '2% Cash Back on Apple Pay, 3% on Apple products.',
            colorTheme: 'silver-blue',
            cardNumberLastFour: '4490'
        });
        const chaseCard = await CreditCard_1.CreditCard.create({
            userId: demoUser._id,
            cardName: 'Sapphire Reserve',
            bank: 'Chase Bank',
            creditLimit: 25000,
            currentBalance: 0,
            statementDate: 15,
            dueDate: 10,
            minimumPayment: 100,
            annualFee: 550,
            rewardsNotes: '3x points on dining and travel. $300 annual travel credit.',
            colorTheme: 'blue-green',
            cardNumberLastFour: '1111'
        });
        const amexCard = await CreditCard_1.CreditCard.create({
            userId: demoUser._id,
            cardName: 'Gold Card',
            bank: 'American Express',
            creditLimit: 35000,
            currentBalance: 0,
            statementDate: 5,
            dueDate: 28,
            minimumPayment: 150,
            annualFee: 250,
            rewardsNotes: '4x points on restaurants and US supermarkets.',
            colorTheme: 'gold-black',
            cardNumberLastFour: '3333'
        });
        console.log('Creating budgets...');
        // Create Budgets for Current Month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const budgets = [
            { userId: demoUser._id, category: 'Food', limit: 600, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'Groceries', limit: 400, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'Shopping', limit: 800, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'Travel', limit: 1200, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'Entertainment', limit: 300, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'Bills', limit: 1500, spent: 0, month: currentMonth },
            { userId: demoUser._id, category: 'all', limit: 5000, spent: 0, month: currentMonth }
        ];
        await Budget_1.Budget.insertMany(budgets);
        console.log('Creating savings goals...');
        // Create Savings Goals
        const inSixMonths = new Date();
        inSixMonths.setMonth(inSixMonths.getMonth() + 6);
        const inOneYear = new Date();
        inOneYear.setFullYear(inOneYear.getFullYear() + 1);
        const goals = [
            {
                userId: demoUser._id,
                title: 'Emergency Fund',
                targetAmount: 15000,
                currentAmount: 12000,
                category: 'emergency_fund',
                deadline: inSixMonths
            },
            {
                userId: demoUser._id,
                title: 'Iceland Adventure',
                targetAmount: 6000,
                currentAmount: 3500,
                category: 'vacation',
                deadline: inSixMonths
            },
            {
                userId: demoUser._id,
                title: 'Tesla Roadster Downpayment',
                targetAmount: 50000,
                currentAmount: 15000,
                category: 'car',
                deadline: inOneYear
            }
        ];
        await Goal_1.Goal.insertMany(goals);
        console.log('Creating historic expenses...');
        // Create Expenses for last 30 days
        const expensesList = [
            // Food & Restaurants
            { title: 'St. Regis Dinner', amount: 342.50, category: 'Food', paymentMethod: 'credit_card', creditCardId: amexCard._id, daysAgo: 1, notes: 'Celebration dinner with team' },
            { title: 'Starbucks Coffee', amount: 12.80, category: 'Food', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 2 },
            { title: 'Nobu Sushi', amount: 185.00, category: 'Food', paymentMethod: 'credit_card', creditCardId: amexCard._id, daysAgo: 5, notes: 'Client lunch' },
            { title: 'Sweetgreen Salad', amount: 18.50, category: 'Food', paymentMethod: 'debit_card', daysAgo: 7 },
            { title: 'Blue Bottle Espresso', amount: 6.75, category: 'Food', paymentMethod: 'upi', daysAgo: 12 },
            { title: 'Subway Sandwich', amount: 14.20, category: 'Food', paymentMethod: 'cash', daysAgo: 15 },
            // Groceries
            { title: 'Whole Foods Market', amount: 184.20, category: 'Groceries', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 3 },
            { title: 'Trader Joes', amount: 92.40, category: 'Groceries', paymentMethod: 'debit_card', daysAgo: 10 },
            { title: 'Erewhon Organic', amount: 245.00, category: 'Groceries', paymentMethod: 'credit_card', creditCardId: amexCard._id, daysAgo: 14 },
            // Shopping
            { title: 'Apple Store - AirPods Max', amount: 549.00, category: 'Shopping', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 4, notes: 'Noise cancelling headphones for office' },
            { title: 'Nike Store - running shoes', amount: 180.00, category: 'Shopping', paymentMethod: 'credit_card', creditCardId: chaseCard._id, daysAgo: 11 },
            { title: 'Zara Leather Jacket', amount: 250.00, category: 'Shopping', paymentMethod: 'credit_card', creditCardId: chaseCard._id, daysAgo: 20 },
            // Travel
            { title: 'Delta Air Lines Flight', amount: 720.00, category: 'Travel', paymentMethod: 'credit_card', creditCardId: chaseCard._id, daysAgo: 6, notes: 'Flight to Aspen' },
            { title: 'Uber Premium Ride', amount: 64.30, category: 'Travel', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 8 },
            { title: 'Hotel Jerome Aspen', amount: 1850.00, category: 'Travel', paymentMethod: 'credit_card', creditCardId: chaseCard._id, daysAgo: 6, notes: 'Ski trip weekend' },
            // Bills & Utilities
            { title: 'Equinox Gym Membership', amount: 275.00, category: 'Bills', paymentMethod: 'credit_card', creditCardId: amexCard._id, daysAgo: 9 },
            { title: 'High-speed Fiber Internet', amount: 85.00, category: 'Bills', paymentMethod: 'debit_card', daysAgo: 16 },
            { title: 'Netflix & Spotify Premium', amount: 35.48, category: 'Bills', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 22 },
            // Transportation
            { title: 'Chevron Gas Station', amount: 65.00, category: 'Transportation', paymentMethod: 'credit_card', creditCardId: appleCard._id, daysAgo: 13 },
            { title: 'Supercharger Charging', amount: 32.50, category: 'Transportation', paymentMethod: 'credit_card', creditCardId: amexCard._id, daysAgo: 25 },
            // Healthcare
            { title: 'Dental Cleanse', amount: 120.00, category: 'Healthcare', paymentMethod: 'debit_card', daysAgo: 18 }
        ];
        for (const exp of expensesList) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() - exp.daysAgo);
            await Expense_1.Expense.create({
                userId: demoUser._id,
                title: exp.title,
                amount: exp.amount,
                category: exp.category,
                paymentMethod: exp.paymentMethod,
                creditCardId: exp.creditCardId || null,
                date: expDate,
                notes: exp.notes || '',
                tags: [exp.category.toLowerCase(), exp.paymentMethod.replace('_', '')]
            });
        }
        console.log('Syncing credit card balances...');
        // Sync Card balances based on expenses
        const cardsList = [appleCard, chaseCard, amexCard];
        for (const card of cardsList) {
            const totalCardSpentAgg = await Expense_1.Expense.aggregate([
                {
                    $match: {
                        userId: demoUser._id,
                        paymentMethod: 'credit_card',
                        creditCardId: card._id
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            card.currentBalance = totalCardSpentAgg[0]?.total || 0;
            await card.save();
        }
        console.log('Syncing category budgets...');
        // Sync Budget spent details
        const activeBudgets = await Budget_1.Budget.find({ userId: demoUser._id, month: currentMonth });
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        for (const budget of activeBudgets) {
            const matchFilter = {
                userId: demoUser._id,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            };
            if (budget.category !== 'all') {
                matchFilter.category = budget.category;
            }
            const spentAgg = await Expense_1.Expense.aggregate([
                { $match: matchFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            budget.spent = spentAgg[0]?.total || 0;
            await budget.save();
        }
        console.log('Creating notifications...');
        // Seed Notifications
        const notificationsList = [
            {
                userId: demoUser._id,
                title: 'Sapphire Reserve Payment Due',
                message: 'Your credit card Chase Sapphire Reserve has a payment due in 4 days (June 10) of $3,200.00.',
                type: 'warning',
                read: false
            },
            {
                userId: demoUser._id,
                title: 'Savings Milestone Achieved',
                message: 'You have reached 80% completion of your "Emergency Fund" savings goal. Keep it up!',
                type: 'success',
                read: false
            },
            {
                userId: demoUser._id,
                title: 'Monthly Budget Limit Warning',
                message: 'You have exhausted 94% of your total "Food" budget for this month.',
                type: 'info',
                read: true
            }
        ];
        await Notification_1.Notification.insertMany(notificationsList);
        console.log('=============================================');
        console.log('  Database Seeding Completed Successfully!  ');
        console.log(`  Demo Login Credentials:`);
        console.log(`  Email: demo@liquid.finance`);
        console.log(`  Password: password123`);
        console.log('=============================================');
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from database.');
    }
};
seedDatabase();
