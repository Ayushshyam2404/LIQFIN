import { Schema, model } from 'mongoose';
import { ICreditCard } from '../types';

const CreditCardSchema = new Schema<ICreditCard>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardName: { type: String, required: true, trim: true },
  bank: { type: String, required: true, trim: true },
  creditLimit: { type: Number, required: true, min: 0 },
  currentBalance: { type: Number, required: true, default: 0, min: 0 },
  statementDate: { type: Number, required: true, min: 1, max: 31 },
  dueDate: { type: Number, required: true, min: 1, max: 31 },
  minimumPayment: { type: Number, required: true, default: 0, min: 0 },
  annualFee: { type: Number, required: true, default: 0, min: 0 },
  rewardsNotes: { type: String, default: '' },
  colorTheme: { type: String, default: 'purple-pink' }, // 'purple-pink' | 'blue-green' | 'gold-black' | 'silver-blue'
  cardNumberLastFour: { type: String, default: '0000', trim: true },
  createdAt: { type: Date, default: Date.now }
});

export const CreditCard = model<ICreditCard>('CreditCard', CreditCardSchema);
