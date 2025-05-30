// FinanceOS Service Worker - Advanced PWA functionality
const CACHE_NAME = 'financeos-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/goals.html', 
  '/csv-upload.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical resources
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('FinanceOS Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('FinanceOS Service Worker activating...');
  
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
          console.log('Serving from cache:', event.request.url);
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
            // If both cache and network fail, show offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for financial data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  }
  
  if (event.tag === 'goal-progress-sync') {
    event.waitUntil(syncGoalProgress());
  }
});

// Push notifications for budget alerts
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'FinanceOS notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view-goals',
        title: 'View Goals',
        icon: '/icons/action-goals.png'
      },
      {
        action: 'add-funds',
        title: 'Add Funds',
        icon: '/icons/action-add.png'
      }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('FinanceOS Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  // Handle action clicks
  if (event.action === 'view-goals') {
    event.waitUntil(
      clients.openWindow('/goals.html')
    );
  } else if (event.action === 'add-funds') {
    event.waitUntil(
      clients.openWindow('/goals.html#emergency-fund')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Analytics or cleanup if needed
});

// Periodic background sync for checking budget status
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'budget-check') {
    event.waitUntil(checkBudgetStatus());
  }
});

// Helper functions for background operations

async function syncFinancialData() {
  try {
    console.log('Syncing financial data...');
    
    // Get pending transactions from IndexedDB
    const db = await openDB('financeos-offline', 1);
    const tx = db.transaction('pending-transactions', 'readonly');
    const pendingTransactions = await tx.objectStore('pending-transactions').getAll();
    
    // Sync each pending transaction
    for (const transaction of pendingTransactions) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(transaction),
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Remove from pending after successful sync
        const deleteTx = db.transaction('pending-transactions', 'readwrite');
        await deleteTx.objectStore('pending-transactions').delete(transaction.id);
        
        console.log('Synced transaction:', transaction.id);
      } catch (error) {
        console.error('Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('Financial data sync failed:', error);
  }
}

async function syncGoalProgress() {
  try {
    console.log('Syncing goal progress...');
    
    // Get stored goal data
    const goalData = localStorage.getItem('financeOS_goalData');
    if (goalData) {
      // In a real app, this would sync to your backend
      console.log('Goal data ready for sync:', goalData);
    }
  } catch (error) {
    console.error('Goal progress sync failed:', error);
  }
}

async function checkBudgetStatus() {
  try {
    console.log('Checking budget status...');
    
    // Get current spending data
    const goalData = JSON.parse(localStorage.getItem('financeOS_goalData') || '{}');
    
    // Check if user is over budget
    if (goalData.budgetRecovery && goalData.budgetRecovery.currentDeficit < -3000) {
      // Send budget alert notification
      await self.registration.showNotification('Budget Alert!', {
        body: 'Your deficit has increased. Check your goals to stay on track.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'budget-alert',
        requireInteraction: true,
        actions: [
          {
            action: 'view-goals',
            title: 'View Goals'
          }
        ]
      });
    }
    
    // Check emergency fund milestones
    if (goalData.emergencyFund && goalData.emergencyFund.current >= 100) {
      const lastMilestone = localStorage.getItem('lastEmergencyMilestone');
      if (!lastMilestone || goalData.emergencyFund.current >= parseFloat(lastMilestone) + 100) {
        await self.registration.showNotification('Milestone Achieved!', {
          body: `You've saved $${goalData.emergencyFund.current.toFixed(0)} in your emergency fund!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'milestone-achievement'
        });
        
        localStorage.setItem('lastEmergencyMilestone', goalData.emergencyFund.current.toString());
      }
    }
  } catch (error) {
    console.error('Budget status check failed:', error);
  }
}

// IndexedDB helper for offline storage
async function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pending-transactions')) {
        const transactionStore = db.createObjectStore('pending-transactions', { keyPath: 'id' });
        transactionStore.createIndex('date', 'date');
        transactionStore.createIndex('category', 'category');
      }
      
      if (!db.objectStoreNames.contains('goal-progress')) {
        const goalStore = db.createObjectStore('goal-progress', { keyPath: 'id' });
        goalStore.createIndex('date', 'date');
        goalStore.createIndex('type', 'type');
      }
      
      if (!db.objectStoreNames.contains('budget-data')) {
        const budgetStore = db.createObjectStore('budget-data', { keyPath: 'month' });
        budgetStore.createIndex('year', 'year');
      }
    };
  });
}

// Log successful installation
console.log('FinanceOS Service Worker loaded successfully');// FinanceOS Service Worker - Advanced PWA functionality
const CACHE_NAME = 'financeos-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/goals.html', 
  '/csv-upload.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical resources
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('FinanceOS Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('FinanceOS Service Worker activating...');
  
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
          console.log('Serving from cache:', event.request.url);
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
            // If both cache and network fail, show offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for financial data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(syncFinancialData());
  }
  
  if (event.tag === 'goal-progress-sync') {
    event.waitUntil(syncGoalProgress());
  }
});

// Push notifications for budget alerts
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'FinanceOS notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view-goals',
        title: 'View Goals',
        icon: '/icons/action-goals.png'
      },
      {
        action: 'add-funds',
        title: 'Add Funds',
        icon: '/icons/action-add.png'
      }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('FinanceOS Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  // Handle action clicks
  if (event.action === 'view-goals') {
    event.waitUntil(
      clients.openWindow('/goals.html')
    );
  } else if (event.action === 'add-funds') {
    event.waitUntil(
      clients.openWindow('/goals.html#emergency-fund')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Analytics or cleanup if needed
});

// Periodic background sync for checking budget status
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'budget-check') {
    event.waitUntil(checkBudgetStatus());
  }
});

// Helper functions for background operations

async function syncFinancialData() {
  try {
    console.log('Syncing financial data...');
    
    // Get pending transactions from IndexedDB
    const db = await openDB('financeos-offline', 1);
    const tx = db.transaction('pending-transactions', 'readonly');
    const pendingTransactions = await tx.objectStore('pending-transactions').getAll();
    
    // Sync each pending transaction
    for (const transaction of pendingTransactions) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(transaction),
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Remove from pending after successful sync
        const deleteTx = db.transaction('pending-transactions', 'readwrite');
        await deleteTx.objectStore('pending-transactions').delete(transaction.id);
        
        console.log('Synced transaction:', transaction.id);
      } catch (error) {
        console.error('Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('Financial data sync failed:', error);
  }
}

async function syncGoalProgress() {
  try {
    console.log('Syncing goal progress...');
    
    // Get stored goal data
    const goalData = localStorage.getItem('financeOS_goalData');
    if (goalData) {
      // In a real app, this would sync to your backend
      console.log('Goal data ready for sync:', goalData);
    }
  } catch (error) {
    console.error('Goal progress sync failed:', error);
  }
}

async function checkBudgetStatus() {
  try {
    console.log('Checking budget status...');
    
    // Get current spending data
    const goalData = JSON.parse(localStorage.getItem('financeOS_goalData') || '{}');
    
    // Check if user is over budget
    if (goalData.budgetRecovery && goalData.budgetRecovery.currentDeficit < -3000) {
      // Send budget alert notification
      await self.registration.showNotification('Budget Alert!', {
        body: 'Your deficit has increased. Check your goals to stay on track.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'budget-alert',
        requireInteraction: true,
        actions: [
          {
            action: 'view-goals',
            title: 'View Goals'
          }
        ]
      });
    }
    
    // Check emergency fund milestones
    if (goalData.emergencyFund && goalData.emergencyFund.current >= 100) {
      const lastMilestone = localStorage.getItem('lastEmergencyMilestone');
      if (!lastMilestone || goalData.emergencyFund.current >= parseFloat(lastMilestone) + 100) {
        await self.registration.showNotification('Milestone Achieved!', {
          body: `You've saved $${goalData.emergencyFund.current.toFixed(0)} in your emergency fund!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'milestone-achievement'
        });
        
        localStorage.setItem('lastEmergencyMilestone', goalData.emergencyFund.current.toString());
      }
    }
  } catch (error) {
    console.error('Budget status check failed:', error);
  }
}

// IndexedDB helper for offline storage
async function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pending-transactions')) {
        const transactionStore = db.createObjectStore('pending-transactions', { keyPath: 'id' });
        transactionStore.createIndex('date', 'date');
        transactionStore.createIndex('category', 'category');
      }
      
      if (!db.objectStoreNames.contains('goal-progress')) {
        const goalStore = db.createObjectStore('goal-progress', { keyPath: 'id' });
        goalStore.createIndex('date', 'date');
        goalStore.createIndex('type', 'type');
      }
      
      if (!db.objectStoreNames.contains('budget-data')) {
        const budgetStore = db.createObjectStore('budget-data', { keyPath: 'month' });
        budgetStore.createIndex('year', 'year');
      }
    };
  });
}

// Log successful installation
console.log('FinanceOS Service Worker loaded successfully');
