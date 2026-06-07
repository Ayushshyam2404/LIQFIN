"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goal = void 0;
const mongoose_1 = require("mongoose");
const GoalSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, default: 'other' }, // 'emergency_fund' | 'vacation' | 'car' | 'house' | 'investment' | 'other'
    deadline: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});
// Compound index for optimizing sorting by deadline per user
GoalSchema.index({ userId: 1, deadline: 1 });
exports.Goal = (0, mongoose_1.model)('Goal', GoalSchema);
