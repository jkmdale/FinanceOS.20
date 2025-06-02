/**
 * FinanceOS Enhanced Authentication System
 * Handles biometric authentication, session management, and logout
 */

class FinanceOSAuth {
    constructor() {
        this.isAuthenticated = false;
        this.authTimeout = 5 * 60 * 1000; // 5 minutes timeout
        this.lastActivity = Date.now();
        this.biometricSupported = false;
        this.authModal = null;
        
        this.init();
    }

    async init() {
        // Check biometric support
        this.biometricSupported = await this.checkBiometricSupport();
        
        // Create auth modal
        this.createAuthModal();
        
        // Check authentication status on page load
        this.checkAuthStatus();
        
        // Set up activity monitoring
        this.setupActivityMonitoring();
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkAuthStatus();
            }
        });
        
        console.log('FinanceOS Auth System initialized');
        console.log('Biometric support:', this.biometricSupported);
    }

    async checkBiometricSupport() {
        if (!('PublicKeyCredential' in window)) {
            return false;
        }
        
        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (error) {
            console.log('Biometric check failed:', error);
            return false;
        }
    }

    createAuthModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="authModal" class="auth-modal">
                <div class="auth-modal-content glass-premium">
                    <div class="auth-header">
                        <div class="logo">
                            <div class="logo-icon">$</div>
                            <span class="logo-text">FinanceOS</span>
                        </div>
                        <h2>Secure Access Required</h2>
                        <p>Please authenticate to continue</p>
                    </div>
                    
                    <div class="auth-content">
                        ${this.biometricSupported ? `
                            <button class="auth-btn btn-primary" id="biometricAuthBtn">
                                <span class="auth-icon">👆</span>
                                Use Fingerprint
                            </button>
                            
                            <div class="auth-divider">
                                <span>or</span>
                            </div>
                        ` : ''}
                        
                        <div class="passcode-section">
                            <label for="passcode">Enter Passcode</label>
                            <input type="password" id="passcode" placeholder="Enter your passcode" maxlength="6">
                            <button class="auth-btn btn-secondary" id="passcodeAuthBtn">
                                <span class="auth-icon">🔑</span>
                                Sign In
                            </button>
                        </div>
                        
                        <div class="auth-error" id="authError"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.authModal = document.getElementById('authModal');
        
        // Add event listeners
        this.setupAuthModalEvents();
        
        // Add styles
        this.addAuthStyles();
    }

    setupAuthModalEvents() {
        const biometricBtn = document.getElementById('biometricAuthBtn');
        const passcodeBtn = document.getElementById('passcodeAuthBtn');
        const passcodeInput = document.getElementById('passcode');

        if (biometricBtn) {
            biometricBtn.addEventListener('click', () => this.authenticateWithBiometric());
        }

        if (passcodeBtn) {
            passcodeBtn.addEventListener('click', () => this.authenticateWithPasscode());
        }

        if (passcodeInput) {
            passcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.authenticateWithPasscode();
                }
            });
        }
    }

    addAuthStyles() {
        const styles = `
            <style id="authModalStyles">
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }

                .auth-modal-content {
                    max-width: 400px;
                    width: 90%;
                    padding: 2rem;
                    border-radius: 20px;
                    text-align: center;
                    animation: slideUp 0.3s ease-out;
                }

                .auth-header {
                    margin-bottom: 2rem;
                }

                .auth-header .logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .auth-header .logo-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                }

                .auth-header .logo-text {
                    font-size: 1.75rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .auth-header h2 {
                    color: white;
                    margin-bottom: 0.5rem;
                    font-size: 1.5rem;
                }

                .auth-header p {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1rem;
                }

                .auth-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .auth-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                }

                .auth-btn:hover {
                    transform: translateY(-2px);
                }

                .auth-btn.btn-primary {
                    background: linear-gradient(135deg, #8b5cf6, #9333ea);
                    color: white;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }

                .auth-btn.btn-primary:hover {
                    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
                }

                .auth-btn.btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .auth-btn.btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .auth-icon {
                    font-size: 1.25rem;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    margin: 0.5rem 0;
                    color: rgba(255, 255, 255, 0.5);
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.2);
                }

                .auth-divider span {
                    padding: 0 1rem;
                    font-size: 0.875rem;
                }

                .passcode-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .passcode-section label {
                    color: white;
                    font-weight: 500;
                    text-align: left;
                }

                .passcode-section input {
                    padding: 0.75rem;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 1.125rem;
                    text-align: center;
                    letter-spacing: 0.25rem;
                }

                .passcode-section input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing: normal;
                }

                .passcode-section input:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .auth-error {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    min-height: 1.25rem;
                }

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

                @media (max-width: 480px) {
                    .auth-modal-content {
                        padding: 1.5rem;
                        margin: 1rem;
                    }
                }
            </style>
        `;

        // Remove existing styles and add new ones
        const existingStyles = document.getElementById('authModalStyles');
        if (existingStyles) {
            existingStyles.remove();
        }
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    async authenticateWithBiometric() {
        const errorDiv = document.getElementById('authError');
        const biometricBtn = document.getElementById('biometricAuthBtn');
        
        try {
            biometricBtn.innerHTML = '<span class="auth-icon">⏳</span>Authenticating...';
            biometricBtn.disabled = true;
            errorDiv.textContent = '';

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    userVerification: "required",
                    allowCredentials: []
                }
            });

            if (assertion) {
                this.onAuthSuccess();
            } else {
                throw new Error('Authentication failed');
            }

        } catch (error) {
            console.error('Biometric authentication failed:', error);
            errorDiv.textContent = 'Biometric authentication failed. Please try passcode.';
            biometricBtn.innerHTML = '<span class="auth-icon">👆</span>Use Fingerprint';
            biometricBtn.disabled = false;
        }
    }

    authenticateWithPasscode() {
        const passcodeInput = document.getElementById('passcode');
        const passcodeBtn = document.getElementById('passcodeAuthBtn');
        const errorDiv = document.getElementById('authError');
        
        const passcode = passcodeInput.value.trim();
        
        if (!passcode) {
            errorDiv.textContent = 'Please enter your passcode';
            return;
        }

        // Default passcode for demo - in production, this would be hashed/encrypted
        const correctPasscode = localStorage.getItem('financeosPasscode') || '123456';
        
        if (passcode === correctPasscode) {
            this.onAuthSuccess();
        } else {
            errorDiv.textContent = 'Incorrect passcode. Try again.';
            passcodeInput.value = '';
            passcodeInput.focus();
            
            // Add shake animation
            passcodeInput.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                passcodeInput.style.animation = '';
            }, 500);
        }
    }

    onAuthSuccess() {
        this.isAuthenticated = true;
        this.lastActivity = Date.now();
        
        // Store auth timestamp
        localStorage.setItem('financeosAuthTime', Date.now().toString());
        
        // Hide modal
        this.hideAuthModal();
        
        // Show success message briefly
        this.showAuthSuccess();
        
        console.log('Authentication successful');
    }

    showAuthSuccess() {
        const successHTML = `
            <div id="authSuccess" class="auth-success">
                <div class="auth-success-content">
                    <span class="success-icon">✅</span>
                    <span>Welcome back!</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', successHTML);

        // Add success styles
        const successStyles = `
            <style>
                .auth-success {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
                    z-index: 10001;
                    animation: slideInRight 0.3s ease-out;
                }

                .auth-success-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', successStyles);

        // Remove after 3 seconds
        setTimeout(() => {
            const successEl = document.getElementById('authSuccess');
            if (successEl) {
                successEl.remove();
            }
        }, 3000);
    }

    checkAuthStatus() {
        const authTime = localStorage.getItem('financeosAuthTime');
        const now = Date.now();
        
        // Check if authenticated recently (within timeout period)
        if (authTime && (now - parseInt(authTime)) < this.authTimeout) {
            this.isAuthenticated = true;
            this.lastActivity = now;
            this.hideAuthModal();
        } else {
            this.isAuthenticated = false;
            this.showAuthModal();
        }
    }

    showAuthModal() {
        if (this.authModal) {
            this.authModal.style.display = 'flex';
            
            // Focus on passcode input after modal animation
            setTimeout(() => {
                const passcodeInput = document.getElementById('passcode');
                if (passcodeInput) {
                    passcodeInput.focus();
                }
            }, 300);
        }
    }

    hideAuthModal() {
        if (this.authModal) {
            this.authModal.style.display = 'none';
        }
    }

    setupActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isAuthenticated) {
                    this.lastActivity = Date.now();
                    localStorage.setItem('financeosAuthTime', Date.now().toString());
                }
            }, true);
        });

        // Check for inactivity every minute
        setInterval(() => {
            if (this.isAuthenticated && (Date.now() - this.lastActivity) > this.authTimeout) {
                this.logout();
            }
        }, 60000);
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('financeosAuthTime');
        
        // Show logout notification
        this.showLogoutNotification();
        
        // Show auth modal after brief delay
        setTimeout(() => {
            this.showAuthModal();
        }, 1000);
        
        console.log('User logged out');
    }

    showLogoutNotification() {
        const logoutHTML = `
            <div id="logoutNotification" class="logout-notification">
                <div class="logout-content">
                    <span class="logout-icon">🔒</span>
                    <span>Session expired. Please sign in again.</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', logoutHTML);

        // Add logout styles
        const logoutStyles = `
            <style>
                .logout-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
                    z-index: 10001;
                    animation: slideInRight 0.3s ease-out;
                }

                .logout-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', logoutStyles);

        // Remove after 3 seconds
        setTimeout(() => {
            const logoutEl = document.getElementById('logoutNotification');
            if (logoutEl) {
                logoutEl.remove();
            }
        }, 3000);
    }

    // Method to manually trigger logout
    manualLogout() {
        this.logout();
    }

    // Method to check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Method to set custom passcode
    setPasscode(newPasscode) {
        if (newPasscode && newPasscode.length >= 4) {
            localStorage.setItem('financeosPasscode', newPasscode);
            return true;
        }
        return false;
    }

    // Method to register biometric authentication
    async registerBiometric() {
        if (!this.biometricSupported) {
            throw new Error('Biometric authentication not supported');
        }

        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: "FinanceOS" },
                    user: {
                        id: new TextEncoder().encode("financeos-user"),
                        name: "FinanceOS User",
                        displayName: "FinanceOS User"
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" },
                        { alg: -257, type: "public-key" }
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        requireResidentKey: false
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            if (credential) {
                localStorage.setItem('financeoseBiometricRegistered', 'true');
                return true;
            }
            return false;

        } catch (error) {
            console.error('Biometric registration failed:', error);
            throw error;
        }
    }
}

// Create global auth instance
window.FinanceOSAuth = new FinanceOSAuth();

// Add logout button functionality globally
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
                    window.FinanceOSAuth.manualLogout();
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

// Add shake animation for failed attempts
const shakeStyles = `
    <style>
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    </style>
`;
document.head.insertAdjacentHTML('beforeend', shakeStyles);

console.log('FinanceOS Enhanced Authentication System loaded');