const CACHE_NAME = 'liquid-finance-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened assets cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor for Offline Cache fallback
self.addEventListener('fetch', (event) => {
  // Do not intercept API requests (handled by axios offline store/sync)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).catch(() => {
        // Return index.html for navigation requests offline (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listen to incoming Web Push notifications from the server
self.addEventListener('push', (event) => {
  let data = { title: 'LIQIFIN OS', body: 'New alert received.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'LIQIFIN OS', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect x=%228%22 y=%228%22 width=%2284%22 height=%2284%22 fill=%22%23baf600%22 rx=%2210%22/%3E%3Ctext x=%2250%22 y=%2262%22 font-family=%22Impact, Arial, sans-serif%22 font-size=%2248%22 font-weight=%22bold%22 fill=%22%231b1b1b%22 text-anchor=%22middle%22%3EL%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect x=%228%22 y=%228%22 width=%2284%22 height=%2284%22 fill=%22%23baf600%22 rx=%2210%22/%3E%3Ctext x=%2250%22 y=%2262%22 font-family=%22Impact, Arial, sans-serif%22 font-size=%2248%22 font-weight=%22bold%22 fill=%22%231b1b1b%22 text-anchor=%22middle%22%3EL%3C/text%3E%3C/svg%3E',
    vibrate: [100, 50, 100],
    data: {
      url: '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification banner clicks (focus/open client app window)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
