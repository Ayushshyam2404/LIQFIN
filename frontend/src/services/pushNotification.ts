import { api } from './api';

// Helper to convert VAPID keys to Uint8Array for browser PushManager subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

export const subscribeUserToPush = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('Web Push is not supported in this browser context.');
    return false;
  }

  try {
    // 1. Request OS permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied by user.');
      return false;
    }

    // 2. Ready service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // 3. Fetch Public VAPID Key from backend
    const vapidRes = await api.get('/notifications/vapid-key');
    if (!vapidRes.data.success || !vapidRes.data.publicKey) {
      throw new Error('Failed to retrieve VAPID public key from backend.');
    }
    
    const applicationServerKey = urlBase64ToUint8Array(vapidRes.data.publicKey);

    // 4. Create Push Subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any
    });

    // 5. Send subscription parameters to backend
    const saveRes = await api.post('/notifications/subscribe', { subscription });
    return saveRes.data.success;
  } catch (error) {
    console.error('Failed to subscribe user to Web Push:', error);
    return false;
  }
};

export const unsubscribeUserFromPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const endpoint = subscription.endpoint;
      // 1. Unsubscribe from browser provider
      await subscription.unsubscribe();
      // 2. Inform backend to clean database pointers
      const res = await api.post('/notifications/unsubscribe', { endpoint });
      return res.data.success;
    }
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe user from Web Push:', error);
    return false;
  }
};
