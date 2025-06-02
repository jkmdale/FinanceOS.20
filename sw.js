const CACHE_NAME = 'financeos-v2.0.0';
const urlsToCache = [
  './',
  './index.html',
  './csv-upload.html',
  './goals.html',
  './styles.css',
  './data-manager.js',
  './notification-system.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache files:', error);
      })
  );
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache for future requests
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            
            // Return offline page or fallback
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // For other requests, let them fail
            throw error;
          });
      })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(uploadPendingTransactions());
  }
});

async function uploadPendingTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    
    for (const transaction of pendingTransactions) {
      try {
        // In a real app, this would upload to your server
        console.log('Syncing transaction:', transaction);
        
        // Remove from pending after successful upload
        const updatedPending = pendingTransactions.filter(t => t.id !== transaction.id);
        localStorage.setItem('pendingTransactions', JSON.stringify(updatedPending));
        
      } catch (error) {
        console.error('Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle push notifications (when implemented)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'FinanceOS', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

console.log('FinanceOS Service Worker v2.0.0 loaded');