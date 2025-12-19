// ============================================
// PLN MONITORING - LOGIN FUNCTIONALITY
// Modern & Secure Authentication
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize login page
    initLoginPage();
});

/**
 * Initialize login page
 */
function initLoginPage() {
    // Check if already logged in
    checkExistingSession();
    
    // Setup form handler
    setupFormHandlers();
    
    // Auto-focus username field
    document.getElementById('username').focus();
    
    // Check for remembered credentials
    checkRememberedCredentials();
    
    // Setup help links
    setupHelpLinks();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Setup toggle password visibility
    setupPasswordToggle();
    
    // Add input animations
    setupInputAnimations();
}

/**
 * Check if user already has valid session
 */
function checkExistingSession() {
    // Check sessionStorage first
    let sessionData = sessionStorage.getItem('plnSession');
    
    // If not in sessionStorage, check localStorage
    if (!sessionData) {
        sessionData = localStorage.getItem('plnSession');
    }

    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            
            // Check if session is still valid
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const timeDiff = now - loginTime;
            const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
            
            if (timeDiff < SESSION_TIMEOUT && session.isLoggedIn) {
                // Session is valid, redirect
                showNotification('Sesi masih aktif, mengalihkan...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                return;
            } else {
                // Session expired, clear it
                clearSession();
                showNotification('Sesi Anda telah berakhir, silakan login kembali', 'warning');
            }
        } catch (e) {
            // Invalid session data, clear it
            clearSession();
        }
    }
}

/**
 * Check for remembered credentials
 */
function checkRememberedCredentials() {
    const rememberedData = localStorage.getItem('plnRemembered');
    if (rememberedData) {
        try {
            const remembered = JSON.parse(rememberedData);
            const usernameInput = document.getElementById('username');
            const rememberCheckbox = document.getElementById('rememberMe');
            
            if (usernameInput && remembered.username) {
                usernameInput.value = remembered.username;
                rememberCheckbox.checked = true;
            }
        } catch (e) {
            localStorage.removeItem('plnRemembered');
        }
    }
}

/**
 * Setup form handlers
 */
function setupFormHandlers() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate input
    if (!username || !password) {
        showNotification('Silakan masukkan username dan password', 'error');
        shakeContainer();
        return;
    }

    // Validate username length
    if (username.length < 3) {
        showNotification('Username harus minimal 3 karakter', 'error');
        shakeContainer();
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showNotification('Password harus minimal 6 karakter', 'error');
        shakeContainer();
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        // Simulate authentication delay (network request)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Authenticate user
        const authenticatedUser = authenticateUser(username, password);
        
        if (authenticatedUser) {
            // Create session
            createSession(authenticatedUser.username, authenticatedUser.role, rememberMe);
            
            // Show success message
            showNotification(`Selamat datang, ${authenticatedUser.username}! Mengalihkan ke dashboard...`, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Authentication failed
            showNotification('Username atau password salah! Silakan coba lagi.', 'error');
            shakeContainer();
            
            // Reset loading state
            setLoadingState(false);
            
            // Clear password field
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    } catch (error) {
        showNotification('Terjadi kesalahan sistem: ' + error.message, 'error');
        setLoadingState(false);
    }
}

/**
 * Authenticate user credentials
 */
function authenticateUser(username, password) {
    // Valid users configuration
    const VALID_USERS = {
        admin: { 
            username: "admin", 
            password: "admin123", 
            role: "admin",
            fullName: "Administrator"
        },
        operator: { 
            username: "operator", 
            password: "pln2023", 
            role: "operator",
            fullName: "Operator"
        }
    };
    
    // Case-insensitive username check
    const normalizedUsername = username.toLowerCase();
    
    // Validate credentials
    for (const [role, userConfig] of Object.entries(VALID_USERS)) {
        if (normalizedUsername === userConfig.username.toLowerCase() && 
            password === userConfig.password) {
            return { 
                ...userConfig, 
                role,
                username: userConfig.username // Return original case
            };
        }
    }
    
    return null;
}

/**
 * Create user session
 */
function createSession(username, role, rememberMe) {
    const sessionData = {
        isLoggedIn: true,
        username: username,
        role: role,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe,
        sessionId: generateSessionId()
    };

    // Store in sessionStorage (always)
    sessionStorage.setItem('plnSession', JSON.stringify(sessionData));

    // Store in localStorage if remember me is checked
    if (rememberMe) {
        localStorage.setItem('plnSession', JSON.stringify(sessionData));
        
        // Store username for next time
        localStorage.setItem('plnRemembered', JSON.stringify({
            username: username
        }));
    } else {
        // Clear localStorage if remember me is not checked
        localStorage.removeItem('plnSession');
        localStorage.removeItem('plnRemembered');
    }
}

/**
 * Clear session data
 */
function clearSession() {
    sessionStorage.removeItem('plnSession');
    localStorage.removeItem('plnSession');
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Set loading state for login button
 */
function setLoadingState(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const btnContent = document.getElementById('btnContent');
    const btnSpinner = document.getElementById('btnSpinner');
    
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

/**
 * Shake container animation for errors
 */
function shakeContainer() {
    const container = document.querySelector('.login-container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}

/**
 * Setup help links
 */
function setupHelpLinks() {
    // Forgot password link
    const forgotLink = document.querySelector('a[href="#forgot"]');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Silakan hubungi administrator sistem untuk reset password.\n\nEmail: admin@pln-monitoring.id\nTelepon: +62 21 550 1234', 'info', 6000);
        });
    }
    
    // Contact admin link
    const contactLink = document.querySelector('a[href="#contact"]');
    if (contactLink) {
        contactLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Hubungi IT Support:\n\nTelepon: +62 21 550 1234\nEmail: support@pln-monitoring.id\nJam Kerja: Senin-Jumat, 08:00-17:00 WIB', 'info', 6000);
        });
    }
    
    // Help link
    const helpLink = document.querySelector('a[href="#help"]');
    if (helpLink) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Panduan Login:\n\n1. Masukkan username dan password\n2. Centang "Ingat saya" untuk login otomatis\n3. Klik tombol "Masuk"\n\nGunakan kredensial demo yang tersedia di halaman login.', 'info', 7000);
        });
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            usernameInput.value = '';
            passwordInput.value = '';
            usernameInput.focus();
            
            showNotification('Form telah dikosongkan', 'info');
        }
    });
}

/**
 * Setup password toggle visibility
 */
function setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
}

/**
 * Setup input animations
 */
function setupInputAnimations() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        // Add focus animation
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        // Remove focus animation
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Add value check for styling
        input.addEventListener('input', function() {
            if (this.value) {
                this.parentElement.classList.add('has-value');
            } else {
                this.parentElement.classList.remove('has-value');
            }
        });
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info', duration = 4000) {
    // Check if utils.showNotification exists (from main.js)
    if (typeof utils !== 'undefined' && utils.showNotification) {
        utils.showNotification(message, type);
        return;
    }
    
    // Fallback notification system
    const container = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid ${getNotificationColor(type)};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <i class="fas ${getNotificationIcon(type)}" style="color: ${getNotificationColor(type)}; font-size: 1.2rem; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <p style="margin: 0; color: #1a1a1a; font-size: 0.95rem; white-space: pre-line;">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; padding: 0; font-size: 1.2rem;">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Create notification container
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        z-index: 10000;
        pointer-events: none;
    `;
    container.innerHTML = `
        <style>
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            .notification { pointer-events: all; }
        </style>
    `;
    document.body.appendChild(container);
    return container;
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        success: '#00A651',
        error: '#E31E24',
        warning: '#FFD700',
        info: '#0066CC'
    };
    return colors[type] || colors.info;
}

// ============================================
// EXPORT FOR MODULE USE (Optional)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        authenticateUser,
        createSession,
        clearSession,
        showNotification
    };
}