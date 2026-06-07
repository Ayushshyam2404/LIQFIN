import { Schema, model } from 'mongoose';
import { INotification } from '../types';
import { sendPushNotification } from '../utils/webPush';

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes for optimized notification querying and sorting
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Post-save hook to trigger push notification delivery asynchronously
NotificationSchema.post('save', function (doc) {
  sendPushNotification(doc.userId.toString(), doc.title, doc.message).catch((err) => {
    console.error('Error executing Web Push post-save hook:', err);
  });
});

export const Notification = model<INotification>('Notification', NotificationSchema);
