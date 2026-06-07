"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const mongoose_1 = require("mongoose");
const BudgetSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true }, // 'all' or a specific category name
    limit: { type: Number, required: true, min: 0 },
    spent: { type: Number, required: true, default: 0, min: 0 },
    month: { type: String, required: true, index: true }, // Format: 'YYYY-MM'
    createdAt: { type: Date, default: Date.now }
});
// Compound index to prevent duplicate category budget in the same month for a user
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });
exports.Budget = (0, mongoose_1.model)('Budget', BudgetSchema);
