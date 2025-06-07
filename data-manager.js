/**
 * FinanceOS Data Manager
 * Centralized data management for localStorage, IndexedDB, and synchronization
 */

class FinanceOSDataManager {
    constructor() {
        this.version = '1.2.0';
        this.dbName = 'FinanceOS';
        this.dbVersion = 1;
        this.db = null;
        
        // Storage keys
        this.keys = {
            AUTH: 'financeos_auth',
            PRIVACY: 'financeos_privacy',
            TRANSACTIONS: 'financeos_transactions',
            GOALS: 'financeos_goals',
            BUDGET: 'financeos_budget',
            CSV_UPLOAD: 'financeos_last_csv_upload',
            USER_PREFERENCES: 'financeos_preferences',
            CACHE_TIMESTAMP: 'financeos_cache_timestamp'
        };
        
        // Initialize database
        this.initializeDatabase();
    }

    // === DATABASE INITIALIZATION ===
    
    async initializeDatabase() {
        try {
            this.db = await this.openIndexedDB();
            console.log('[DataManager] IndexedDB initialized successfully');
        } catch (error) {
            console.error('[DataManager] Failed to initialize IndexedDB:', error);
        }
    }

    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                this.createObjectStores(db);
            };
        });
    }

    createObjectStores(db) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('date', 'date', { unique: false });
            transactionStore.createIndex('category', 'category', { unique: false });
            transactionStore.createIndex('amount', 'amount', { unique: false });
        }

        // Goals store
        if (!db.objectStoreNames.contains('goals')) {
            const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
            goalStore.createIndex('priority', 'priority', { unique: false });
            goalStore.createIndex('targetDate', 'targetDate', { unique: false });
        }

        // Budget store
        if (!db.objectStoreNames.contains('budget')) {
            const budgetStore = db.createObjectStore('budget', { keyPath: 'month' });
        }

        // Pending sync operations
        if (!db.objectStoreNames.contains('pendingSync')) {
            const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
            syncStore.createIndex('type', 'type', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('[DataManager] Object stores created');
    }

    // === AUTHENTICATION MANAGEMENT ===

    setAuthToken(token, userData) {
        const authData = {
            token: token,
            user: userData,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.keys.AUTH, JSON.stringify(authData));
        return authData;
    }

    getAuthToken() {
        try {
            const authData = JSON.parse(localStorage.getItem(this.keys.AUTH) || '{}');
            
            if (authData.expires && authData.expires > Date.now()) {
                return authData;
            } else {
                this.clearAuth();
                return null;
            }
        } catch (error) {
            console.error('[DataManager] Error parsing auth token:', error);
            this.clearAuth();
            return null;
        }
    }

    isAuthenticated() {
        const authData = this.getAuthToken();
        return !!authData && authData.expires > Date.now();
    }

    clearAuth() {
        localStorage.removeItem(this.keys.AUTH);
        localStorage.removeItem(this.keys.PRIVACY);
    }

    // === TRANSACTION MANAGEMENT ===

    async saveTransactions(transactions) {
        try {
            // Save to localStorage for immediate access
            localStorage.setItem(this.keys.TRANSACTIONS, JSON.stringify(transactions));
            
            // Save to IndexedDB for persistent storage
            if (this.db) {
                const tx = this.db.transaction(['transactions'], 'readwrite');
                const store = tx.objectStore('transactions');
                
                for (const transaction of transactions) {
                    await this.putToStore(store, transaction);
                }
            }
            
            this.updateCacheTimestamp('transactions');
            console.log('[DataManager] Transactions saved:', transactions.length);
            
        } catch (error) {
            console.error('[DataManager] Error saving transactions:', error);
            throw error;
        }
    }

    async getTransactions() {
        try {
            // Try localStorage first for speed
            const localData = localStorage.getItem(this.keys.TRANSACTIONS);
            if (localData) {
                return JSON.parse(localData);
            }
            
            // Fallback to IndexedDB
            if (this.db) {
                const tx = this.db.transaction(['transactions'], 'readonly');
                const store = tx.objectStore('transactions');
                const transactions = await this.getAllFromStore(store);
                
                // Cache in localStorage
                localStorage.setItem(this.keys.TRANSACTIONS, JSON.stringify(transactions));
                return transactions;
            }
            
            return [];
        } catch (error) {
            console.error('[DataManager] Error getting transactions:', error);
            return [];
        }
    }

    async addTransaction(transaction) {
        const transactions = await this.getTransactions();
        transaction.id = transaction.id || Date.now() + Math.random();
        transaction.timestamp = Date.now();
        
        transactions.push(transaction);
        await this.saveTransactions(transactions);
        
        return transaction;
    }

    async updateTransaction(transactionId, updates) {
        const transactions = await this.getTransactions();
        const index = transactions.findIndex(t => t.id === transactionId);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            await this.saveTransactions(transactions);
            return transactions[index];
        }
        
        throw new Error('Transaction not found');
    }

    async deleteTransaction(transactionId) {
        const transactions = await this.getTransactions();
        const filtered = transactions.filter(t => t.id !== transactionId);
        
        if (filtered.length !== transactions.length) {
            await this.saveTransactions(filtered);
            return true;
        }
        
        return false;
    }

    // === GOALS MANAGEMENT ===

    async saveGoals(goals) {
        try {
            localStorage.setItem(this.keys.GOALS, JSON.stringify(goals));
            
            if (this.db) {
                const tx = this.db.transaction(['goals'], 'readwrite');
                const store = tx.objectStore('goals');
                
                // Clear existing goals
                await this.clearStore(store);
                
                // Add new goals
                for (const goal of goals) {
                    await this.putToStore(store, goal);
                }
            }
            
            this.updateCacheTimestamp('goals');
            console.log('[DataManager] Goals saved:', goals.length);
            
        } catch (error) {
            console.error('[DataManager] Error saving goals:', error);
            throw error;
        }
    }

    async getGoals() {
        try {
            const localData = localStorage.getItem(this.keys.GOALS);
            if (localData) {
                return JSON.parse(localData);
            }
            
            if (this.db) {
                const tx = this.db.transaction(['goals'], 'readonly');
                const store = tx.objectStore('goals');
                const goals = await this.getAllFromStore(store);
                
                localStorage.setItem(this.keys.GOALS, JSON.stringify(goals));
                return goals;
            }
            
            return this.getDefaultGoals();
        } catch (error) {
            console.error('[DataManager] Error getting goals:', error);
            return this.getDefaultGoals();
        }
    }

    getDefaultGoals() {
        return [
            {
                id: 1,
                name: "Emergency Fund",
                description: "Build emergency savings to cover 3 months of expenses",
                current: 0.17,
                target: 15000,
                priority: "critical",
                targetDate: "2025-12-31",
                monthlyContribution: 0,
                createdDate: "2024-12-01"
            },
            {
                id: 2,
                name: "Visa Debt Payoff",
                description: "Pay off remaining credit card debt",
                current: 6748.70,
                target: 10000,
                priority: "high",
                targetDate: "2025-06-30",
                monthlyContribution: 300,
                createdDate: "2024-12-01"
            },
            {
                id: 3,
                name: "KiwiSaver Growth",
                description: "Build retirement savings through KiwiSaver",
                current: 48733.44,
                target: 100000,
                priority: "medium",
                targetDate: "2027-12-31",
                monthlyContribution: 271,
                createdDate: "2024-12-01"
            },
            {
                id: 4,
                name: "Private School Fund",
                description: "Save for children's private school education",
                current: 1500,
                target: 10000,
                priority: "medium",
                targetDate: "2026-02-01",
                monthlyContribution: 300,
                createdDate: "2024-12-01"
            }
        ];
    }

    // === BUDGET MANAGEMENT ===

    async saveBudget(month, budgetData) {
        try {
            const budgets = await this.getBudgets();
            budgets[month] = {
                ...budgetData,
                month: month,
                lastUpdated: Date.now()
            };
            
            localStorage.setItem(this.keys.BUDGET, JSON.stringify(budgets));
            
            if (this.db) {
                const tx = this.db.transaction(['budget'], 'readwrite');
                const store = tx.objectStore('budget');
                await this.putToStore(store, budgets[month]);
            }
            
            this.updateCacheTimestamp('budget');
            console.log('[DataManager] Budget saved for:', month);
            
        } catch (error) {
            console.error('[DataManager] Error saving budget:', error);
            throw error;
        }
    }

    async getBudgets() {
        try {
            const localData = localStorage.getItem(this.keys.BUDGET);
            if (localData) {
                return JSON.parse(localData);
            }
            
            if (this.db) {
                const tx = this.db.transaction(['budget'], 'readonly');
                const store = tx.objectStore('budget');
                const budgets = await this.getAllFromStore(store);
                
                // Convert array to object keyed by month
                const budgetObj = {};
                budgets.forEach(budget => {
                    budgetObj[budget.month] = budget;
                });
                
                localStorage.setItem(this.keys.BUDGET, JSON.stringify(budgetObj));
                return budgetObj;
            }
            
            return {};
        } catch (error) {
            console.error('[DataManager] Error getting budgets:', error);
            return {};
        }
    }

    async getBudgetForMonth(month) {
        const budgets = await this.getBudgets();
        return budgets[month] || null;
    }

    // === CSV UPLOAD TRACKING ===

    setLastCSVUpload(timestamp = null) {
        const uploadTime = timestamp || new Date().toISOString();
        localStorage.setItem(this.keys.CSV_UPLOAD, uploadTime);
        return uploadTime;
    }

    getLastCSVUpload() {
        return localStorage.getItem(this.keys.CSV_UPLOAD);
    }

    // === USER PREFERENCES ===

    setUserPreference(key, value) {
        try {
            const preferences = this.getUserPreferences();
            preferences[key] = value;
            localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('[DataManager] Error setting preference:', error);
        }
    }

    getUserPreferences() {
        try {
            const preferences = localStorage.getItem(this.keys.USER_PREFERENCES);
            return preferences ? JSON.parse(preferences) : {};
        } catch (error) {
            console.error('[DataManager] Error getting preferences:', error);
            return {};
        }
    }

    getUserPreference(key, defaultValue = null) {
        const preferences = this.getUserPreferences();
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }

    // === PRIVACY MODE ===

    setPrivacyMode(enabled) {
        localStorage.setItem(this.keys.PRIVACY, enabled.toString());
        this.setUserPreference('privacyMode', enabled);
    }

    getPrivacyMode() {
        const privacy = localStorage.getItem(this.keys.PRIVACY);
        return privacy === 'true';
    }

    // === CACHE MANAGEMENT ===

    updateCacheTimestamp(dataType) {
        const timestamps = this.getCacheTimestamps();
        timestamps[dataType] = Date.now();
        localStorage.setItem(this.keys.CACHE_TIMESTAMP, JSON.stringify(timestamps));
    }

    getCacheTimestamps() {
        try {
            const timestamps = localStorage.getItem(this.keys.CACHE_TIMESTAMP);
            return timestamps ? JSON.parse(timestamps) : {};
        } catch (error) {
            console.error('[DataManager] Error getting cache timestamps:', error);
            return {};
        }
    }

    isCacheExpired(dataType, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const timestamps = this.getCacheTimestamps();
        const lastUpdate = timestamps[dataType];
        
        if (!lastUpdate) return true;
        
        return (Date.now() - lastUpdate) > maxAge;
    }

    // === OFFLINE SYNC MANAGEMENT ===

    async addPendingSync(operation) {
        if (!this.db) return;

        try {
            const syncItem = {
                id: Date.now() + Math.random(),
                type: operation.type,
                action: operation.action,
                data: operation.data,
                timestamp: Date.now(),
                retryCount: 0
            };

            const tx = this.db.transaction(['pendingSync'], 'readwrite');
            const store = tx.objectStore('pendingSync');
            await this.putToStore(store, syncItem);

            console.log('[DataManager] Added pending sync operation:', syncItem.type);
            
            // Trigger background sync if supported
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register(`background-sync-${operation.type}`);
            }

        } catch (error) {
            console.error('[DataManager] Error adding pending sync:', error);
        }
    }

    async getPendingSync() {
        if (!this.db) return [];

        try {
            const tx = this.db.transaction(['pendingSync'], 'readonly');
            const store = tx.objectStore('pendingSync');
            return await this.getAllFromStore(store);
        } catch (error) {
            console.error('[DataManager] Error getting pending sync:', error);
            return [];
        }
    }

    async removePendingSync(syncId) {
        if (!this.db) return;

        try {
            const tx = this.db.transaction(['pendingSync'], 'readwrite');
            const store = tx.objectStore('pendingSync');
            await this.deleteFromStore(store, syncId);
            console.log('[DataManager] Removed pending sync:', syncId);
        } catch (error) {
            console.error('[DataManager] Error removing pending sync:', error);
        }
    }

    // === FINANCIAL CALCULATIONS ===

    calculateNetWorth(accounts) {
        const assets = accounts.filter(acc => acc.balance > 0)
            .reduce((sum, acc) => sum + acc.balance, 0);
        
        const liabilities = accounts.filter(acc => acc.balance < 0)
            .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
        
        return {
            assets,
            liabilities,
            netWorth: assets - liabilities
        };
    }

    calculateMonthlySpending(transactions, month = null) {
        const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
        
        return transactions
            .filter(t => t.date.startsWith(targetMonth) && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }

    categorizeTransactions(transactions) {
        const categories = {};
        
        transactions.forEach(transaction => {
            const category = transaction.category || 'Other';
            if (!categories[category]) {
                categories[category] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }
            
            categories[category].total += Math.abs(transaction.amount);
            categories[category].count += 1;
            categories[category].transactions.push(transaction);
        });
        
        return categories;
    }

    // === DATA EXPORT/IMPORT ===

    async exportAllData() {
        try {
            const data = {
                version: this.version,
                exportDate: new Date().toISOString(),
                transactions: await this.getTransactions(),
                goals: await this.getGoals(),
                budgets: await this.getBudgets(),
                preferences: this.getUserPreferences(),
                metadata: {
                    lastCSVUpload: this.getLastCSVUpload(),
                    cacheTimestamps: this.getCacheTimestamps()
                }
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('[DataManager] Error exporting data:', error);
            throw error;
        }
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.transactions) {
                await this.saveTransactions(data.transactions);
            }
            
            if (data.goals) {
                await this.saveGoals(data.goals);
            }
            
            if (data.budgets) {
                localStorage.setItem(this.keys.BUDGET, JSON.stringify(data.budgets));
            }
            
            if (data.preferences) {
                localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(data.preferences));
            }
            
            if (data.metadata && data.metadata.lastCSVUpload) {
                this.setLastCSVUpload(data.metadata.lastCSVUpload);
            }
            
            console.log('[DataManager] Data imported successfully');
            
        } catch (error) {
            console.error('[DataManager] Error importing data:', error);
            throw error;
        }
    }

    // === CLEANUP OPERATIONS ===

    async clearAllData() {
        try {
            // Clear localStorage
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear IndexedDB
            if (this.db) {
                const storeNames = ['transactions', 'goals', 'budget', 'pendingSync', 'cache'];
                for (const storeName of storeNames) {
                    const tx = this.db.transaction([storeName], 'readwrite');
                    const store = tx.objectStore(storeName);
                    await this.clearStore(store);
                }
            }
            
            console.log('[DataManager] All data cleared');
            
        } catch (error) {
            console.error('[DataManager] Error clearing data:', error);
            throw error;
        }
    }

    async clearExpiredCache(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        if (!this.db) return;

        try {
            const tx = this.db.transaction(['cache'], 'readwrite');
            const store = tx.objectStore('cache');
            const index = store.index('timestamp');
            
            const cutoffTime = Date.now() - maxAge;
            const range = IDBKeyRange.upperBound(cutoffTime);
            
            const cursor = index.openCursor(range);
            const deletePromises = [];
            
            cursor.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    deletePromises.push(cursor.delete());
                    cursor.continue();
                }
            };
            
            await Promise.all(deletePromises);
            console.log('[DataManager] Expired cache cleared');
            
        } catch (error) {
            console.error('[DataManager] Error clearing expired cache:', error);
        }
    }

    // === UTILITY FUNCTIONS ===

    putToStore(store, data) {
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    deleteFromStore(store, key) {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // === FINANCIAL HEALTH MONITORING ===

    analyzeFinancialHealth() {
        return new Promise(async (resolve) => {
            try {
                const goals = await this.getGoals();
                const transactions = await this.getTransactions();
                const preferences = this.getUserPreferences();
                
                const analysis = {
                    score: 0,
                    alerts: [],
                    recommendations: [],
                    insights: []
                };
                
                // Emergency fund analysis
                const emergencyFund = goals.find(g => 
                    g.name.toLowerCase().includes('emergency')
                );
                
                if (emergencyFund) {
                    if (emergencyFund.current < 1000) {
                        analysis.alerts.push('Emergency fund is critically low');
                        analysis.recommendations.push('Prioritize building emergency fund to $1,000');
                    } else if (emergencyFund.current < 5000) {
                        analysis.alerts.push('Emergency fund needs attention');
                        analysis.recommendations.push('Continue building emergency fund');
                    }
                }
                
                // Spending pattern analysis
                const recentTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return transactionDate > thirtyDaysAgo;
                });
                
                const monthlySpending = this.calculateMonthlySpending(recentTransactions);
                if (monthlySpending > 8000) {
                    analysis.alerts.push('High monthly spending detected');
                    analysis.recommendations.push('Review discretionary expenses');
                }
                
                // Goal progress analysis
                const goalsWithProgress = goals.filter(g => g.current > 0);
                analysis.insights.push(`You're actively working on ${goalsWithProgress.length} financial goals`);
                
                // Calculate overall score
                let score = 50; // Base score
                
                if (emergencyFund && emergencyFund.current >= 5000) score += 20;
                if (monthlySpending <= 6000) score += 15;
                if (goals.length >= 3) score += 10;
                if (analysis.alerts.length === 0) score += 5;
                
                analysis.score = Math.min(score, 100);
                
                resolve(analysis);
                
            } catch (error) {
                console.error('[DataManager] Error analyzing financial health:', error);
                resolve({
                    score: 0,
                    alerts: ['Unable to analyze financial health'],
                    recommendations: [],
                    insights: []
                });
            }
        });
    }
}

// Create global instance
const dataManager = new FinanceOSDataManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceOSDataManager;
} else if (typeof window !== 'undefined') {
    window.FinanceOSDataManager = FinanceOSDataManager;
    window.dataManager = dataManager;
}

console.log('[DataManager] FinanceOS Data Manager v1.2.0 loaded');