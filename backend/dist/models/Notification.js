"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
});
// Compound indexes for optimized notification querying and sorting
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
