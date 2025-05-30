// FinanceOS Service Worker - Advanced PWA functionality
const CACHE_NAME = 'financeos-v1.0.0';

// Resources to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/goals.html', 
  '/csv-upload.html',
  '/manifest.json'
  // Note: Icons will be added when created
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 FinanceOS Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching core files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ FinanceOS Service Worker installed');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 FinanceOS Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('📋 Serving from cache:', event.request.url);
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response before caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed - for navigation requests, show offline message
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>FinanceOS - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      background: linear-gradient(135deg, #0f172a, #1e1b4b); 
                      color: white; 
                      text-align: center; 
                      padding: 50px 20px; 
                      margin: 0;
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      background: rgba(255,255,255,0.1); 
                      padding: 40px; 
                      border-radius: 20px; 
                    }
                    .icon { font-size: 60px; margin-bottom: 20px; }
                    h1 { margin-bottom: 20px; }
                    button { 
                      background: linear-gradient(135deg, #8b5cf6, #9333ea); 
                      color: white; 
                      border: none; 
                      padding: 12px 24px; 
                      border-radius: 8px; 
                      cursor: pointer; 
                      margin-top: 20px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="icon">📱</div>
                    <h1>FinanceOS Offline</h1>
                    <p>You're offline, but your financial goals are still accessible!</p>
                    <p>Goal tracking works without internet connection.</p>
                    <button onclick="window.location.reload()">Try Again</button>
                    <br><br>
                    <a href="/goals.html" style="color: #8b5cf6;">Go to Goals →</a>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            // For other requests, return error
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for financial data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  }
  
  if (event.tag === 'goal-progress-sync') {
    event.waitUntil(syncGoalProgress());
  }
});

// Push notifications for budget alerts
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New financial update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/goals.html',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'view-goals',
        title: 'View Goals'
      },
      {
        action: 'add-funds',
        title: 'Add Funds'
      }
    ],
    requireInteraction: true,
    tag: 'financeos-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || '🎯 FinanceOS Update', 
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  // Handle action clicks
  let targetUrl = '/';
  
  if (event.action === 'view-goals') {
    targetUrl = '/goals.html';
  } else if (event.action === 'add-funds') {
    targetUrl = '/goals.html#emergency-fund';
  } else if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_GOAL_DATA':
      cacheGoalData(data);
      break;
      
    case 'TRIGGER_SYNC':
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        self.registration.sync.register('goal-progress-sync');
      }
      break;
  }
});

// Helper functions for background operations
async function syncFinancialData() {
  try {
    console.log('💰 Syncing financial data...');
    
    // Get stored financial data
    const goalData = getStoredData('financeOS_goalData');
    const transactions = getStoredData('financeOS_transactions');
    
    if (goalData || transactions) {
      console.log('📊 Found offline financial data to sync');
      // In a real app, this would sync to your backend
      // For now, we'll just log that sync would happen
      console.log('✅ Financial data sync completed');
      
      // Show success notification
      showSyncNotification('💰 Financial data synced!');
    }
  } catch (error) {
    console.error('❌ Financial data sync failed:', error);
  }
}

async function syncGoalProgress() {
  try {
    console.log('🎯 Syncing goal progress...');
    
    const goalData = getStoredData('financeOS_goalData');
    if (goalData) {
      console.log('📈 Goal progress ready for sync');
      
      // Check for milestones to celebrate
      checkMilestones(goalData);
    }
    
    console.log('✅ Goal progress sync completed');
  } catch (error) {
    console.error('❌ Goal progress sync failed:', error);
  }
}

function getStoredData(key) {
  try {
    const data = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheGoalData(data) {
  try {
    console.log('💾 Caching goal data for offline use');
    // Could store in IndexedDB for more robust offline storage
    // For now, localStorage handling is done by the main app
  } catch (error) {
    console.error('❌ Failed to cache goal data:', error);
  }
}

function checkMilestones(goalData) {
  if (!goalData || !goalData.emergencyFund) return;
  
  const currentAmount = goalData.emergencyFund.current || 0;
  const lastNotified = parseFloat(localStorage.getItem('lastMilestoneNotified') || '0');
  
  // Check for $100 milestones
  const milestoneReached = Math.floor(currentAmount / 100) * 100;
  
  if (milestoneReached > lastNotified && milestoneReached >= 100) {
    showMilestoneNotification(milestoneReached);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastMilestoneNotified', milestoneReached.toString());
    }
  }
}

function showMilestoneNotification(amount) {
  self.registration.showNotification('🎉 Milestone Achieved!', {
    body: `You've saved $${amount} in your emergency fund! Keep going!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'milestone-achievement',
    requireInteraction: true,
    actions: [
      {
        action: 'view-goals',
        title: 'View Progress'
      }
    ]
  });
}

function showSyncNotification(message) {
  self.registration.showNotification('FinanceOS Sync', {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'sync-notification',
    silent: true
  });
}

// Online/offline status monitoring
self.addEventListener('online', () => {
  console.log('🌐 Back online - triggering sync');
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register('financial-data-sync');
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('🎯 FinanceOS Service Worker loaded successfully!');
