/**
 * RideMate Service Worker for Web Push Notifications
 * Handles background push event reception and notification click navigation.
 */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const notification = data.notification || {};
    const title = notification.title || 'RideMate Alert';
    const options = {
      body: notification.body || '',
      icon: notification.icon || '/icons/icon-192.png',
      badge: notification.badge || '/icons/badge-72.png',
      tag: notification.tag || 'ridemate-notification',
      data: notification.data || {},
      actions: notification.actions || [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Service worker push parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.action_url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
