"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringSchema = exports.goalSchema = exports.budgetSchema = exports.creditCardSchema = exports.expenseSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Please enter a valid email'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    avatar: zod_1.z.string().optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.expenseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    category: zod_1.z.string().min(1, 'Category is required'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    creditCardId: zod_1.z.string().nullable().optional(),
    date: zod_1.z.string().or(zod_1.z.date()).optional(),
    notes: zod_1.z.string().optional(),
    receipt: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
exports.creditCardSchema = zod_1.z.object({
    cardName: zod_1.z.string().min(1, 'Card name is required'),
    bank: zod_1.z.string().min(1, 'Bank is required'),
    creditLimit: zod_1.z.number().positive('Credit limit must be greater than zero'),
    currentBalance: zod_1.z.number().nonnegative('Current balance cannot be negative').optional(),
    statementDate: zod_1.z.number().min(1).max(31, 'Statement date must be between 1 and 31'),
    dueDate: zod_1.z.number().min(1).max(31, 'Due date must be between 1 and 31'),
    minimumPayment: zod_1.z.number().nonnegative('Minimum payment cannot be negative').optional(),
    annualFee: zod_1.z.number().nonnegative('Annual fee cannot be negative').optional(),
    rewardsNotes: zod_1.z.string().optional(),
    colorTheme: zod_1.z.string().optional(),
    cardNumberLastFour: zod_1.z.string().optional()
});
exports.budgetSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'Category is required'),
    limit: zod_1.z.number().positive('Limit must be greater than zero'),
    month: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
});
exports.goalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    targetAmount: zod_1.z.number().positive('Target amount must be greater than zero'),
    currentAmount: zod_1.z.number().nonnegative('Current amount cannot be negative').optional(),
    category: zod_1.z.string().optional(),
    deadline: zod_1.z.string().or(zod_1.z.date())
});
exports.recurringSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    category: zod_1.z.string().min(1, 'Category is required'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    creditCardId: zod_1.z.string().nullable().optional(),
    frequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    notes: zod_1.z.string().optional()
});
