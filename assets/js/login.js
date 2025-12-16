// assets/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    checkExistingSession();
    
    // Setup form handler
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');

    // Auto-focus username field
    document.getElementById('username').focus();

    // Check for remembered credentials
    checkRememberedCredentials();

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup help links
    setupHelpLinks();
});

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
                window.location.href = 'index.html';
                return;
            } else {
                // Session expired, clear it
                sessionStorage.removeItem('plnSession');
                localStorage.removeItem('plnSession');
            }
        } catch (e) {
            // Invalid session data, clear it
            sessionStorage.removeItem('plnSession');
            localStorage.removeItem('plnSession');
        }
    }
}

function checkRememberedCredentials() {
    const rememberedData = localStorage.getItem('plnRemembered');
    if (rememberedData) {
        try {
            const remembered = JSON.parse(rememberedData);
            document.getElementById('username').value = remembered.username || '';
            document.getElementById('rememberMe').checked = true;
        } catch (e) {
            localStorage.removeItem('plnRemembered');
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate input
    if (!username || !password) {
        utils.showNotification('Silakan masukkan username dan password', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Authenticate user
        const authenticatedUser = authenticateUser(username, password);
        
        if (authenticatedUser) {
            // Create session
            createSession(authenticatedUser.username, authenticatedUser.role, rememberMe);
            
            // Show success message
            utils.showNotification('Login berhasil! Mengalihkan...', 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            // Error - show message
            utils.showNotification('Username atau password salah!', 'error');
            
            // Shake animation for form
            const container = document.querySelector('.login-container');
            container.classList.add('shake');
            setTimeout(() => {
                container.classList.remove('shake');
            }, 500);
            
            // Reset loading state
            setLoadingState(false);
            
            // Clear password field
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    } catch (error) {
        utils.showNotification('Terjadi kesalahan: ' + error.message, 'error');
        setLoadingState(false);
    }
}

function authenticateUser(username, password) {
    // Valid users configuration
    const VALID_USERS = {
        admin: { username: "admin", password: "admin123", role: "admin" },
        operator: { username: "operator", password: "pln2023", role: "operator" }
    };
    
    // Validate credentials
    for (const [role, userConfig] of Object.entries(VALID_USERS)) {
        if (username === userConfig.username && password === userConfig.password) {
            return { ...userConfig, role };
        }
    }
    
    return null;
}

function createSession(username, role, rememberMe) {
    const sessionData = {
        isLoggedIn: true,
        username: username,
        role: role,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
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

function setLoadingState(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    
    if (loading) {
        loginBtn.classList.add('loading');
        btnText.textContent = 'Memverifikasi...';
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        btnText.textContent = 'Masuk';
        loginBtn.disabled = false;
    }
}

function setupHelpLinks() {
    // Add click handlers for help links
    document.querySelectorAll('.help-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            
            if (href === '#forgot') {
                utils.showNotification('Silakan hubungi administrator sistem untuk reset password. Email: admin@pln-monitoring.id', 'warning');
            } else if (href === '#contact') {
                utils.showNotification('Hubungi IT Support: +62 21 550 1234 atau email: support@pln-monitoring.id', 'info');
            }
        });
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('username').focus();
    }
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);