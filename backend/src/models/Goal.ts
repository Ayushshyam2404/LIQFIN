import { Schema, model } from 'mongoose';
import { IGoal } from '../types';

const GoalSchema = new Schema<IGoal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, required: true, default: 0, min: 0 },
  category: { type: String, default: 'other' }, // 'emergency_fund' | 'vacation' | 'car' | 'house' | 'investment' | 'other'
  deadline: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for optimizing sorting by deadline per user
GoalSchema.index({ userId: 1, deadline: 1 });

export const Goal = model<IGoal>('Goal', GoalSchema);
