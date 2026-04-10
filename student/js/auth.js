const API_BASE_URL = 'http://localhost:5000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Student Registration
async function registerStudent(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        studentId: document.getElementById('studentId').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        department: document.getElementById('department').value,
        semester: document.getElementById('semester').value,
        cgpa: parseFloat(document.getElementById('cgpa').value),
        completedCredits: parseInt(document.getElementById('completedCredits').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register/student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            showAlert('Registration successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showAlert(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Student Login
async function loginStudent(event) {
    event.preventDefault();
    
    const formData = {
        studentId: document.getElementById('studentId').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Save team info if exists
            if (data.teamInfo) {
                localStorage.setItem('teamInfo', JSON.stringify(data.teamInfo));
            }
            
            // Show success message
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add new alert
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Initialize auth check on protected pages
if (window.location.pathname.includes('dashboard') || 
    window.location.pathname.includes('team') ||
    window.location.pathname.includes('supervisor') ||
    window.location.pathname.includes('annex') ||
    window.location.pathname.includes('document') ||
    window.location.pathname.includes('chat') ||
    window.location.pathname.includes('defense') ||
    window.location.pathname.includes('results')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!checkAuth()) return;
        
        // Load user info in navigation
        const user = JSON.parse(localStorage.getItem('user'));
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement && user) {
            userInfoElement.innerHTML = `
                <span>Welcome, ${user.name}</span>
                <button onclick="logout()" class="btn btn-outline">Logout</button>
            `;
        }
    });
}

// Add event listeners if forms exist
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', registerStudent);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginStudent);
    }
});