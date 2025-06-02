/**
 * FinanceOS Robust Authentication System
 * Properly debugged with timeout handling and graceful fallbacks
 */

class RobustFinanceOSAuth {
    constructor() {
        this.isAuthenticated = false;
        this.authTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastActivity = Date.now();
        this.biometricSupported = false;
        this.biometricTimeout = 10000; // 10 second timeout for biometric
        this.authModal = null;
        this.debugMode = true; // Enable detailed logging
        
        this.log('Starting FinanceOS Authentication System...');
        this.init();
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[FinanceOS Auth] ${message}`, data || '');
        }
    }

    async init() {
        try {
            this.log('Initializing authentication system');
            
            // Check biometric support with timeout
            this.biometricSupported = await this.checkBiometricSupportSafely();
            this.log('Biometric support check completed', this.biometricSupported);
            
            // Create auth modal
            await this.createAuthModal();
            this.log('Auth modal created');
            
            // Check auth status after small delay to ensure DOM is ready
            setTimeout(() => {
                this.checkAuthStatus();
                this.setupActivityMonitoring();
                this.setupVisibilityHandling();
            }, 100);
            
            this.log('Authentication system initialized successfully');
            
        } catch (error) {
            this.log('Error during init', error);
            // Fallback to simple passcode-only auth
            this.biometricSupported = false;
            this.createAuthModal();
            setTimeout(() => this.checkAuthStatus(), 100);
        }
    }

    async checkBiometricSupportSafely() {
        return new Promise((resolve) => {
            // Set timeout to prevent hanging
            const timeout = setTimeout(() => {
                this.log('Biometric check timed out, falling back to passcode only');
                resolve(false);
            }, 3000);

            try {
                if (!('PublicKeyCredential' in window)) {
                    this.log('PublicKeyCredential not available');
                    clearTimeout(timeout);
                    resolve(false);
                    return;
                }

                PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                    .then((available) => {
                        clearTimeout(timeout);
                        this.log('Biometric availability result', available);
                        resolve(available);
                    })
                    .catch((error) => {
                        clearTimeout(timeout);
                        this.log('Biometric check failed', error);
                        resolve(false);
                    });

            } catch (error) {
                clearTimeout(timeout);
                this.log('Biometric check exception', error);
                resolve(false);
            }
        });
    }

    createAuthModal() {
        this.log('Creating authentication modal');
        
        // Remove any existing modal
        const existing = document.getElementById('robustAuthModal');
        if (existing) {
            this.log('Removing existing modal');
            existing.remove();
        }

        const modalHTML = `
            <div id="robustAuthModal" class="robust-auth-modal">
                <div class="robust-auth-content">
                    <div class="auth-header">
                        <div class="logo-section">
                            <div class="logo-icon">$</div>
                            <h1>FinanceOS</h1>
                        </div>
                        <h2>Secure Access Required</h2>
                        <p>Please authenticate to access your financial data</p>
                    </div>
                    
                    <div class="auth-methods">
                        ${this.biometricSupported ? `
                            <div class="biometric-section">
                                <button class="auth-method-btn biometric-btn" id="biometricBtn">
                                    <div class="method-icon">👆</div>
                                    <div class="method-text">
                                        <span class="method-title">Use Biometric</span>
                                        <span class="method-subtitle">Fingerprint or Face ID</span>
                                    </div>
                                </button>
                                <div class="biometric-status" id="biometricStatus"></div>
                            </div>
                            
                            <div class="auth-divider">
                                <span>or</span>
                            </div>
                        ` : ''}
                        
                        <div class="passcode-section">
                            <label for="authPasscode">Enter Passcode</label>
                            <div class="passcode-input-group">
                                <input 
                                    type="password" 
                                    id="authPasscode" 
                                    placeholder="6-digit passcode" 
                                    maxlength="6"
                                    pattern="[0-9]*"
                                    inputmode="numeric"
                                >
                                <button class="show-passcode-btn" id="showPasscodeBtn" type="button">👁️</button>
                            </div>
                            <button class="auth-method-btn passcode-btn" id="passcodeBtn">
                                <div class="method-icon">🔑</div>
                                <span>Sign In with Passcode</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="auth-error" id="authError"></div>
                    
                    <div class="auth-footer">
                        <p>Default passcode: 123456</p>
                        <button class="debug-btn" id="debugBtn">Debug Info</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.authModal = document.getElementById('robustAuthModal');
        
        this.addAuthStyles();
        this.setupAuthEventListeners();
        
        this.log('Auth modal created and styled');
    }

    addAuthStyles() {
        const existingStyles = document.getElementById('robustAuthStyles');
        if (existingStyles) existingStyles.remove();

        const styles = `
            <style id="robustAuthStyles">
                .robust-auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(15, 23, 42, 0.98);
                    backdrop-filter: blur(20px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: authFadeIn 0.4s ease-out;
                    padding: 1rem;
                }

                .robust-auth-content {
                    background: linear-gradient(135deg, 
                        rgba(139, 92, 246, 0.15) 0%, 
                        rgba(59, 130, 246, 0.15) 50%, 
                        rgba(147, 51, 234, 0.15) 100%);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    animation: authSlideUp 0.4s ease-out;
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .logo-icon {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
                }

                .auth-header h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0;
                }

                .auth-header h2 {
                    color: white;
                    font-size: 1.5rem;
                    margin: 1rem 0 0.5rem 0;
                    font-weight: 600;
                }

                .auth-header p {
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                    font-size: 1rem;
                }

                .auth-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .auth-method-btn {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem 1.5rem;
                    border: 2px solid rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                    font-weight: 600;
                    width: 100%;
                    backdrop-filter: blur(10px);
                }

                .auth-method-btn:hover {
                    border-color: rgba(139, 92, 246, 0.5);
                    background: rgba(139, 92, 246, 0.15);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
                }

                .auth-method-btn:active {
                    transform: translateY(0);
                }

                .auth-method-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .biometric-btn {
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
                }

                .method-icon {
                    font-size: 2rem;
                    min-width: 3rem;
                    text-align: center;
                }

                .method-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    flex: 1;
                }

                .method-title {
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .method-subtitle {
                    font-size: 0.9rem;
                    opacity: 0.7;
                    font-weight: 400;
                }

                .biometric-status {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    text-align: center;
                    min-height: 1.5rem;
                }

                .biometric-status.processing {
                    background: rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .biometric-status.error {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    margin: 0.5rem 0;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.9rem;
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
                }

                .passcode-section label {
                    display: block;
                    color: white;
                    font-weight: 500;
                    margin-bottom: 0.75rem;
                    font-size: 1rem;
                }

                .passcode-input-group {
                    position: relative;
                    margin-bottom: 1rem;
                }

                .passcode-input-group input {
                    width: 100%;
                    padding: 1rem 3rem 1rem 1rem;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 1.25rem;
                    text-align: center;
                    letter-spacing: 0.5rem;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .passcode-input-group input:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                    background: rgba(255, 255, 255, 0.15);
                }

                .passcode-input-group input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing: normal;
                    font-size: 1rem;
                }

                .show-passcode-btn {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: color 0.2s ease;
                }

                .show-passcode-btn:hover {
                    color: rgba(255, 255, 255, 0.9);
                }

                .auth-error {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    text-align: center;
                    min-height: 1rem;
                    display: none;
                }

                .auth-error.show {
                    display: block;
                    animation: authShake 0.5s ease-in-out;
                }

                .auth-footer {
                    margin-top: 1.5rem;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                }

                .auth-footer p {
                    margin: 0 0 0.5rem 0;
                }

                .debug-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.7);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                }

                .debug-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }

                @keyframes authFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes authSlideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(50px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes authShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                    20%, 40%, 60%, 80% { transform: translateX(8px); }
                }

                @keyframes authPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .processing .biometric-btn {
                    animation: authPulse 1.5s infinite;
                }

                /* Mobile optimizations */
                @media (max-width: 480px) {
                    .robust-auth-content {
                        padding: 2rem 1.5rem;
                        margin: 1rem;
                    }

                    .logo-section {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .auth-header h1 {
                        font-size: 1.75rem;
                    }

                    .auth-method-btn {
                        padding: 1rem;
                        gap: 0.75rem;
                    }

                    .method-icon {
                        font-size: 1.75rem;
                        min-width: 2.5rem;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupAuthEventListeners() {
        this.log('Setting up event listeners');
        
        const biometricBtn = document.getElementById('biometricBtn');
        const passcodeBtn = document.getElementById('passcodeBtn');
        const passcodeInput = document.getElementById('authPasscode');
        const showPasscodeBtn = document.getElementById('showPasscodeBtn');
        const debugBtn = document.getElementById('debugBtn');

        if (biometricBtn) {
            biometricBtn.addEventListener('click', () => this.handleBiometricAuth());
        }

        if (passcodeBtn) {
            passcodeBtn.addEventListener('click', () => this.handlePasscodeAuth());
        }

        if (passcodeInput) {
            passcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handlePasscodeAuth();
                }
            });

            passcodeInput.addEventListener('input', (e) => {
                // Only allow numbers
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        if (showPasscodeBtn) {
            showPasscodeBtn.addEventListener('click', () => {
                const input = document.getElementById('authPasscode');
                if (input.type === 'password') {
                    input.type = 'text';
                    showPasscodeBtn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    showPasscodeBtn.textContent = '👁️';
                }
            });
        }

        if (debugBtn) {
            debugBtn.addEventListener('click', () => this.showDebugInfo());
        }

        this.log('Event listeners set up successfully');
    }

    async handleBiometricAuth() {
        this.log('Starting biometric authentication');
        
        const biometricBtn = document.getElementById('biometricBtn');
        const biometricStatus = document.getElementById('biometricStatus');
        const errorDiv = document.getElementById('authError');

        if (!biometricBtn || !biometricStatus) {
            this.log('Biometric elements not found');
            return;
        }

        try {
            // Update UI to show processing
            biometricBtn.disabled = true;
            biometricBtn.innerHTML = `
                <div class="method-icon">⏳</div>
                <div class="method-text">
                    <span class="method-title">Authenticating...</span>
                    <span class="method-subtitle">Use your biometric sensor</span>
                </div>
            `;
            
            biometricStatus.className = 'biometric-status processing';
            biometricStatus.textContent = 'Please use your fingerprint or face ID...';
            errorDiv.classList.remove('show');

            this.log('Starting biometric credential request');

            // Create credential request with timeout
            const credentialPromise = navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: this.biometricTimeout,
                    userVerification: "required",
                    allowCredentials: []
                }
            });

            // Add our own timeout as backup
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Biometric authentication timed out')), this.biometricTimeout);
            });

            const result = await Promise.race([credentialPromise, timeoutPromise]);

            if (result) {
                this.log('Biometric authentication successful');
                this.onAuthSuccess('biometric');
            } else {
                throw new Error('No credential returned');
            }

        } catch (error) {
            this.log('Biometric authentication failed', error);
            
            biometricStatus.className = 'biometric-status error';
            biometricStatus.textContent = 'Biometric authentication failed. Please use passcode.';
            
            this.showError('Biometric authentication failed. Please try the passcode method.');
            
            // Reset biometric button
            biometricBtn.disabled = false;
            biometricBtn.innerHTML = `
                <div class="method-icon">👆</div>
                <div class="method-text">
                    <span class="method-title">Use Biometric</span>
                    <span class="method-subtitle">Fingerprint or Face ID</span>
                </div>
            `;

            // Focus on passcode input
            setTimeout(() => {
                const passcodeInput = document.getElementById('authPasscode');
                if (passcodeInput) passcodeInput.focus();
            }, 1000);
        }
    }

    handlePasscodeAuth() {
        this.log('Starting passcode authentication');
        
        const passcodeInput = document.getElementById('authPasscode');
        const passcodeBtn = document.getElementById('passcodeBtn');
        const errorDiv = document.getElementById('authError');

        if (!passcodeInput || !passcodeBtn) {
            this.log('Passcode elements not found');
            return;
        }

        const enteredPasscode = passcodeInput.value.trim();
        const storedPasscode = localStorage.getItem('financeosPasscode') || '123456';

        if (!enteredPasscode) {
            this.showError('Please enter your 6-digit passcode');
            passcodeInput.focus();
            return;
        }

        if (enteredPasscode.length < 4) {
            this.showError('Passcode must be at least 4 digits');
            passcodeInput.focus();
            return;
        }

        // Update button to show processing
        const originalText = passcodeBtn.innerHTML;
        passcodeBtn.disabled = true;
        passcodeBtn.innerHTML = `
            <div class="method-icon">⏳</div>
            <span>Verifying...</span>
        `;

        // Add small delay for UX
        setTimeout(() => {
            if (enteredPasscode === storedPasscode) {
                this.log('Passcode authentication successful');
                this.onAuthSuccess('passcode');
            } else {
                this.log('Passcode authentication failed');
                this.showError('Incorrect passcode. Please try again.');
                
                passcodeInput.value = '';
                passcodeInput.focus();
                passcodeInput.style.animation = 'authShake 0.5s ease-in-out';
                setTimeout(() => {
                    if (passcodeInput) passcodeInput.style.animation = '';
                }, 500);
                
                // Reset button
                passcodeBtn.disabled = false;
                passcodeBtn.innerHTML = originalText;
            }
        }, 800);
    }

    onAuthSuccess(method) {
        this.log('Authentication successful via', method);
        
        this.isAuthenticated = true;
        this.lastActivity = Date.now();
        localStorage.setItem('financeosAuthTime', Date.now().toString());
        localStorage.setItem('financeosAuthMethod', method);
        
        // Hide modal with animation
        this.hideAuthModal();
        
        // Show success notification
        this.showSuccessNotification(method);
        
        // Add logout button to navigation
        setTimeout(() => this.addLogoutButton(), 500);
    }

    hideAuthModal() {
        if (this.authModal) {
            this.authModal.style.animation = 'authFadeIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (this.authModal) {
                    this.authModal.remove();
                    this.authModal = null;
                }
            }, 300);
        }
    }

    showSuccessNotification(method) {
        const methodText = method === 'biometric' ? 'biometric authentication' : 'passcode';
        
        const notification = document.createElement('div');
        notification.id = 'authSuccessNotification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
                z-index: 10001;
                animation: slideInRight 0.4s ease-out;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 600;
                max-width: 300px;
            ">
                <span style="font-size: 1.5rem;">✅</span>
                <div>
                    <div>Welcome back!</div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">Authenticated via ${methodText}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        document.head.appendChild(style);

        // Remove after 4 seconds
        setTimeout(() => {
            if (notification) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
            style.remove();
        }, 4000);
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.remove('show');
            }, 5000);
        }
        this.log('Auth error:', message);
    }

    checkAuthStatus() {
        const authTime = localStorage.getItem('financeosAuthTime');
        const now = Date.now();
        
        this.log('Checking auth status', { authTime, now, timeout: this.authTimeout });
        
        if (authTime && (now - parseInt(authTime)) < this.authTimeout) {
            this.log('User is authenticated, hiding modal');
            this.isAuthenticated = true;
            this.lastActivity = now;
            this.hideAuthModal();
            this.addLogoutButton();
        } else {
            this.log('User needs to authenticate, showing modal');
            this.isAuthenticated = false;
            this.showAuthModal();
        }
    }

    showAuthModal() {
        if (this.authModal) {
            this.log('Showing auth modal');
            this.authModal.style.display = 'flex';
            
            // Focus on appropriate input after animation
            setTimeout(() => {
                if (this.biometricSupported) {
                    // Focus on first button for keyboard navigation
                    const biometricBtn = document.getElementById('biometricBtn');
                    if (biometricBtn) biometricBtn.focus();
                } else {
                    // Focus on passcode input
                    const passcodeInput = document.getElementById('authPasscode');
                    if (passcodeInput) passcodeInput.focus();
                }
            }, 400);
        }
    }

    setupActivityMonitoring() {
        this.log('Setting up activity monitoring');
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'touchend'];
        
        const updateActivity = () => {
            if (this.isAuthenticated) {
                this.lastActivity = Date.now();
                localStorage.setItem('financeosAuthTime', Date.now().toString());
            }
        };

        events.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Check for timeout every 30 seconds
        setInterval(() => {
            if (this.isAuthenticated && (Date.now() - this.lastActivity) > this.authTimeout) {
                this.log('Session timed out due to inactivity');
                this.logout();
            }
        }, 30000);
    }

    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.log('Page became visible, checking auth status');
                setTimeout(() => this.checkAuthStatus(), 100);
            }
        });
    }

    logout() {
        this.log('Logging out user');
        
        this.isAuthenticated = false;
        localStorage.removeItem('financeosAuthTime');
        localStorage.removeItem('financeosAuthMethod');
        
        this.showLogoutNotification();
        
        setTimeout(() => {
            this.createAuthModal();
            this.showAuthModal();
        }, 1500);
    }

    showLogoutNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
                z-index: 10001;
                animation: slideInRight 0.4s ease-out;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 600;
            ">
                <span style="font-size: 1.5rem;">🔒</span>
                <span>Session expired - Please sign in again</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 1500);
    }

    addLogoutButton() {
        const navElements = document.querySelectorAll('.nav');
        
        navElements.forEach(nav => {
            if (!nav.querySelector('.logout-btn')) {
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'nav-button logout-btn';
                logoutBtn.innerHTML = '🚪 Logout';
                logoutBtn.title = 'Logout securely';
                logoutBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to logout securely?')) {
                        this.logout();
                    }
                });
                
                nav.appendChild(logoutBtn);
                this.log('Logout button added to navigation');
            }
        });
    }

    showDebugInfo() {
        const debugInfo = {
            isAuthenticated: this.isAuthenticated,
            biometricSupported: this.biometricSupported,
            lastActivity: new Date(this.lastActivity).toLocaleString(),
            authTimeout: this.authTimeout / 1000 + ' seconds',
            userAgent: navigator.userAgent,
            storedAuthTime: localStorage.getItem('financeosAuthTime'),
            storedPasscode: localStorage.getItem('financeosPasscode') || 'default (123456)',
            publicKeyCredentialSupport: 'PublicKeyCredential' in window
        };

        console.group('FinanceOS Auth Debug Info');
        console.table(debugInfo);
        console.groupEnd();

        alert('Debug info logged to console. Check browser developer tools.');
    }

    // Public methods
    manualLogout() {
        this.logout();
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    setPasscode(newPasscode) {
        if (newPasscode && newPasscode.length >= 4) {
            localStorage.setItem('financeosPasscode', newPasscode);
            this.log('Passcode updated');
            return true;
        }
        this.log('Invalid passcode length');
        return false;
    }

    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            biometricSupported: this.biometricSupported,
            lastActivity: this.lastActivity,
            timeUntilTimeout: this.authTimeout - (Date.now() - this.lastActivity)
        };
    }
}

// Initialize the robust authentication system
window.FinanceOSAuth = new RobustFinanceOSAuth();

// Global helper functions
window.financeOSAuthHelpers = {
    logout: () => window.FinanceOSAuth.manualLogout(),
    getStatus: () => window.FinanceOSAuth.getAuthStatus(),
    setPasscode: (code) => window.FinanceOSAuth.setPasscode(code),
    debug: () => window.FinanceOSAuth.showDebugInfo()
};

console.log('FinanceOS Robust Authentication System loaded successfully');
console.log('Available methods: window.financeOSAuthHelpers');
console.log('Debug: window.FinanceOSAuth.showDebugInfo()');