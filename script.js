// ============================================
// SafeGuard - Authentication & App Logic
// ============================================

// Check if user is logged in
function checkAuth() {
    const currentUser = localStorage.getItem('safeguard_current_user');
    const dashboardPage = document.getElementById('home');
    
    // If on dashboard page and not logged in, redirect to login
    if (dashboardPage && !currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    
    // If on login/register page and logged in, redirect to dashboard
    if (!dashboardPage && currentUser) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            window.location.href = 'dashboard.html';
        }
    }
    
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) return;
    
    // Load user data if on dashboard
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        const currentUser = JSON.parse(localStorage.getItem('safeguard_current_user'));
        if (currentUser) {
            userNameEl.textContent = currentUser.name || 'User';
        }
    }
    
    // Initialize dashboard if on dashboard
    if (document.getElementById('home')) {
        initDashboard();
    }
    
    // Setup form listeners
    setupFormListeners();
});

// ============================================
// Authentication Functions
// ============================================

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling.nextElementSibling;
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate mobile number (10 digits)
function validateMobile(mobile) {
    const re = /^\d{10}$/;
    return re.test(mobile);
}

// Show error message
function showError(elementId, show = true) {
    const errorEl = document.getElementById(elementId);
    const inputEl = document.getElementById(elementId.replace('Error', ''));
    if (errorEl) {
        errorEl.classList.toggle('show', show);
    }
    if (inputEl && show) {
        inputEl.classList.add('input-error');
    } else if (inputEl) {
        inputEl.classList.remove('input-error');
    }
}

// Simple hash function for password (not secure for production, demo only)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// Register new user
function registerUser(userData) {
    let users = JSON.parse(localStorage.getItem('safeguard_users') || '[]');
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email || u.mobile === userData.mobile);
    if (existingUser) {
        return { success: false, message: 'User already exists with this email or mobile number' };
    }
    
    // Hash password
    const hashedPassword = simpleHash(userData.password);
    
    const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        password: hashedPassword,
        gender: userData.gender || '',
        location: userData.location || '',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('safeguard_users', JSON.stringify(users));
    
    return { success: true, message: 'Registration successful!' };
}

// Verify user credentials
function verifyUser(emailOrMobile, password) {
    const users = JSON.parse(localStorage.getItem('safeguard_users') || '[]');
    const hashedPassword = simpleHash(password);
    
    const user = users.find(u => 
        (u.email === emailOrMobile || u.mobile === emailOrMobile) && 
        u.password === hashedPassword
    );
    
    if (user) {
        return { success: true, user: user };
    }
    
    return { success: false, message: 'Invalid email/mobile or password' };
}

// Login user
function loginUser(emailOrMobile, password, remember = false) {
    const result = verifyUser(emailOrMobile, password);
    
    if (result.success) {
        localStorage.setItem('safeguard_current_user', JSON.stringify(result.user));
        return { success: true };
    }
    
    return result;
}

// Logout user
function logout() {
    localStorage.removeItem('safeguard_current_user');
    window.location.href = 'index.html';
}

// ============================================
// Form Event Listeners
// ============================================

function setupFormListeners() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const remember = document.getElementById('rememberMe')?.checked || false;
            
            // Validate
            let valid = true;
            
            if (!email) {
                showError('loginEmailError', true);
                valid = false;
            } else if (!validateEmail(email) && !validateMobile(email)) {
                showError('loginEmailError', true);
                valid = false;
            } else {
                showError('loginEmailError', false);
            }
            
            if (!password) {
                showError('loginPasswordError', true);
                valid = false;
            } else {
                showError('loginPasswordError', false);
            }
            
            if (!valid) return;
            
            // Attempt login
            const result = loginUser(email, password, remember);
            
            if (result.success) {
                showNotification('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showNotification(result.message, 'error');
            }
        });
    }
    
    // Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const mobile = document.getElementById('regMobile').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const gender = document.getElementById('regGender')?.value || '';
            const location = document.getElementById('regLocation')?.value.trim() || '';
            
            // Validate
            let valid = true;
            
            if (!name) {
                showError('regNameError', true);
                valid = false;
            } else {
                showError('regNameError', false);
            }
            
            if (!email || !validateEmail(email)) {
                showError('regEmailError', true);
                valid = false;
            } else {
                showError('regEmailError', false);
            }
            
            if (!mobile || !validateMobile(mobile)) {
                showError('regMobileError', true);
                valid = false;
            } else {
                showError('regMobileError', false);
            }
            
            if (!password || password.length < 6) {
                showError('regPasswordError', true);
                valid = false;
            } else {
                showError('regPasswordError', false);
            }
            
            if (password !== confirmPassword) {
                showError('regConfirmPasswordError', true);
                valid = false;
            } else {
                showError('regConfirmPasswordError', false);
            }
            
            if (!valid) return;
            
            // Register user
            const result = registerUser({
                name, email, mobile, password, gender, location
            });
            
            if (result.success) {
                showNotification(result.message, 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showNotification(result.message, 'error');
            }
        });
    }
    
    // Input event listeners to clear errors
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const errorId = this.id + 'Error';
            showError(errorId, false);
        });
    });
}

// ============================================
// Optional Features
// ============================================

function loginWithGoogle() {
    showNotification('Google login coming soon!', 'info');
}

function showLoginOTP() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('loginOTPForm').classList.add('active');
    document.getElementById('forgotPasswordForm').classList.remove('active');
}

function showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('loginOTPForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').classList.remove('active');
}

function showForgotPassword() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').classList.add('active');
}

function sendLoginOTP() {
    const mobile = document.getElementById('otpMobile').value.trim();
    
    if (!mobile || !validateMobile(mobile)) {
        showError('otpMobileError', true);
        return;
    }
    
    showError('otpMobileError', false);
    
    // Simulate OTP sending
    showNotification('OTP sent to ' + mobile, 'success');
    
    // Start timer
    let seconds = 60;
    const timerEl = document.getElementById('otpTimer');
    const timerCount = document.getElementById('timerCount');
    const resendBtn = document.getElementById('resendBtn');
    
    timerEl.classList.remove('hidden');
    resendBtn.disabled = true;
    
    const interval = setInterval(() => {
        seconds--;
        timerCount.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(interval);
            resendBtn.disabled = false;
        }
    }, 1000);
}

function resendLoginOTP() {
    sendLoginOTP();
}

function verifyLoginOTP() {
    const otp = document.getElementById('loginOtp').value.trim();
    
    if (!otp || otp.length !== 6) {
        showError('loginOtpError', true);
        return;
    }
    
    // Simulate OTP verification
    showNotification('OTP verified!', 'success');
    setTimeout(() => {
        // Create session for OTP login
        const tempUser = {
            id: Date.now(),
            name: 'OTP User',
            mobile: document.getElementById('otpMobile').value.trim()
        };
        localStorage.setItem('safeguard_current_user', JSON.stringify(tempUser));
        window.location.href = 'dashboard.html';
    }, 1000);
}

function resetPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!email) {
        showNotification('Please enter your email or mobile', 'error');
        return;
    }
    
    showNotification('Password reset link sent to ' + email, 'success');
    setTimeout(() => {
        showLoginForm();
    }, 2000);
}

// ============================================
// Dashboard Functions
// ============================================

// Initialize dashboard
function initDashboard() {
    renderContacts();
    renderFamilyContacts();
    renderTips();
    setupNavigation();
    
    // Get user name
    const currentUser = JSON.parse(localStorage.getItem('safeguard_current_user'));
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name || 'User';
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.getAttribute('data-page');
            
            // Update nav
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show page
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(page).classList.add('active');
            
            // Update title
            pageTitle.textContent = this.textContent.trim();
            
            // Close sidebar on mobile
            document.getElementById('sidebar').classList.remove('active');
        });
    });
}

// Show page function (accessible globally)
window.showPage = function(pageId) {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
    
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    
    document.getElementById('pageTitle').textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
};

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Emergency contacts data
const defaultContacts = [
    { id: 1, name: 'Police', number: '100', category: 'police' },
    { id: 2, name: 'Fire', number: '101', category: 'fire' },
    { id: 3, name: 'Ambulance', number: '102', category: 'medical' },
    { id: 4, name: 'Women Helpline', number: '1091', category: 'police' }
];

let familyContacts = JSON.parse(localStorage.getItem('safeguard_family_contacts') || '[]');

// Render emergency contacts
function renderContacts() {
    const list = document.getElementById('contactsList');
    if (!list) return;
    
    list.innerHTML = defaultContacts.map(c => `
        <div class="contact-card">
            <div class="contact-info">
                <h3>${c.name}</h3>
                <p>${c.number}</p>
            </div>
            <button class="call-btn" onclick="callContact('${c.number}')">
                <i class="fas fa-phone"></i> Call
            </button>
        </div>
    `).join('');
}

// Render family contacts
function renderFamilyContacts() {
    const list = document.getElementById('familyContactsList');
    if (!list) return;
    
    if (familyContacts.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#7F8C8D;padding:20px;">No family contacts yet</p>';
        return;
    }
    
    list.innerHTML = familyContacts.map(c => `
        <div class="contact-card">
            <div class="contact-info">
                <h3>${c.name}</h3>
                <p>${c.number} (${c.relation})</p>
            </div>
            <button class="call-btn" onclick="callContact('${c.number}')">
                <i class="fas fa-phone"></i>
            </button>
        </div>
    `).join('');
}

// Call contact
function callContact(num) {
    if (!num) {
        showToast('Invalid phone number', 'error');
        return;
    }
    window.location.href = 'tel:' + num;
}

// Show add family modal
function showAddFamilyModal() {
    const name = prompt('Enter name:');
    if (!name) return;
    
    const number = prompt('Enter phone number:');
    if (!number) return;
    
    const relation = prompt('Relation:') || 'Family';
    
    const newContact = {
        id: Date.now(),
        name: name,
        number: number,
        relation: relation
    };
    
    familyContacts.push(newContact);
    localStorage.setItem('safeguard_family_contacts', JSON.stringify(familyContacts));
    renderFamilyContacts();
    showToast('Contact added!', 'success');
}

// SOS Functions
function triggerSOS() {
    document.getElementById('sosModal').classList.add('active');
}

function closeSOSModal() {
    document.getElementById('sosModal').classList.remove('active');
}

function confirmSOS() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
                
                const emergencyMsg = `SOS EMERGENCY! I need help!\n\nLocation: ${locationLink}\n\nPlease help me!`;
                
                // Call 100
                window.location.href = `sms:100?body=${encodeURIComponent(emergencyMsg)}`;
                
                // Send to family
                if (familyContacts.length > 0) {
                    setTimeout(() => {
                        const familyMsg = `SOS ALERT! I need help!\n\nLocation: ${locationLink}\n\nPlease contact me!`;
                        window.location.href = `sms:${familyContacts[0].number}?body=${encodeURIComponent(familyMsg)}`;
                    }, 1500);
                }
                
                closeSOSModal();
                showToast('SOS Alert Sent!', 'success');
            },
            (error) => {
                const emergencyMsg = 'SOS EMERGENCY! I need help! Please call 100!';
                window.location.href = `sms:100?body=${encodeURIComponent(emergencyMsg)}`;
                closeSOSModal();
                showToast('SOS sent (no location)!', 'success');
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
    }
}

// Share location
function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://maps.google.com/?q=${latitude},${longitude}`;
                navigator.clipboard.writeText(url);
                showToast('Location copied!', 'success');
            },
            () => {
                showToast('Could not get location', 'error');
            }
        );
    }
}

// Send family alert
function sendFamilyAlert() {
    if (familyContacts.length === 0) {
        showToast('No family contacts! Add one first.', 'error');
        return;
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const msg = `I am safe!\nLocation: https://maps.google.com/?q=${latitude},${longitude}`;
                window.location.href = `sms:${familyContacts[0].number}?body=${encodeURIComponent(msg)}`;
                showToast('Family alert sent!', 'success');
            },
            () => {
                const msg = 'I am safe!';
                window.location.href = `sms:${familyContacts[0].number}?body=${encodeURIComponent(msg)}`;
                showToast('Family alert sent!', 'success');
            }
        );
    }
}

// Safety tips data
const safetyTips = [
    { title: 'Stay Alert', content: 'Always be aware of your surroundings, especially in unfamiliar areas.' },
    { title: 'Emergency Numbers', content: 'Police: 100, Fire: 101, Ambulance: 102, Women Helpline: 1091' },
    { title: 'Trust Your Instincts', content: 'If something feels wrong, remove yourself from the situation immediately.' },
    { title: 'Share Your Location', content: 'Let family know your whereabouts when traveling alone.' },
    { title: 'Emergency SOS', content: 'Use the SOS button to send your location to emergency services.' }
];

function renderTips() {
    const list = document.getElementById('tipsList');
    if (!list) return;
    
    list.innerHTML = safetyTips.map(tip => `
        <div class="tip-card">
            <h3>${tip.title}</h3>
            <p>${tip.content}</p>
        </div>
    `).join('');
}

// Submit report
function submitReport(e) {
    e.preventDefault();
    
    const type = document.getElementById('incidentType').value;
    const desc = document.getElementById('incidentDesc').value;
    const location = document.getElementById('incidentLocation').value;
    
    if (!type || !desc) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    showToast('Report submitted successfully!', 'success');
    document.getElementById('reportForm').reset();
}

// Locate me
function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showToast('Location found!', 'success');
            },
            () => {
                showToast('Could not get location', 'error');
            }
        );
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Change language (placeholder)
function changeLanguage(lang) {
    showToast('Language changed to ' + lang, 'success');
    document.getElementById('langSelect').value = lang;
    document.getElementById('settingsLang').value = lang;
}

// Show notification (alternative name)
function showNotification(message, type) {
    showToast(message, type);
}
