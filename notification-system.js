// FinanceOS Notification System
// Handles PWA notifications, financial alerts, and user preferences

class FinanceOSNotifications {
    constructor() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.permission = this.isSupported ? Notification.permission : 'denied';
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCriticalAlerts();
        this.schedulePeriodicChecks();
    }

    // Default notification settings
    getDefaultSettings() {
        return {
            enabled: true,
            criticalAlerts: true,
            budgetAlerts: true,
            goalMilestones: true,
            weeklyReports: true,
            csvUploadReminders: true,
            lowBalanceAlerts: true,
            unusualSpending: true,
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00'
            },
            frequency: {
                dailyCheck: true,
                weeklyReport: true,
                monthlySummary: true
            }
        };
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const stored = localStorage.getItem('notificationSettings');
            return stored ? { ...this.getDefaultSettings(), ...JSON.parse(stored) } : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading notification settings:', error);
            return this.getDefaultSettings();
        }
    }

    // Save settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            return 'denied';
        }

        try {
            this.permission = await Notification.requestPermission();
            return this.permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    // Check if currently in quiet hours
    isQuietHours() {
        if (!this.settings.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const startTime = this.parseTime(this.settings.quietHours.start);
        const endTime = this.parseTime(this.settings.quietHours.end);

        if (startTime > endTime) {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        } else {
            return currentTime >= startTime && currentTime <= endTime;
        }
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Send notification
    async sendNotification(title, options = {}) {
        if (!this.settings.enabled || this.isQuietHours()) {
            console.log('Notification suppressed:', title);
            return null;
        }

        if (this.permission !== 'granted') {
            console.log('Notification permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: options.tag || 'general',
                renotify: options.renotify || false,
                silent: options.silent || false,
                ...options
            });

            // Auto-close after 10 seconds unless it's critical
            if (!options.persistent && options.priority !== 'critical') {
                setTimeout(() => notification.close(), 10000);
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }

    // Critical financial alerts
    sendCriticalAlert(type, message, actions = []) {
        if (!this.settings.criticalAlerts) return;

        const criticalOptions = {
            body: message,
            priority: 'critical',
            persistent: true,
            tag: `critical-${type}`,
            renotify: true,
            actions: actions.map(action => ({
                action: action.id,
                title: action.title
            })),
            data: { type: 'critical', category: type }
        };

        return this.sendNotification('🚨 Financial Alert', criticalOptions);
    }

    // Budget alerts
    sendBudgetAlert(category, amount, budget, percentage) {
        if (!this.settings.budgetAlerts) return;

        const message = `${category}: $${amount.toFixed(2)} spent (${percentage.toFixed(0)}% of $${budget.toFixed(2)} budget)`;
        
        const options = {
            body: message,
            tag: `budget-${category}`,
            data: { type: 'budget', category, amount, budget, percentage }
        };

        if (percentage >= 100) {
            options.priority = 'high';
            return this.sendNotification('📊 Budget Exceeded', options);
        } else if (percentage >= 80) {
            return this.sendNotification('⚠️ Budget Warning', options);
        }
    }

    // Goal milestone notifications
    sendGoalMilestone(goalTitle, percentage, amount, target) {
        if (!this.settings.goalMilestones) return;

        const milestones = [25, 50, 75, 90, 100];
        const milestone = milestones.find(m => percentage >= m && percentage < m + 5);
        
        if (milestone) {
            const message = `${goalTitle}: ${milestone}% complete! $${amount.toFixed(2)} of $${target.toFixed(2)}`;
            
            const options = {
                body: message,
                tag: `goal-${goalTitle}`,
                data: { type: 'goal', title: goalTitle, percentage, amount, target }
            };

            return this.sendNotification('🎯 Goal Progress', options);
        }
    }

    // Weekly financial report
    sendWeeklyReport() {
        if (!this.settings.weeklyReports) return;

        const dataManager = window.FinanceOSDataManager;
        if (!dataManager) return;

        const summary = dataManager.getAccountSummary();
        const recentTransactions = dataManager.getRecentTransactions(5);
        
        const message = `Net Worth: ${dataManager.formatCurrency(summary.netWorth)}
Monthly Flow: ${dataManager.formatCurrency(summary.monthlyFlow)}
Recent transactions: ${recentTransactions.length}`;

        const options = {
            body: message,
            tag: 'weekly-report',
            data: { type: 'report', period: 'weekly' }
        };

        return this.sendNotification('📊 Weekly Financial Report', options);
    }

    // CSV upload reminders
    sendCSVUploadReminder() {
        if (!this.settings.csvUploadReminders) return;

        const lastUpload = localStorage.getItem('csvUploadDate');
        if (!lastUpload) return;

        const daysSinceUpload = Math.floor((Date.now() - new Date(lastUpload)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpload >= 7) {
            const message = `It's been ${daysSinceUpload} days since your last upload. Keep your data current!`;
            
            const options = {
                body: message,
                tag: 'csv-reminder',
                actions: [
                    { action: 'upload', title: 'Upload Now' },
                    { action: 'remind-later', title: 'Remind Later' }
                ],
                data: { type: 'reminder', category: 'csv-upload' }
            };

            return this.sendNotification('📤 Upload Reminder', options);
        }
    }

    // Low balance alerts
    sendLowBalanceAlert(accountName, balance, threshold = 100) {
        if (!this.settings.lowBalanceAlerts) return;

        if (balance <= threshold && balance > 0) {
            const message = `${accountName} balance is low: ${window.FinanceOSDataManager?.formatCurrency(balance) || `$${balance.toFixed(2)}`}`;
            
            const options = {
                body: message,
                tag: `low-balance-${accountName}`,
                priority: balance <= 10 ? 'high' : 'normal',
                data: { type: 'low-balance', account: accountName, balance }
            };

            return this.sendNotification('⚠️ Low Balance Alert', options);
        }
    }

    // Unusual spending detection
    sendUnusualSpendingAlert(amount, category, average) {
        if (!this.settings.unusualSpending) return;

        if (amount > average * 2) {
            const message = `Unusual ${category} spending: ${window.FinanceOSDataManager?.formatCurrency(amount) || `$${amount.toFixed(2)}`} (avg: ${window.FinanceOSDataManager?.formatCurrency(average) || `$${average.toFixed(2)}`})`;
            
            const options = {
                body: message,
                tag: `unusual-${category}`,
                data: { type: 'unusual-spending', category, amount, average }
            };

            return this.sendNotification('💰 Unusual Spending', options);
        }
    }

    // Check for critical alerts based on current financial data
    checkCriticalAlerts() {
        const dataManager = window.FinanceOSDataManager;
        if (!dataManager) return;

        const summary = dataManager.getAccountSummary();
        
        // Emergency fund critical alert
        const emergencyFund = dataManager.accounts.find(a => a.name === 'My Savings')?.balance || 0;
        if (emergencyFund < 1000) {
            this.sendCriticalAlert(
                'emergency-fund',
                `Emergency fund critically low: ${dataManager.formatCurrency(emergencyFund)}. You need at least $1,000 for basic security.`,
                [
                    { id: 'start-saving', title: 'Start Saving' },
                    { id: 'view-plan', title: 'View Plan' }
                ]
            );
        }

        // Budget deficit alert
        if (summary.monthlyFlow < -1000) {
            this.sendCriticalAlert(
                'budget-deficit',
                `Monthly budget deficit: ${dataManager.formatCurrency(summary.monthlyFlow)}. This is unsustainable and requires immediate action.`,
                [
                    { id: 'fix-budget', title: 'Fix Budget' },
                    { id: 'view-expenses', title: 'View Expenses' }
                ]
            );
        }

        // Check low balances
        dataManager.accounts.forEach(account => {
            if (account.type === 'checking' || account.type === 'savings') {
                this.sendLowBalanceAlert(account.name, account.balance);
            }
        });
    }

    // Schedule periodic checks
    schedulePeriodicChecks() {
        // Check every hour for critical alerts
        setInterval(() => this.checkCriticalAlerts(), 60 * 60 * 1000);

        // Daily check at 9 AM
        const now = new Date();
        const daily = new Date();
        daily.setHours(9, 0, 0, 0);
        if (daily <= now) {
            daily.setDate(daily.getDate() + 1);
        }

        setTimeout(() => {
            this.dailyCheck();
            setInterval(() => this.dailyCheck(), 24 * 60 * 60 * 1000);
        }, daily - now);

        // Weekly report on Sundays at 6 PM
        const weekly = new Date();
        weekly.setDate(weekly.getDate() + (7 - weekly.getDay()));
        weekly.setHours(18, 0, 0, 0);

        setTimeout(() => {
            this.sendWeeklyReport();
            setInterval(() => this.sendWeeklyReport(), 7 * 24 * 60 * 60 * 1000);
        }, weekly - now);
    }

    // Daily check routine
    dailyCheck() {
        if (!this.settings.frequency.dailyCheck) return;

        this.checkCriticalAlerts();
        this.sendCSVUploadReminder();
        
        // Check budget status
        if (window.FinanceOSDataManager) {
            const budgetStatus = window.FinanceOSDataManager.getBudgetStatus();
            budgetStatus.forEach(category => {
                if (category.percentage >= 80) {
                    this.sendBudgetAlert(category.name, category.actual, category.budgeted, category.percentage);
                }
            });
        }
    }

    // Show notification settings modal
    showNotificationSettings() {
        this.createSettingsModal();
    }

    // Create settings modal
    createSettingsModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('notification-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'notification-settings-modal';
        modal.className = 'notification-modal glass';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔔 Notification Settings</h3>
                    <button class="modal-close" onclick="this.closest('.notification-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    ${!this.isSupported ? '<div class="alert-warning">⚠️ Notifications not supported in this browser</div>' : ''}
                    ${this.permission !== 'granted' ? '<div class="alert-info">ℹ️ Click "Enable Notifications" to receive alerts</div>' : ''}
                    
                    <div class="setting-group">
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.enabled ? 'checked' : ''} data-setting="enabled">
                                Enable Notifications
                            </label>
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Alert Types</h4>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.criticalAlerts ? 'checked' : ''} data-setting="criticalAlerts">
                                Critical Financial Alerts
                            </label>
                            <small>Emergency fund, budget deficit warnings</small>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.budgetAlerts ? 'checked' : ''} data-setting="budgetAlerts">
                                Budget Alerts
                            </label>
                            <small>When spending exceeds 80% of category budget</small>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.goalMilestones ? 'checked' : ''} data-setting="goalMilestones">
                                Goal Milestones
                            </label>
                            <small>Progress updates for savings goals</small>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.lowBalanceAlerts ? 'checked' : ''} data-setting="lowBalanceAlerts">
                                Low Balance Alerts
                            </label>
                            <small>When account balance drops below $100</small>
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Reports</h4>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.weeklyReports ? 'checked' : ''} data-setting="weeklyReports">
                                Weekly Reports
                            </label>
                            <small>Sunday evening financial summary</small>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.csvUploadReminders ? 'checked' : ''} data-setting="csvUploadReminders">
                                CSV Upload Reminders
                            </label>
                            <small>Remind to upload bank statements weekly</small>
                        </div>
                    </div>

                    <div class="setting-group">
                        <h4>Quiet Hours</h4>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" ${this.settings.quietHours.enabled ? 'checked' : ''} data-setting="quietHours.enabled">
                                Enable Quiet Hours
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label class="setting-label">
                                From: <input type="time" value="${this.settings.quietHours.start}" data-setting="quietHours.start" class="time-input">
                                To: <input type="time" value="${this.settings.quietHours.end}" data-setting="quietHours.end" class="time-input">
                            </label>
                            <small>No notifications during these hours</small>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    ${this.permission !== 'granted' ? 
                        '<button class="btn-primary" onclick="window.FinanceOSNotifications.requestPermission().then(() => this.closest(\'.notification-modal\').remove())">Enable Notifications</button>' : ''}
                    <button class="btn-secondary" onclick="window.FinanceOSNotifications.testNotification()">Test Notification</button>
                    <button class="btn-primary" onclick="window.FinanceOSNotifications.saveSettingsFromModal(); this.closest('.notification-modal').remove()">Save Settings</button>
                </div>
            </div>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-modal-styles';
            styles.textContent = `
                .notification-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .modal-header h3 {
                    color: white;
                    margin: 0;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .setting-group {
                    margin-bottom: 20px;
                }
                
                .setting-group h4 {
                    color: white;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }
                
                .setting-item {
                    margin-bottom: 15px;
                }
                
                .setting-label {
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                }
                
                .setting-label input[type="checkbox"] {
                    margin: 0;
                }
                
                .setting-label small {
                    color: rgba(255, 255, 255, 0.7);
                    display: block;
                    margin-top: 5px;
                    margin-left: 25px;
                }
                
                .time-input {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 5px;
                    color: white;
                    padding: 5px;
                    margin: 0 10px;
                }
                
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .btn-primary, .btn-secondary {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #8b5cf6, #9333ea);
                    color: white;
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                .alert-warning, .alert-info {
                    padding: 10px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                }
                
                .alert-warning {
                    background: rgba(245, 158, 11, 0.2);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #fbbf24;
                }
                
                .alert-info {
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);
    }

    // Save settings from modal
    saveSettingsFromModal() {
        const modal = document.getElementById('notification-settings-modal');
        if (!modal) return;

        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const timeInputs = modal.querySelectorAll('input[type="time"]');

        checkboxes.forEach(checkbox => {
            const setting = checkbox.dataset.setting;
            if (setting.includes('.')) {
                const [parent, child] = setting.split('.');
                this.settings[parent][child] = checkbox.checked;
            } else {
                this.settings[setting] = checkbox.checked;
            }
        });

        timeInputs.forEach(input => {
            const setting = input.dataset.setting;
            if (setting.includes('.')) {
                const [parent, child] = setting.split('.');
                this.settings[parent][child] = input.value;
            }
        });

        this.saveSettings();
        console.log('Notification settings saved:', this.settings);
    }

    // Test notification
    testNotification() {
        this.sendNotification('🧪 Test Notification', {
            body: 'FinanceOS notifications are working correctly!',
            tag: 'test-notification'
        });
    }

    // Event listeners
    setupEventListeners() {
        // Listen for notification clicks
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'notification-click') {
                    this.handleNotificationClick(event.data);
                }
            });
        }

        // Listen for visibility change to check alerts when app becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkCriticalAlerts();
            }
        });
    }

    // Handle notification clicks
    handleNotificationClick(data) {
        switch (data.action) {
            case 'upload':
                window.location.href = 'csv-upload.html';
                break;
            case 'start-saving':
            case 'view-plan':
            case 'fix-budget':
                window.location.href = 'goals.html';
                break;
            case 'view-expenses':
                window.location.href = 'index.html';
                break;
            default:
                // Default action - focus the app
                window.focus();
        }
    }
}

// Initialize notification system
window.FinanceOSNotifications = new FinanceOSNotifications();

// Request permission on first load if notifications are enabled
if (window.FinanceOSNotifications.settings.enabled && 
    window.FinanceOSNotifications.permission === 'default') {
    // Delay request to avoid being too aggressive
    setTimeout(() => {
        window.FinanceOSNotifications.requestPermission();
    }, 5000);
}

console.log('FinanceOS Notification System loaded successfully');