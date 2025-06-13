/**
 * FinanceOS Data Sync Manager
 * Enables automatic updates across all pages when financial data changes
 * Version: 1.2.0
 */

class FinanceOSDataSync {
    constructor() {
        this.updateCallbacks = [];
        this.lastUpdateCheck = 0;
        this.isInitialized = false;
        this.setupUpdateListeners();
        console.log('[FinanceOS Sync] Data Sync Manager initialized');
    }

    /**
     * Register a callback to be called when data updates
     * @param {Function} callback - Function to call on data update
     */
    onDataUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
            console.log('[FinanceOS Sync] Registered update callback');
        }
    }

    /**
     * Set up all data update listeners
     */
    setupUpdateListeners() {
        try {
            // BroadcastChannel for cross-tab updates (modern browsers)
            if (typeof BroadcastChannel !== 'undefined') {
                this.broadcastChannel = new BroadcastChannel('financeos_updates');
                this.broadcastChannel.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'DATA_UPDATED') {
                        console.log('[FinanceOS Sync] Received broadcast update:', event.data);
                        this.handleDataUpdate(event.data);
                    }
                });
                console.log('[FinanceOS Sync] BroadcastChannel listener set up');
            }

            // Storage events for cross-tab updates (fallback)
            window.addEventListener('storage', (event) => {
                if (event.key === 'financeos_data_updated') {
                    console.log('[FinanceOS Sync] Received storage update');
                    this.handleDataUpdate({ 
                        source: 'storage', 
                        timestamp: event.newValue 
                    });
                }
            });

            // Custom events for same-page updates
            window.addEventListener('financeos_data_updated', (event) => {
                console.log('[FinanceOS Sync] Received custom event update');
                this.handleDataUpdate(event.detail);
            });

            // Polling fallback for missed updates
            this.pollInterval = setInterval(() => this.checkForUpdates(), 5000);
            
            // Check for updates when page gets focus
            window.addEventListener('focus', () => this.checkForUpdates());
            
            // Check for updates when page becomes visible
            if (typeof document.visibilityState !== 'undefined') {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        this.checkForUpdates();
                    }
                });
            }

            this.isInitialized = true;
            console.log('[FinanceOS Sync] All update listeners configured');

        } catch (error) {
            console.error('[FinanceOS Sync] Error setting up listeners:', error);
        }
    }

    /**
     * Check for data updates using polling
     */
    checkForUpdates() {
        try {
            const lastUpdate = parseInt(localStorage.getItem('financeos_data_updated') || '0');
            if (lastUpdate > this.lastUpdateCheck) {
                this.lastUpdateCheck = lastUpdate;
                console.log('[FinanceOS Sync] Detected update via polling:', lastUpdate);
                this.handleDataUpdate({ 
                    source: 'polling', 
                    timestamp: lastUpdate 
                });
            }
        } catch (error) {
            console.error('[FinanceOS Sync] Error checking for updates:', error);
        }
    }

    /**
     * Handle incoming data updates
     * @param {Object} data - Update data object
     */
    handleDataUpdate(data) {
        if (!data) return;

        console.log('[FinanceOS Sync] Processing data update:', data);
        
        // Call all registered callbacks
        this.updateCallbacks.forEach((callback, index) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[FinanceOS Sync] Error in update callback ${index}:`, error);
            }
        });

        // Update our last check timestamp
        if (data.timestamp) {
            this.lastUpdateCheck = Math.max(this.lastUpdateCheck, data.timestamp);
        }
    }

    /**
     * Trigger a data update across all pages
     * @param {Object} updateData - Data about the update
     */
    triggerDataUpdate(updateData = {}) {
        const timestamp = Date.now();
        const updatePayload = {
            type: 'DATA_UPDATED',
            timestamp: timestamp,
            source: updateData.source || 'unknown',
            ...updateData
        };

        try {
            // Update localStorage timestamp
            localStorage.setItem('financeos_data_updated', timestamp.toString());

            // Send via BroadcastChannel
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(updatePayload);
                console.log('[FinanceOS Sync] Sent broadcast update');
            }

            // Send via custom event
            window.dispatchEvent(new CustomEvent('financeos_data_updated', {
                detail: updatePayload
            }));

            // Call local callbacks
            this.handleDataUpdate(updatePayload);

            console.log('[FinanceOS Sync] Data update triggered:', updatePayload);

        } catch (error) {
            console.error('[FinanceOS Sync] Error triggering data update:', error);
        }
    }

    /**
     * Show a notification to the user
     * @param {string} message - Message to display
     * @param {string} type - Notification type (success, warning, error)
     */
    showUpdateNotification(message = 'Data updated!', type = 'success') {
        // Remove existing notification
        const existingNotification = document.getElementById('financeos-update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.id = 'financeos-update-notification';
        
        // Set colors based on type
        let backgroundColor, borderColor;
        switch (type) {
            case 'success':
                backgroundColor = 'linear-gradient(135deg, #10b981, #059669)';
                borderColor = 'rgba(16, 185, 129, 0.3)';
                break;
            case 'warning':
                backgroundColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
                borderColor = 'rgba(245, 158, 11, 0.3)';
                break;
            case 'error':
                backgroundColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
                borderColor = 'rgba(239, 68, 68, 0.3)';
                break;
            default:
                backgroundColor = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
                borderColor = 'rgba(139, 92, 246, 0.3)';
        }

        notification.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 10000;
            background: ${backgroundColor};
            color: white; 
            padding: 16px 20px; 
            border-radius: 12px;
            box-shadow: 0 8px 32px ${borderColor};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 600; 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateX(400px); 
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 300px;
            font-size: 14px;
            line-height: 1.4;
            cursor: pointer;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto-dismiss after 3 seconds
        const dismissTimer = setTimeout(() => {
            this.dismissNotification(notification);
        }, 3000);

        // Allow manual dismiss by clicking
        notification.addEventListener('click', () => {
            clearTimeout(dismissTimer);
            this.dismissNotification(notification);
        });

        console.log('[FinanceOS Sync] Notification shown:', message);
    }

    /**
     * Dismiss a notification
     * @param {HTMLElement} notification - Notification element to dismiss
     */
    dismissNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }

    /**
     * Save data and trigger updates
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @param {Object} updateInfo - Information about the update
     */
    saveData(key, data, updateInfo = {}) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`[FinanceOS Sync] Saved data to ${key}`);
            
            this.triggerDataUpdate({
                source: updateInfo.source || 'data_save',
                dataType: key,
                message: updateInfo.message,
                ...updateInfo
            });

        } catch (error) {
            console.error('[FinanceOS Sync] Error saving data:', error);
            this.showUpdateNotification('Error saving data', 'error');
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Parsed data or default value
     */
    loadData(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`[FinanceOS Sync] Error loading data from ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Clear all FinanceOS data (for logout/reset)
     */
    clearAllData() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('financeos_')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            this.triggerDataUpdate({
                source: 'data_clear',
                message: 'All data cleared'
            });

            console.log('[FinanceOS Sync] Cleared all FinanceOS data');

        } catch (error) {
            console.error('[FinanceOS Sync] Error clearing data:', error);
        }
    }

    /**
     * Get sync status information
     * @returns {Object} Status information
     */
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            lastUpdateCheck: this.lastUpdateCheck,
            callbackCount: this.updateCallbacks.length,
            hasBroadcastChannel: !!this.broadcastChannel,
            lastDataUpdate: localStorage.getItem('financeos_data_updated')
        };
    }

    /**
     * Cleanup resources (call on page unload)
     */
    cleanup() {
        try {
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
            }
            
            if (this.broadcastChannel) {
                this.broadcastChannel.close();
            }

            this.updateCallbacks = [];
            console.log('[FinanceOS Sync] Cleanup completed');

        } catch (error) {
            console.error('[FinanceOS Sync] Error during cleanup:', error);
        }
    }
}

// Initialize global sync manager
if (typeof window !== 'undefined') {
    window.FinanceOSSync = new FinanceOSDataSync();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.FinanceOSSync) {
            window.FinanceOSSync.cleanup();
        }
    });

    // Make it globally accessible for debugging
    if (typeof window.FinanceOS === 'undefined') {
        window.FinanceOS = {};
    }
    window.FinanceOS.Sync = window.FinanceOSSync;
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceOSDataSync;
}