import { Schema, model } from 'mongoose';
import { IRecurringTransaction } from '../types';

const RecurringTransactionSchema = new Schema<IRecurringTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  paymentMethod: { type: String, required: true },
  creditCardId: { type: Schema.Types.ObjectId, ref: 'CreditCard', default: null },
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

export const RecurringTransaction = model<IRecurringTransaction>('RecurringTransaction', RecurringTransactionSchema);
