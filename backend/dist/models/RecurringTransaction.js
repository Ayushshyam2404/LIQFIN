"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringTransaction = void 0;
const mongoose_1 = require("mongoose");
const RecurringTransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    paymentMethod: { type: String, required: true },
    creditCardId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CreditCard', default: null },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true, default: Date.now },
    nextExecutionDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});
// Compound indexes for optimized recurring billing execution and retrieval
RecurringTransactionSchema.index({ isActive: 1, nextExecutionDate: 1 });
RecurringTransactionSchema.index({ userId: 1, isActive: 1 });
exports.RecurringTransaction = (0, mongoose_1.model)('RecurringTransaction', RecurringTransactionSchema);
