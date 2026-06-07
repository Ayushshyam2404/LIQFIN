import { Schema, model } from 'mongoose';
import { IExpense } from '../types';

const ExpenseSchema = new Schema<IExpense>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true, index: true },
  paymentMethod: { type: String, required: true, index: true },
  creditCardId: { type: Schema.Types.ObjectId, ref: 'CreditCard', default: null },
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

export const Expense = model<IExpense>('Expense', ExpenseSchema);
