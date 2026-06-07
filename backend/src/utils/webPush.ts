import webpush from 'web-push';
import { User } from '../models/User';
import { logger } from './logger';

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Auto-generate keys for local environments if not provided in .env
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  logger.warn('VAPID keys not configured in environment variables. Generating temporary VAPID keys...');
  try {
    const keys = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    };
  } catch (err) {
    logger.error('Failed to generate VAPID keys', err);
  }
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:support@liquid.finance',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export const getVapidPublicKey = () => vapidKeys.publicKey;

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({ title, body, ...data });
    const staleSubscriptions: string[] = [];

    const sendPromises = user.pushSubscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payload
        );
      } catch (err: any) {
        // Handle expired/invalid subscriptions (HTTP 410 Gone or 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          logger.info(`Removing stale push subscription: ${sub.endpoint}`);
          staleSubscriptions.push(sub.endpoint);
        } else {
          logger.error(`Error sending push notification to endpoint: ${sub.endpoint}`, err);
        }
      }
    });

    await Promise.all(sendPromises);

    // Clean up stale subscriptions from DB
    if (staleSubscriptions.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        (sub: any) => !staleSubscriptions.includes(sub.endpoint)
      );
      await user.save();
    }
  } catch (error) {
    logger.error(`Failed to trigger push notifications for user ${userId}`, error);
  }
};
