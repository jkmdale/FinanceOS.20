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
            CACHE_TIMESTAMP: 'financeos_cache_timestamp',
            // New key for biometric credentials
            BIOMETRIC_CREDENTIALS: 'financeos_biometric_credentials' 
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

        // Biometric Credentials store (New)
        if (!db.objectStoreNames.contains('biometricCredentials')) {
            const bioStore = db.createObjectStore('biometricCredentials', { keyPath: 'id' });
            bioStore.createIndex('userId', 'userId', { unique: true }); // Link to user
        }

        console.log('[DataManager] Object stores created');
    }

    // === UTILITY METHODS FOR INDEXEDDB ===
    
    putToStore(store, data) {
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    deleteFromStore(store, key) {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
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
        // Also clear biometric credentials associated with the user on logout
        // This assumes a 'userId' is part of the authData.user object
        const authData = JSON.parse(localStorage.getItem(this.keys.AUTH) || '{}');
        if (authData.user && authData.user.id) {
            this.removeBiometricCredential(authData.user.id);
        }
    }

    // === BIOMETRIC AUTHENTICATION MANAGEMENT (New Methods) ===

    /**
     * Checks if WebAuthn (biometric) is available in the browser.
     * @returns {Promise<boolean>} True if WebAuthn is supported and available.
     */
    async isBiometricAvailable() {
        if (!window.PublicKeyCredential) {
            console.warn('[DataManager] WebAuthn (PublicKeyCredential) is not supported in this browser.');
            return false;
        }
        try {
            // Check if a credential can be created (for registration)
            // or if a credential can be retrieved (for authentication)
            // This is a basic check; more robust checks might involve specific feature detections.
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (error) {
            console.error('[DataManager] Error checking biometric availability:', error);
            return false;
        }
    }

    /**
     * Registers a biometric credential for the current user.
     * This usually involves a server-side challenge.
     * @param {object} options - Options for PublicKeyCredential creation, usually from server.
     * @returns {Promise<Credential>} The created PublicKeyCredential object.
     */
    async registerBiometricCredential(options) {
        if (!this.isBiometricAvailable()) {
            throw new Error('Biometric authentication not available.');
        }

        try {
            // Convert challenge and ID from Base64Url to ArrayBuffer
            options.publicKey.challenge = this._base64urlToArrayBuffer(options.publicKey.challenge);
            options.publicKey.user.id = this._base64urlToArrayBuffer(options.publicKey.user.id);
            if (options.publicKey.excludeCredentials) {
                options.publicKey.excludeCredentials.forEach(cred => {
                    cred.id = this._base64urlToArrayBuffer(cred.id);
                });
            }

            const credential = await navigator.credentials.create({
                publicKey: options.publicKey
            });

            // Store the credential ID (and potentially other info) locally
            // In a real app, the credential.response would be sent to the server for verification
            // and the server would store the public key. Here, we're just saving the client-side reference.
            const authData = this.getAuthToken();
            if (authData && authData.user && this.db) {
                const credentialData = {
                    id: credential.id, // The credential ID
                    userId: authData.user.id, // Link to your internal user ID
                    type: credential.type,
                    // rawId: credential.rawId, // The raw credential ID as ArrayBuffer
                    // response: { // The response sent to the server
                    //     clientDataJSON: credential.response.clientDataJSON,
                    //     attestationObject: credential.response.attestationObject
                    // }
                };
                const tx = this.db.transaction(['biometricCredentials'], 'readwrite');
                const store = tx.objectStore('biometricCredentials');
                await this.putToStore(store, credentialData);
                console.log('[DataManager] Biometric credential registered and saved locally.');
            } else {
                console.warn('[DataManager] No active user session to associate biometric credential with.');
            }
            
            return credential;

        } catch (error) {
            console.error('[DataManager] Error registering biometric credential:', error);
            throw new Error('Biometric registration failed: ' + error.message);
        }
    }

    /**
     * Authenticates the user using a biometric credential.
     * This usually involves a server-side challenge.
     * @param {object} options - Options for PublicKeyCredential assertion, usually from server.
     * @returns {Promise<Credential>} The asserted PublicKeyCredential object.
     */
    async authenticateBiometricCredential(options) {
        if (!this.isBiometricAvailable()) {
            throw new Error('Biometric authentication not available.');
        }

        try {
            // Convert challenge and ID from Base64Url to ArrayBuffer
            options.publicKey.challenge = this._base64urlToArrayBuffer(options.publicKey.challenge);
            if (options.publicKey.allowCredentials) {
                options.publicKey.allowCredentials.forEach(cred => {
                    cred.id = this._base64urlToArrayBuffer(cred.id);
                });
            }

            const assertion = await navigator.credentials.get({
                publicKey: options.publicKey
            });

            // In a real app, the assertion.response would be sent to the server for verification.
            // The server would then confirm the user's identity based on the biometric signature.
            console.log('[DataManager] Biometric authentication successful locally (assertion obtained).');
            return assertion;

        } catch (error) {
            console.error('[DataManager] Error authenticating biometric credential:', error);
            throw new Error('Biometric authentication failed: ' + error.message);
        }
    }

    /**
     * Removes a stored biometric credential for a user.
     * @param {string} userId - The ID of the user whose credential to remove.
     */
    async removeBiometricCredential(userId) {
        if (!this.db) return;

        try {
            const tx = this.db.transaction(['biometricCredentials'], 'readwrite');
            const store = tx.objectStore('biometricCredentials');
            const request = store.index('userId').openCursor(IDBKeyRange.only(userId));

            request.onsuccess = async (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    await this.deleteFromStore(store, cursor.primaryKey);
                    console.log(`[DataManager] Biometric credential for user ${userId} removed.`);
                    cursor.continue();
                }
            };
            request.onerror = (event) => {
                console.error('[DataManager] Error removing biometric credential:', event.target.error);
            };
        } catch (error) {
            console.error('[DataManager] Error removing biometric credential:', error);
        }
    }

    // Helper to convert Base64Url to ArrayBuffer
    _base64urlToArrayBuffer(base64url) {
        // Replace non-url compatible chars with base64 standard chars
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        // Pad out with '=' if it's not a multiple of 4
        const pad = base64.length % 4;
        const paddedBase64 = pad ? base64 + '===='.slice(0, 4 - pad) : base64;
        const raw = window.atob(paddedBase64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));
        for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array.buffer;
    }

    // Helper to convert ArrayBuffer to Base64Url (useful for sending to server)
    _arrayBufferToBase64url(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return window.btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
                localStorage.setItem(this.keys.BUDGET, JSON.stringify(data.budgets)); // Corrected line
                if (this.db) {
                    const tx = this.db.transaction(['budget'], 'readwrite');
                    const store = tx.objectStore('budget');
                    for (const monthKey in data.budgets) {
                        await this.putToStore(store, data.budgets[monthKey]);
                    }
                }
            }

            if (data.preferences) {
                localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(data.preferences));
            }

            if (data.metadata && data.metadata.lastCSVUpload) {
                this.setLastCSVUpload(data.metadata.lastCSVUpload);
            }

            if (data.metadata && data.metadata.cacheTimestamps) {
                localStorage.setItem(this.keys.CACHE_TIMESTAMP, JSON.stringify(data.metadata.cacheTimestamps));
            }

            console.log('[DataManager] Data imported successfully.');
            return true;
        } catch (error) {
            console.error('[DataManager] Error importing data:', error);
            throw error;
        }
    }
}
