"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCard = void 0;
const mongoose_1 = require("mongoose");
const CreditCardSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
exports.CreditCard = (0, mongoose_1.model)('CreditCard', CreditCardSchema);
