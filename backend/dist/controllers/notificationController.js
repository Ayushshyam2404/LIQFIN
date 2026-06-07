"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNotifications = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const mongoose_1 = require("mongoose");
const Notification_1 = require("../models/Notification");
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification_1.Notification.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: notifications.length, notifications });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.status(200).json({ success: true, notification });
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await Notification_1.Notification.updateMany({ userId: new mongoose_1.Types.ObjectId(userId), read: false }, { $set: { read: true } });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllAsRead = markAllAsRead;
const clearNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await Notification_1.Notification.deleteMany({ userId: new mongoose_1.Types.ObjectId(userId) });
        res.status(200).json({ success: true, message: 'All notifications cleared successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.clearNotifications = clearNotifications;
