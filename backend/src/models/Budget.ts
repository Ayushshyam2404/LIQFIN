import { Schema, model } from 'mongoose';
import { IBudget } from '../types';

const BudgetSchema = new Schema<IBudget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true }, // 'all' or a specific category name
  limit: { type: Number, required: true, min: 0 },
  spent: { type: Number, required: true, default: 0, min: 0 },
  month: { type: String, required: true, index: true }, // Format: 'YYYY-MM'
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate category budget in the same month for a user
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export const Budget = model<IBudget>('Budget', BudgetSchema);
