document.addEventListener('DOMContentLoaded', () => {
    // Initial check for authentication on page load
    checkAuthentication();

    // Event listeners for activity to reset session
    document.addEventListener('mousemove', resetActivityTimer);
    document.addEventListener('keydown', resetActivityTimer);
    document.addEventListener('click', resetActivityTimer);
    document.addEventListener('scroll', resetActivityTimer);
    document.addEventListener('touchstart', resetActivityTimer);

    // Listen for when the window gains focus
    window.addEventListener('focus', handleWindowFocus);

    // Set up event listeners for PIN inputs
    setupPinInputListeners();
});

// --- Session Management (Banking App Style) ---
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
let lastActivityTime = Date.now();

function resetActivityTimer() {
    lastActivityTime = Date.now();
    // console.log('Activity detected, timer reset.'); // For debugging
    localStorage.setItem('lastActivityTime', Date.now()); // Store activity time
}

function isSessionTimedOut() {
    const storedLastActivityTime = localStorage.getItem('lastActivityTime');
    if (storedLastActivityTime) {
        return (Date.now() - parseInt(storedLastActivityTime, 10)) > INACTIVITY_TIMEOUT_MS;
    }
    return true; // If no activity time is stored, assume timed out or never logged in
}

function handleWindowFocus() {
    // console.log('Window gained focus, checking session...'); // For debugging
    if (isAuthenticated()) {
        if (isSessionTimedOut()) {
            console.warn('Session timed out due to inactivity.');
            logout(true); // Pass true to indicate session expiry for alert
        } else {
            console.log('Session still active.');
            resetActivityTimer(); // Reset on successful check
        }
    } else {
        // If not authenticated (e.g., after a logout), ensure login overlay is shown
        showLoginOverlay();
    }
}

// --- Authentication Functions ---
function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

function setAuthenticated(status) {
    localStorage.setItem('isAuthenticated', status);
    if (status) {
        localStorage.setItem('lastActivityTime', Date.now()); // Record login time as activity
        resetActivityTimer(); 
    } else {
        localStorage.removeItem('lastActivityTime');
    }
}

function checkAuthentication() {
    const loginOverlay = document.getElementById('loginOverlay');
    const mainApp = document.getElementById('mainApp');

    if (isAuthenticated()) {
        if (isSessionTimedOut()) {
            console.warn('Session timed out on load due to inactivity.');
            setAuthenticated(false); // Clear authentication
            loginOverlay.style.display = 'flex';
            mainApp.style.display = 'none';
            alert('Your session has expired due to inactivity. Please log in again.');
        } else {
            loginOverlay.style.display = 'none';
            mainApp.style.display = 'block';
            resetActivityTimer(); // Reset on successful check
        }
    } else {
        loginOverlay.style.display = 'flex';
        mainApp.style.display = 'none';
    }
}

function login() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');

    loginButton.disabled = true;
    loginButtonText.innerHTML = '<span class="loading-spinner"></span> Logging in...';

    // Simulate API call
    setTimeout(() => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username === 'demo' && password === 'demo123') {
            setAuthenticated(true);
            checkAuthentication();
            alert('Login successful!');
        } else {
            alert('Invalid username or password.');
            setAuthenticated(false);
        }
        loginButton.disabled = false;
        loginButtonText.textContent = 'Login';
    }, 1500);
}

function logout(sessionExpired = false) {
    setAuthenticated(false);
    checkAuthentication();
    if (!sessionExpired) {
        alert('You have been logged out.');
    }
    // Redirect to index.html if not already there, to ensure login overlay appears
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = 'index.html';
    }
}

// --- PIN Login Functions ---
function setupPinInputListeners() {
    const pinInputs = document.querySelectorAll('.pin-digit');
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', () => movePinFocus(index + 1));
        input.addEventListener('keydown', (event) => handlePinBackspace(event, index + 1));
    });
}

function showPinLogin() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('pinForm').style.display = 'block';
    // Clear PIN fields and focus first one
    const pinInputs = document.querySelectorAll('.pin-digit');
    pinInputs.forEach(input => input.value = '');
    document.getElementById('pin1').focus();
}

function movePinFocus(currentPinIndex) {
    const currentInput = document.getElementById(`pin${currentPinIndex}`);
    if (currentInput.value.length === currentInput.maxLength) {
        const nextPinIndex = currentPinIndex + 1;
        if (nextPinIndex <= 4) {
            document.getElementById(`pin${nextPinIndex}`).focus();
        } else {
            // All PIN digits entered, optionally trigger login
            // Consider adding a slight delay or a "Login" button click for better UX
            // loginWithPin(); 
        }
    }
}

function handlePinBackspace(event, currentPinIndex) {
    if (event.key === 'Backspace' && event.target.value === '') {
        const prevPinIndex = currentPinIndex - 1;
        if (prevPinIndex >= 1) {
            document.getElementById(`pin${prevPinIndex}`).focus();
        }
    }
}

function loginWithPin() {
    const pin1 = document.getElementById('pin1').value;
    const pin2 = document.getElementById('pin2').value;
    const pin3 = document.getElementById('pin3').value;
    const pin4 = document.getElementById('pin4').value;
    const enteredPin = `${pin1}${pin2}${pin3}${pin4}`;

    if (enteredPin.length === 4 && enteredPin === '1234') { // Example PIN
        setAuthenticated(true);
        checkAuthentication();
        alert('PIN Login successful!');
    } else {
        alert('Invalid PIN. Please try again.');
        setAuthenticated(false);
        // Clear PIN fields
        document.getElementById('pin1').value = '';
        document.getElementById('pin2').value = '';
        document.getElementById('pin3').value = '';
        document.getElementById('pin4').value = '';
        document.getElementById('pin1').focus();
    }
}

// --- Biometric Login Functions ---
function showBiometricLogin() {
    if ('credentials' in navigator && 'get' in navigator.credentials) {
        // Check if platform authenticator is available (e.g., Face ID, Touch ID)
        // Note: For a real application, you'd integrate with WebAuthn and a backend server.
        // This is a simplified client-side check.
        navigator.credentials.get({
            publicKey: {
                challenge: Uint8Array.from('random_challenge_string', c => c.charCodeAt(0)),
                rpId: window.location.hostname, // Replace with your actual domain
                userVerification: 'preferred',
                timeout: 60000,
                allowCredentials: [] // Empty to trigger registration/discovery
            }
        })
        .then(credential => {
            if (credential) {
                // In a real app, send credential to server for verification
                alert('Biometric login successful! (Demo)');
                setAuthenticated(true);
                checkAuthentication();
            } else {
                alert('Biometric login failed: No credential found or user cancelled.');
            }
        })
        .catch(error => {
            console.error('Biometric login error:', error);
            if (error.name === 'NotAllowedError') {
                alert('Biometric authentication not allowed. Please grant permission or use password/PIN.');
            } else if (error.name === 'AbortError') {
                alert('Biometric login cancelled by user.');
            } else if (error.name === 'SecurityError') {
                alert('Biometric authentication not supported in this context (e.g., HTTP vs HTTPS).');
            } else if (error.name === 'InvalidStateError') {
                alert('Biometric setup required or not supported by your device.');
            }
            else {
                alert('Biometric login failed: ' + error.message);
            }
        });
    } else {
        alert('Biometric login not supported on this device or browser.');
    }
}

// --- Password Reset Functions ---
function showPasswordReset() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('pinForm').style.display = 'none';
    document.getElementById('resetForm').style.display = 'block';
    document.getElementById('resetEmail').focus();
}

function sendPasswordReset() {
    const resetEmail = document.getElementById('resetEmail').value;
    if (resetEmail) {
        alert(`Password reset link sent to ${resetEmail}! (Demo)`);
        showLoginForm();
    } else {
        alert('Please enter your email address.');
    }
}

// --- UI Navigation Functions ---
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('pinForm').style.display = 'none';
    document.getElementById('resetForm').style.display = 'none';
    document.getElementById('loginUsername').focus();
}

function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleButton = document.querySelector('.password-toggle');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

function showLoginOverlay() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    showLoginForm(); // Always show the main login form when re-displaying overlay
}

// --- CSV Upload Related Functions (Placeholder for future development) ---
// This function will be called from csv-upload.html
function handleCsvUpload(event) {
    const fileInput = event.target;
    const files = fileInput.files;

    if (files.length > 0) {
        const file = files[0];
        console.log(`Selected file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            alert(`File "${file.name}" selected for upload. (Processing not yet implemented)`);
            // Here you would typically read the file and process its content
            // Example: const reader = new FileReader();
            // reader.onload = (e) => {
            //     const csvContent = e.target.result;
            //     console.log('CSV Content:', csvContent);
            //     // Further parsing and data management
            // };
            // reader.readAsText(file);
        } else {
            alert('Please select a valid CSV file.');
            fileInput.value = ''; // Clear the input
        }
    } else {
        console.log('No file selected.');
    }
}
