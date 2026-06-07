"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
const mongoose_1 = require("mongoose");
const ExpenseSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    paymentMethod: { type: String, required: true, index: true },
    creditCardId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CreditCard', default: null },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, default: '' },
    receipt: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    createdAt: { type: Date, default: Date.now }
});
// Compound indexes for optimized query performance
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1, date: -1 });
ExpenseSchema.index({ userId: 1, paymentMethod: 1, date: -1 });
exports.Expense = (0, mongoose_1.model)('Expense', ExpenseSchema);
