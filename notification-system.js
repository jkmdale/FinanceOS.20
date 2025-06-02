/**
 * FinanceOS Smart Notification System
 * Handles scheduled reminders, financial alerts, and push notifications
 */

class FinanceOSNotificationManager {
    constructor() {
        this.notifications = {
            csvUpload: {
                id: 'csv-upload-reminder',
                title: '📊 CSV Upload Reminder',
                message: 'Time to upload your weekly bank statements to FinanceOS',
                frequency: 'weekly', // weekly, monthly, daily
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'upload', title: 'Upload Now' },
                    { action: 'snooze', title: 'Remind Later' }
                ]
            },
            budgetReview: {
                id: 'budget-review',
                title: '💰 Monthly Budget Review',
                message: 'Review your spending and adjust your budget for next month',
                frequency: 'monthly',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'review', title: 'Review Now' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            },
            emergencyFundAlert: {
                id: 'emergency-fund-low',
                title: '🚨 Emergency Fund Critical',
                message: 'Your emergency fund is critically low ($0.17). Take action now!',
                frequency: 'weekly',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                priority: 'high',
                actions: [
                    { action: 'add-funds', title: 'Add Funds' },
                    { action: 'view-plan', title: 'View Plan' }
                ]
            },
            goalMilestone: {
                id: 'goal-milestone',
                title: '🎯 Goal Milestone Reached!',
                message: 'Congratulations! You\'ve reached a financial milestone',
                frequency: 'event', // triggered by events
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'celebrate', title: 'View Progress' },
                    { action: 'next-goal', title: 'Set Next Goal' }
                ]
            },
            overspendingAlert: {
                id: 'overspending-alert',
                title: '⚠️ Budget Overspending Alert',
                message: 'You\'ve exceeded your budget in {category} by ${amount}',
                frequency: 'realtime',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                priority: 'high',
                actions: [
                    { action: 'view-budget', title: 'View Budget' },
                    { action: 'adjust', title: 'Adjust Spending' }
                ]
            },
            billReminder: {
                id: 'bill-reminder',
                title: '🧾 Bill Payment Reminder',
                message: 'You have bills due in the next 3 days',
                frequency: 'smart', // checks upcoming bills
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'pay-bills', title: 'Pay Now' },
                    { action: 'view-bills', title: 'View Bills' }
                ]
            },
            creditCardDue: {
                id: 'credit-card-due',
                title: '💳 Credit Card Payment Due',
                message: 'Your Visa payment of $XX is due in 2 days',
                frequency: 'smart',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                priority: 'high',
                actions: [
                    { action: 'pay-now', title: 'Pay Now' },
                    { action: 'schedule', title: 'Schedule Payment' }
                ]
            },
            savingsGoal: {
                id: 'savings-goal-progress',
                title: '💰 Savings Goal Update',
                message: 'You\'re {percentage}% toward your {goalName} goal!',
                frequency: 'monthly',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'view-goals', title: 'View Goals' },
                    { action: 'add-savings', title: 'Add More' }
                ]
            },
            financialHealth: {
                id: 'financial-health-check',
                title: '📈 Monthly Financial Health Report',
                message: 'Your monthly financial health report is ready',
                frequency: 'monthly',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                actions: [
                    { action: 'view-report', title: 'View Report' },
                    { action: 'schedule-review', title: 'Schedule Review' }
                ]
            },
            deficitAlert: {
                id: 'budget-deficit-critical',
                title: '🚨 Budget Deficit Critical',
                message: 'You\'re spending $3,607 more than you earn monthly. Immediate action needed!',
                frequency: 'weekly',
                enabled: true,
                lastSent: null,
                icon: '/icons/icon-192x192.png',
                priority: 'critical',
                actions: [
                    { action: 'fix-budget', title: 'Fix Budget' },
                    { action: 'ai-help', title: 'Get AI Help' }
                ]
            }
        };

        this.permission = 'default';
        this.scheduledNotifications = new Map();
        this.init();
    }

    async init() {
        await this.requestPermission();
        this.setupNotificationScheduler();
        this.setupServiceWorkerNotifications();
        this.restoreScheduledNotifications();
        this.createNotificationSettings();
        
        console.log('FinanceOS Notification Manager initialized');
        console.log('Notification permission:', this.permission);
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            
            if (this.permission === 'granted') {
                console.log('Notification permission granted');
                this.showPermissionGrantedNotification();
            } else if (this.permission === 'denied') {
                console.log('Notification permission denied');
                this.showPermissionDeniedAlert();
            }
        } else {
            console.log('Notifications not supported');
        }
    }

    showPermissionGrantedNotification() {
        this.sendNotification({
            title: '🔔 Notifications Enabled',
            message: 'You\'ll receive smart financial reminders and alerts',
            icon: '/icons/icon-192x192.png',
            tag: 'permission-granted'
        });
    }

    showPermissionDeniedAlert() {
        const alertHTML = `
            <div id="permissionAlert" class="permission-alert">
                <div class="alert-content">
                    <span class="alert-icon">🔔</span>
                    <div class="alert-text">
                        <strong>Enable Notifications</strong>
                        <p>Get smart reminders for CSV uploads, budget alerts, and financial goals</p>
                    </div>
                    <button class="alert-btn" onclick="this.parentElement.parentElement.remove()">
                        Enable in Settings
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);

        // Add alert styles
        const alertStyles = `
            <style>
                .permission-alert {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
                    z-index: 10001;
                    max-width: 350px;
                    animation: slideInRight 0.3s ease-out;
                }

                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .alert-icon {
                    font-size: 1.5rem;
                }

                .alert-text strong {
                    display: block;
                    margin-bottom: 0.25rem;
                }

                .alert-text p {
                    font-size: 0.875rem;
                    opacity: 0.9;
                    margin: 0;
                }

                .alert-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .alert-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', alertStyles);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            const alert = document.getElementById('permissionAlert');
            if (alert) alert.remove();
        }, 10000);
    }

    setupNotificationScheduler() {
        // Check and send scheduled notifications every hour
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 60 * 60 * 1000); // 1 hour

        // Initial check
        setTimeout(() => {
            this.checkScheduledNotifications();
        }, 5000); // 5 seconds after init
    }

    checkScheduledNotifications() {
        const now = new Date();
        
        Object.entries(this.notifications).forEach(([key, notification]) => {
            if (!notification.enabled) return;
            
            if (this.shouldSendNotification(notification, now)) {
                this.sendScheduledNotification(notification);
            }
        });
    }

    shouldSendNotification(notification, now) {
        const lastSent = notification.lastSent ? new Date(notification.lastSent) : null;
        
        switch (notification.frequency) {
            case 'daily':
                return !lastSent || (now - lastSent) >= 24 * 60 * 60 * 1000;
                
            case 'weekly':
                // Send on Sundays or if more than a week has passed
                return !lastSent || 
                       (now.getDay() === 0 && (!lastSent || now.getDate() !== lastSent.getDate())) ||
                       (now - lastSent) >= 7 * 24 * 60 * 60 * 1000;
                
            case 'monthly':
                // Send on 1st of month or if more than a month has passed
                return !lastSent ||
                       (now.getDate() === 1 && (!lastSent || now.getMonth() !== lastSent.getMonth())) ||
                       (now - lastSent) >= 30 * 24 * 60 * 60 * 1000;
                
            case 'smart':
                return this.checkSmartNotificationConditions(notification, now);
                
            case 'realtime':
                return this.checkRealtimeConditions(notification);
                
            default:
                return false;
        }
    }

    checkSmartNotificationConditions(notification, now) {
        switch (notification.id) {
            case 'bill-reminder':
                return this.checkUpcomingBills(now);
                
            case 'credit-card-due':
                return this.checkCreditCardDue(now);
                
            default:
                return false;
        }
    }

    checkUpcomingBills(now) {
        // Check if bills are due in next 3 days
        // This would integrate with actual bill data
        const nextBillDue = new Date(now);
        nextBillDue.setDate(now.getDate() + 15); // Mock: bill due in 15 days
        
        return (nextBillDue - now) <= 3 * 24 * 60 * 60 * 1000;
    }

    checkCreditCardDue(now) {
        // Check credit card payment due date
        // This would integrate with actual credit card data
        const paymentDue = new Date(now);
        paymentDue.setDate(now.getDate() + 2); // Mock: payment due in 2 days
        
        return (paymentDue - now) <= 2 * 24 * 60 * 60 * 1000;
    }

    checkRealtimeConditions(notification) {
        switch (notification.id) {
            case 'overspending-alert':
                return this.checkBudgetOverspending();
                
            default:
                return false;
        }
    }

    checkBudgetOverspending() {
        // Check if user has overspent in any category
        const budgetData = window.FinanceOSData?.getStoredData('budgetData');
        if (!budgetData) return false;
        
        // Mock check - would be real budget analysis
        return Math.random() < 0.1; // 10% chance for demo
    }

    sendScheduledNotification(notification) {
        // Update last sent time
        notification.lastSent = new Date().toISOString();
        this.saveNotificationSettings();
        
        // Send the notification
        this.sendNotification({
            title: notification.title,
            message: notification.message,
            icon: notification.icon,
            tag: notification.id,
            actions: notification.actions,
            data: { notificationId: notification.id }
        });
        
        console.log('Sent scheduled notification:', notification.id);
    }

    sendNotification(options) {
        if (this.permission !== 'granted') return;
        
        const notification = new Notification(options.title, {
            body: options.message,
            icon: options.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: options.tag || 'financeos-notification',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
            data: options.data || {},
            actions: options.actions || []
        });

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            
            // Handle click action based on notification type
            this.handleNotificationClick(options.data?.notificationId || options.tag);
        };

        // Auto-close after 10 seconds if not requiring interaction
        if (!options.requireInteraction) {
            setTimeout(() => {
                notification.close();
            }, 10000);
        }
    }

    handleNotificationClick(notificationId) {
        switch (notificationId) {
            case 'csv-upload-reminder':
                window.location.href = '/csv-upload.html';
                break;
                
            case 'budget-review':
                window.location.href = '/';
                break;
                
            case 'emergency-fund-low':
            case 'savings-goal-progress':
                window.location.href = '/goals.html';
                break;
                
            case 'overspending-alert':
            case 'budget-deficit-critical':
                window.location.href = '/?view=budget';
                break;
                
            default:
                window.location.href = '/';
        }
    }

    setupServiceWorkerNotifications() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'notification-click') {
                    this.handleNotificationClick(event.data.notificationId);
                }
            });
        }
    }

    createNotificationSettings() {
        // Add notification settings to the page
        this.addNotificationSettingsButton();
    }

    addNotificationSettingsButton() {
        const navElements = document.querySelectorAll('.nav');
        
        navElements.forEach(nav => {
            if (!nav.querySelector('.notification-settings-btn')) {
                const settingsBtn = document.createElement('button');
                settingsBtn.className = 'nav-button notification-settings-btn';
                settingsBtn.innerHTML = '🔔 Notifications';
                settingsBtn.addEventListener('click', () => {
                    this.showNotificationSettings();
                });
                
                // Insert before logout button if it exists
                const logoutBtn = nav.querySelector('.logout-btn');
                if (logoutBtn) {
                    nav.insertBefore(settingsBtn, logoutBtn);
                } else {
                    nav.appendChild(settingsBtn);
                }
            }
        });
    }

    showNotificationSettings() {
        const modalHTML = `
            <div id="notificationSettingsModal" class="auth-modal">
                <div class="auth-modal-content glass-premium" style="max-width: 600px;">
                    <div class="settings-header">
                        <h2>🔔 Notification Settings</h2>
                        <button class="close-btn" onclick="document.getElementById('notificationSettingsModal').remove()">&times;</button>
                    </div>
                    
                    <div class="settings-content">
                        <div class="permission-status">
                            <div class="status-item">
                                <span>Notification Permission:</span>
                                <span class="status-badge ${this.permission}">${this.permission}</span>
                                ${this.permission !== 'granted' ? '<button class="btn-small" onclick="window.FinanceOSNotifications.requestPermission()">Enable</button>' : ''}
                            </div>
                        </div>
                        
                        <div class="notification-list">
                            ${Object.entries(this.notifications).map(([key, notification]) => `
                                <div class="notification-item">
                                    <div class="notification-info">
                                        <h4>${notification.title}</h4>
                                        <p>${notification.message}</p>
                                        <span class="frequency-badge">${notification.frequency}</span>
                                        ${notification.priority ? `<span class="priority-badge ${notification.priority}">${notification.priority}</span>` : ''}
                                    </div>
                                    <div class="notification-toggle">
                                        <label class="toggle-switch">
                                            <input type="checkbox" ${notification.enabled ? 'checked' : ''} 
                                                   onchange="window.FinanceOSNotifications.toggleNotification('${key}', this.checked)">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="settings-actions">
                            <button class="btn btn-primary" onclick="window.FinanceOSNotifications.testNotification()">
                                📤 Send Test Notification
                            </button>
                            <button class="btn btn-secondary" onclick="document.getElementById('notificationSettingsModal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addSettingsStyles();
    }

    addSettingsStyles() {
        const styles = `
            <style id="notificationSettingsStyles">
                .settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .settings-header h2 {
                    color: white;
                    font-size: 1.5rem;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .permission-status {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: white;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.granted {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }

                .status-badge.denied,
                .status-badge.default {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .btn-small {
                    padding: 0.25rem 0.75rem;
                    font-size: 0.75rem;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #8b5cf6, #9333ea);
                    color: white;
                    border: none;
                    cursor: pointer;
                }

                .notification-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .notification-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .notification-info h4 {
                    color: white;
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                }

                .notification-info p {
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0 0 0.5rem 0;
                    font-size: 0.875rem;
                }

                .frequency-badge {
                    display: inline-block;
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                    padding: 0.125rem 0.5rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    margin-right: 0.5rem;
                }

                .priority-badge {
                    display: inline-block;
                    padding: 0.125rem 0.5rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .priority-badge.high {
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                }

                .priority-badge.critical {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: 0.3s;
                    border-radius: 24px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                }

                .toggle-switch input:checked + .toggle-slider {
                    background: linear-gradient(135deg, #8b5cf6, #9333ea);
                }

                .toggle-switch input:checked + .toggle-slider:before {
                    transform: translateX(26px);
                }

                .settings-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                @media (max-width: 768px) {
                    .notification-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .settings-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        // Remove existing styles
        const existingStyles = document.getElementById('notificationSettingsStyles');
        if (existingStyles) existingStyles.remove();
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    toggleNotification(notificationKey, enabled) {
        if (this.notifications[notificationKey]) {
            this.notifications[notificationKey].enabled = enabled;
            this.saveNotificationSettings();
            console.log(`Notification ${notificationKey} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    testNotification() {
        this.sendNotification({
            title: '🧪 Test Notification',
            message: 'This is a test notification from FinanceOS. Notifications are working!',
            tag: 'test-notification',
            requireInteraction: false
        });
    }

    saveNotificationSettings() {
        localStorage.setItem('financeosNotificationSettings', JSON.stringify(this.notifications));
    }

    restoreScheduledNotifications() {
        const saved = localStorage.getItem('financeosNotificationSettings');
        if (saved) {
            try {
                const savedNotifications = JSON.parse(saved);
                // Merge saved settings with defaults
                Object.keys(this.notifications).forEach(key => {
                    if (savedNotifications[key]) {
                        this.notifications[key] = {
                            ...this.notifications[key],
                            ...savedNotifications[key]
                        };
                    }
                });
            } catch (error) {
                console.error('Error restoring notification settings:', error);
            }
        }
    }

    // Manual trigger methods for specific notifications
    triggerCSVUploadReminder() {
        this.sendScheduledNotification(this.notifications.csvUpload);
    }

    triggerEmergencyFundAlert() {
        this.sendScheduledNotification(this.notifications.emergencyFundAlert);
    }

    triggerBudgetDeficitAlert() {
        this.sendScheduledNotification(this.notifications.deficitAlert);
    }

    triggerGoalMilestone(goalName, percentage) {
        const notification = { ...this.notifications.goalMilestone };
        notification.message = `Congratulations! You've reached ${percentage}% of your ${goalName} goal!`;
        this.sendScheduledNotification(notification);
    }

    triggerOverspendingAlert(category, amount) {
        const notification = { ...this.notifications.overspendingAlert };
        notification.message = notification.message
            .replace('{category}', category)
            .replace('{amount}', amount);
        this.sendScheduledNotification(notification);
    }

    // Enable/disable all notifications
    enableAllNotifications() {
        Object.keys(this.notifications).forEach(key => {
            this.notifications[key].enabled = true;
        });
        this.saveNotificationSettings();
    }

    disableAllNotifications() {
        Object.keys(this.notifications).forEach(key => {
            this.notifications[key].enabled = false;
        });
        this.saveNotificationSettings();
    }
}

// Create global notification manager instance
window.FinanceOSNotifications = new FinanceOSNotificationManager();

// Integration with CSV upload success
window.addEventListener('csvUploadSuccess', () => {
    // Reset CSV upload reminder when user uploads
    window.FinanceOSNotifications.notifications.csvUpload.lastSent = new Date().toISOString();
    window.FinanceOSNotifications.saveNotificationSettings();
});

// Integration with goal updates
window.addEventListener('goalProgress', (event) => {
    const { goalName, percentage } = event.detail;
    if (percentage >= 25 && percentage % 25 === 0) { // Notify at 25%, 50%, 75%, 100%
        window.FinanceOSNotifications.triggerGoalMilestone(goalName, percentage);
    }
});

console.log('FinanceOS Smart Notification System loaded');