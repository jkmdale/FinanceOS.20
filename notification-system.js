/**
 * Simple FinanceOS Notification System
 * Clean implementation without authentication dependencies
 */

class SimpleFinanceOSNotifications {
    constructor() {
        this.permission = 'default';
        this.notifications = {
            csvUpload: {
                id: 'csv-upload-reminder',
                title: '📊 CSV Upload Reminder',
                message: 'Time to upload your weekly bank statements to FinanceOS',
                frequency: 'weekly',
                enabled: true,
                lastSent: null
            },
            emergencyFund: {
                id: 'emergency-fund-low',
                title: '🚨 Emergency Fund Critical',
                message: 'Your emergency fund is critically low ($0.17). Take action now!',
                frequency: 'weekly',
                enabled: true,
                lastSent: null,
                priority: 'high'
            },
            budgetDeficit: {
                id: 'budget-deficit-critical',
                title: '🚨 Budget Deficit Critical',
                message: 'You\'re spending $3,607 more than you earn monthly. Immediate action needed!',
                frequency: 'weekly',
                enabled: true,
                lastSent: null,
                priority: 'critical'
            },
            goalMilestone: {
                id: 'goal-milestone',
                title: '🎯 Goal Milestone Reached!',
                message: 'Congratulations! You\'ve reached a financial milestone',
                frequency: 'event',
                enabled: true,
                lastSent: null
            },
            budgetReview: {
                id: 'budget-review',
                title: '💰 Monthly Budget Review',
                message: 'Review your spending and adjust your budget for next month',
                frequency: 'monthly',
                enabled: true,
                lastSent: null
            }
        };
        
        console.log('Initializing Simple Notification System...');
        this.init();
    }

    async init() {
        await this.requestPermission();
        this.setupScheduler();
        this.restoreSettings();
        console.log('Simple Notification System initialized');
        console.log('Permission status:', this.permission);
    }

    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            
            if (this.permission === 'granted') {
                console.log('Notification permission granted');
                this.showWelcomeNotification();
            } else if (this.permission === 'denied') {
                console.log('Notification permission denied');
                this.showPermissionAlert();
            }
        } else {
            console.log('Notifications not supported');
        }
    }

    showWelcomeNotification() {
        this.sendNotification({
            title: '🔔 FinanceOS Notifications Enabled',
            message: 'You\'ll receive smart financial reminders and alerts',
            tag: 'welcome-notification'
        });
    }

    showPermissionAlert() {
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
            z-index: 10001;
            max-width: 300px;
            font-size: 0.875rem;
        `;
        alert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">🔔</span>
                <div>
                    <strong>Enable Notifications</strong>
                    <p style="margin: 0.25rem 0 0 0; opacity: 0.9;">Get smart financial reminders</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) alert.remove();
        }, 8000);
    }

    setupScheduler() {
        // Check notifications every hour
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 60 * 60 * 1000);

        // Initial check after 5 seconds
        setTimeout(() => {
            this.checkScheduledNotifications();
        }, 5000);
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
                
            case 'event':
                // Event-based notifications are triggered manually
                return false;
                
            default:
                return false;
        }
    }

    sendScheduledNotification(notification) {
        // Update last sent time
        notification.lastSent = new Date().toISOString();
        this.saveSettings();
        
        // Send the notification
        this.sendNotification({
            title: notification.title,
            message: notification.message,
            tag: notification.id,
            priority: notification.priority
        });
        
        console.log('Sent scheduled notification:', notification.id);
    }

    sendNotification(options) {
        if (this.permission !== 'granted') {
            console.log('Cannot send notification - permission not granted');
            return;
        }
        
        const notification = new Notification(options.title, {
            body: options.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: options.tag || 'financeos-notification',
            requireInteraction: options.priority === 'critical' || options.priority === 'high',
            silent: false
        });

        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            this.handleNotificationClick(options.tag);
        };

        // Auto-close after 8 seconds if not critical
        if (options.priority !== 'critical' && options.priority !== 'high') {
            setTimeout(() => {
                notification.close();
            }, 8000);
        }
    }

    handleNotificationClick(notificationId) {
        switch (notificationId) {
            case 'csv-upload-reminder':
                window.location.href = '/csv-upload.html';
                break;
                
            case 'emergency-fund-low':
            case 'goal-milestone':
                window.location.href = '/goals.html';
                break;
                
            case 'budget-deficit-critical':
            case 'budget-review':
                window.location.href = '/';
                break;
                
            default:
                window.location.href = '/';
        }
    }

    showNotificationSettings() {
        // Remove existing modal if present
        const existing = document.getElementById('notificationSettingsModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'notificationSettingsModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                max-width: 600px;
                width: 90%;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <h2 style="color: white; font-size: 1.5rem; margin: 0;">🔔 Notification Settings</h2>
                    <button onclick="document.getElementById('notificationSettingsModal').remove()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: background 0.2s;">&times;</button>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; color: white;">
                            <span>Notification Permission:</span>
                            <span style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; ${this.permission === 'granted' ? 'background: rgba(16, 185, 129, 0.2); color: #10b981;' : 'background: rgba(239, 68, 68, 0.2); color: #ef4444;'}">${this.permission}</span>
                            ${this.permission !== 'granted' ? '<button onclick="window.FinanceOSNotifications.requestPermission()" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 6px; background: linear-gradient(135deg, #8b5cf6, #9333ea); color: white; border: none; cursor: pointer;">Enable</button>' : ''}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; max-height: 400px; overflow-y: auto;">
                    ${Object.entries(this.notifications).map(([key, notification]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <div style="flex: 1;">
                                <h4 style="color: white; margin: 0 0 0.25rem 0; font-size: 1rem;">${notification.title}</h4>
                                <p style="color: rgba(255, 255, 255, 0.7); margin: 0 0 0.5rem 0; font-size: 0.875rem;">${notification.message}</p>
                                <div style="display: flex; gap: 0.5rem;">
                                    <span style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 0.125rem 0.5rem; border-radius: 8px; font-size: 0.75rem;">${notification.frequency}</span>
                                    ${notification.priority ? `<span style="background: ${notification.priority === 'critical' ? 'rgba(239, 68, 68, 0.2); color: #ef4444;' : 'rgba(245, 158, 11, 0.2); color: #f59e0b;'}; padding: 0.125rem 0.5rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">${notification.priority}</span>` : ''}
                                </div>
                            </div>
                            <div>
                                <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" ${notification.enabled ? 'checked' : ''} onchange="window.FinanceOSNotifications.toggleNotification('${key}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.2); transition: 0.3s; border-radius: 24px; ${notification.enabled ? 'background: linear-gradient(135deg, #8b5cf6, #9333ea);' : ''}"></span>
                                    <span style="position: absolute; content: ''; height: 20px; width: 20px; left: 2px; bottom: 2px; background-color: white; transition: 0.3s; border-radius: 50%; ${notification.enabled ? 'transform: translateX(26px);' : ''}"></span>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="window.FinanceOSNotifications.testNotification()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #8b5cf6, #9333ea); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">📤 Send Test Notification</button>
                    <button onclick="document.getElementById('notificationSettingsModal').remove()" style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Close</button>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleNotification(notificationKey, enabled) {
        if (this.notifications[notificationKey]) {
            this.notifications[notificationKey].enabled = enabled;
            this.saveSettings();
            console.log(`Notification ${notificationKey} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    testNotification() {
        this.sendNotification({
            title: '🧪 Test Notification',
            message: 'This is a test notification from FinanceOS. Notifications are working perfectly!',
            tag: 'test-notification'
        });
    }

    saveSettings() {
        localStorage.setItem('financeosNotificationSettings', JSON.stringify(this.notifications));
    }

    restoreSettings() {
        const saved = localStorage.getItem('financeosNotificationSettings');
        if (saved) {
            try {
                const savedNotifications = JSON.parse(saved);
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

    // Manual trigger methods
    triggerCSVUploadReminder() {
        this.sendScheduledNotification(this.notifications.csvUpload);
    }

    triggerEmergencyFundAlert() {
        this.sendScheduledNotification(this.notifications.emergencyFund);
    }

    triggerBudgetDeficitAlert() {
        this.sendScheduledNotification(this.notifications.budgetDeficit);
    }

    triggerGoalMilestone(goalName, percentage) {
        const notification = { ...this.notifications.goalMilestone };
        notification.message = `Congratulations! You've reached ${percentage}% of your ${goalName} goal!`;
        this.sendScheduledNotification(notification);
    }
}

// Create global notification manager instance
window.FinanceOSNotifications = new SimpleFinanceOSNotifications();

// Event listeners for CSV upload and goal progress
window.addEventListener('csvUploadSuccess', () => {
    if (window.FinanceOSNotifications) {
        window.FinanceOSNotifications.notifications.csvUpload.lastSent = new Date().toISOString();
        window.FinanceOSNotifications.saveSettings();
    }
});

window.addEventListener('goalProgress', (event) => {
    if (window.FinanceOSNotifications && event.detail) {
        const { goalName, percentage } = event.detail;
        if (percentage >= 25 && percentage % 25 === 0) {
            window.FinanceOSNotifications.triggerGoalMilestone(goalName, percentage);
        }
    }
});

console.log('Simple FinanceOS Notification System loaded successfully');