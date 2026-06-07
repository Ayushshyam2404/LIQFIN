"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("../models/User");
const Expense_1 = require("../models/Expense");
const CreditCard_1 = require("../models/CreditCard");
const Notification_1 = require("../models/Notification");
const Budget_1 = require("../models/Budget");
const expenseController_1 = require("../controllers/expenseController");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const testWebhook = async () => {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/liquid-finance';
    console.log(`[TEST] Connecting to database at: ${connString}`);
    try {
        await mongoose_1.default.connect(connString);
        console.log('[TEST] Connected to database.');
        // 1. Ensure demo user exists
        let user = await User_1.User.findOne({ email: 'demo@liquid.finance' });
        if (!user) {
            console.log('[TEST] Demo user not found. Creating a temp demo user...');
            user = await User_1.User.create({
                name: 'Test Julian',
                email: 'demo@liquid.finance',
                password: 'password123'
            });
        }
        // Ensure we delete any existing card with digits '2629' to test dynamic card creation
        await CreditCard_1.CreditCard.deleteMany({ userId: user._id, cardNumberLastFour: '2629' });
        await Expense_1.Expense.deleteMany({ userId: user._id, tags: 'email-webhook' });
        await Notification_1.Notification.deleteMany({ userId: user._id, title: 'Email Alert Parsed' });
        // Ensure budget for category 'Food' and 'all' exists for current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await Budget_1.Budget.deleteMany({ userId: user._id, month: currentMonth });
        await Budget_1.Budget.create([
            { userId: user._id, category: 'Food', limit: 500, spent: 0, month: currentMonth },
            { userId: user._id, category: 'all', limit: 2000, spent: 0, month: currentMonth }
        ]);
        // 2. Setup mock request containing the Axis Bank email body
        const emailContent = `
INR 294 spent on credit card no. XX2629
Inbox

Axis Bank Alerts <alerts@axis.bank.in>
5:18 PM (55 minutes ago)
to me


CLICK HERE

06-06-2026

Dear Ayush Shyam,


Here's the summary of your Axis Bank Credit Card Transaction:
	
Transaction Amount:
INR 294
	
Merchant Name:
TATA STARBU
	
Axis Bank Credit Card No.
XX2629
	
Date & Time:
06-06-2026, 17:17:58 IST
	
Available Limit*:
INR 29506
	
Total Credit Limit*:
INR 30000
*The information above includes the available and total credit limit across all of your Axis Bank credit cards.
If this transaction was not intiated by you:
SMS BLOCK 2629  to +919951860002

or

Call us at:
18001035577 (Toll Free)
18604195555 (Charges Applicable)
Always open to help you.
`;
        const req = {
            body: { emailContent },
            query: { email: 'demo@liquid.finance' }
        };
        let responseStatus = 0;
        let responseData = null;
        const res = {
            status: (code) => {
                responseStatus = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            }
        };
        const next = (err) => {
            if (err) {
                console.error('[TEST] Next called with error:', err);
            }
        };
        console.log('[TEST] Triggering handleEmailWebhook...');
        await (0, expenseController_1.handleEmailWebhook)(req, res, next);
        console.log(`[TEST] Response Status: ${responseStatus}`);
        console.log('[TEST] Response Data:', JSON.stringify(responseData, null, 2));
        // 3. Assertions
        if (responseStatus !== 201) {
            throw new Error(`Expected response status 201, got ${responseStatus}`);
        }
        if (!responseData.success) {
            throw new Error('Expected response success to be true');
        }
        const { expense, card } = responseData;
        console.log('\n--- VERIFYING RESULTS IN DATABASE ---');
        // Verify Card
        const dbCard = await CreditCard_1.CreditCard.findById(card._id);
        if (!dbCard) {
            throw new Error('Card was not found in the database');
        }
        console.log(`[OK] Card Created: "${dbCard.cardName}" (${dbCard.bank}) with last four digits "${dbCard.cardNumberLastFour}"`);
        if (dbCard.cardNumberLastFour !== '2629') {
            throw new Error(`Expected card digits 2629, got ${dbCard.cardNumberLastFour}`);
        }
        // Expected Limit: 30000 INR / 83 = 361 USD (rounded)
        if (dbCard.creditLimit !== 361) {
            throw new Error(`Expected creditLimit 361, got ${dbCard.creditLimit}`);
        }
        console.log(`[OK] Card creditLimit matches parsed USD amount: $${dbCard.creditLimit}`);
        // Verify Expense
        const dbExpense = await Expense_1.Expense.findById(expense._id);
        if (!dbExpense) {
            throw new Error('Expense was not found in database');
        }
        console.log(`[OK] Expense Logged: "${dbExpense.title}" of amount $${dbExpense.amount} under category "${dbExpense.category}"`);
        if (dbExpense.title !== 'TATA STARBU') {
            throw new Error(`Expected title TATA STARBU, got ${dbExpense.title}`);
        }
        if (dbExpense.amount !== 3.54) {
            throw new Error(`Expected amount 3.54, got ${dbExpense.amount}`);
        }
        if (dbExpense.category !== 'Food') {
            throw new Error(`Expected category Food, got ${dbExpense.category}`);
        }
        if (dbExpense.paymentMethod !== 'credit_card') {
            throw new Error(`Expected paymentMethod credit_card, got ${dbExpense.paymentMethod}`);
        }
        if (!dbExpense.notes?.includes('INR 294')) {
            throw new Error(`Expected notes to contain original amount info, got: ${dbExpense.notes}`);
        }
        console.log('[OK] Expense fields parsed and stored correctly.');
        // Verify Card Balance synchronization
        const refreshedCard = await CreditCard_1.CreditCard.findById(card._id);
        console.log(`[OK] Card Balance updated to: $${refreshedCard?.currentBalance}`);
        if (refreshedCard?.currentBalance !== 3.54) {
            throw new Error(`Expected card currentBalance 3.54, got ${refreshedCard?.currentBalance}`);
        }
        // Verify Budget sync
        const dbBudget = await Budget_1.Budget.findOne({ userId: user._id, category: 'Food', month: currentMonth });
        console.log(`[OK] Budget for Food updated: spent $${dbBudget?.spent} of $${dbBudget?.limit}`);
        if (dbBudget && dbBudget.spent < 3.54) {
            throw new Error(`Expected Food budget spent to be at least 3.54, got ${dbBudget?.spent}`);
        }
        // Verify Notification
        const dbNotification = await Notification_1.Notification.findOne({ userId: user._id, title: 'Email Alert Parsed' });
        if (!dbNotification) {
            throw new Error('Confirmation notification was not created');
        }
        console.log(`[OK] User Notification Created: "${dbNotification.message}"`);
        console.log('\n[TEST SUCCESS] All integrations work flawlessly!');
    }
    catch (error) {
        console.error('[TEST FAILED]', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('[TEST] Disconnected from database.');
    }
};
testWebhook();
