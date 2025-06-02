// FinanceOS Authentication Bypass - Temporary Fix
// Replace auth-system.js with this until we fix the freezing issue

console.log('Loading simplified authentication...');

// Bypass authentication for now
localStorage.setItem('financeosAuthTime', Date.now().toString());

// Simple logout functionality
function addLogoutButton() {
    const navElements = document.querySelectorAll('.nav');
    
    navElements.forEach(nav => {
        // Check if logout button already exists
        if (!nav.querySelector('.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'nav-button logout-btn';
            logoutBtn.innerHTML = '🚪 Logout';
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('financeosAuthTime');
                    alert('Logged out successfully');
                    location.reload();
                }
            });
            
            nav.appendChild(logoutBtn);
        }
    });
}

// Initialize logout button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLogoutButton);
} else {
    addLogoutButton();
}

console.log('Simplified auth loaded - app should be accessible');