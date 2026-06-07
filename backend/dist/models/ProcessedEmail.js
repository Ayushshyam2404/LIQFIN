"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessedEmail = void 0;
const mongoose_1 = require("mongoose");
const ProcessedEmailSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messageId: { type: String, required: true, index: true },
    processedAt: { type: Date, default: Date.now }
});
// Compound index to ensure uniqueness per user and message ID
ProcessedEmailSchema.index({ userId: 1, messageId: 1 }, { unique: true });
exports.ProcessedEmail = (0, mongoose_1.model)('ProcessedEmail', ProcessedEmailSchema);
