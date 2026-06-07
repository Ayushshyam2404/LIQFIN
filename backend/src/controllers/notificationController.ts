import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    await Notification.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const clearNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    await Notification.deleteMany({ userId: new Types.ObjectId(userId) });

    res.status(200).json({ success: true, message: 'All notifications cleared successfully' });
  } catch (error) {
    next(error);
  }
};

import { getVapidPublicKey } from '../utils/webPush';
import { User } from '../models/User';

export const getVapidKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vapidKey = getVapidPublicKey();
    res.status(200).json({ success: true, publicKey: vapidKey });
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ success: false, message: 'Invalid subscription payload' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check if endpoint is already registered
    const exists = user.pushSubscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ success: true, message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({ success: false, message: 'Endpoint is required to unsubscribe' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.pushSubscriptions) {
      user.pushSubscriptions = user.pushSubscriptions.filter((sub: any) => sub.endpoint !== endpoint);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    next(error);
  }
};
