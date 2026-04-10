const API_BASE_URL = 'http://localhost:5000/api';

// Check if supervisor is logged in
function checkSupervisorAuth() {
    const token = localStorage.getItem('supervisor_token');
    const supervisor = JSON.parse(localStorage.getItem('supervisor'));
    
    if (!token || !supervisor) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Supervisor Registration
async function registerSupervisor(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        facultyId: document.getElementById('facultyId').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        department: document.getElementById('department').value,
        designation: document.getElementById('designation').value,
        researchAreas: document.getElementById('researchAreas').value.split(',').map(area => area.trim())
    };

    try {
        const response = await fetch(`${API_BASE_URL}/supervisor/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and supervisor data
            localStorage.setItem('supervisor_token', data.token);
            localStorage.setItem('supervisor', JSON.stringify(data.supervisor));
            
            showAlert('Registration successful! Redirecting to dashboard...', 'success');
            
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

// Supervisor Login
async function loginSupervisor(event) {
    event.preventDefault();
    
    const formData = {
        facultyId: document.getElementById('facultyId').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/supervisor/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and supervisor data
            localStorage.setItem('supervisor_token', data.token);
            localStorage.setItem('supervisor', JSON.stringify(data.supervisor));
            
            // Save teams and requests if exists
            if (data.teams) {
                localStorage.setItem('supervisor_teams', JSON.stringify(data.teams));
            }
            if (data.pendingRequests) {
                localStorage.setItem('pending_requests', JSON.stringify(data.pendingRequests));
            }
            
            showAlert('Login successful! Redirecting...', 'success');
            
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

// Supervisor Logout
function logoutSupervisor() {
    localStorage.removeItem('supervisor_token');
    localStorage.removeItem('supervisor');
    localStorage.removeItem('supervisor_teams');
    localStorage.removeItem('pending_requests');
    window.location.href = 'login.html';
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
if (window.location.pathname.includes('supervisor/')) {
    const protectedPages = [
        'dashboard',
        'team-requests',
        'annex-review',
        'progress-monitoring',
        'report-review',
        'defense-evaluation',
        'chat',
        'availability'
    ];
    
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (protectedPages.includes(currentPage)) {
        document.addEventListener('DOMContentLoaded', () => {
            if (!checkSupervisorAuth()) return;
            
            // Load supervisor info in navigation
            const supervisor = JSON.parse(localStorage.getItem('supervisor'));
            const userInfoElement = document.querySelector('.user-info');
            if (userInfoElement && supervisor) {
                userInfoElement.innerHTML = `
                    <span>Dr. ${supervisor.name}</span>
                    <button onclick="logoutSupervisor()" class="btn btn-outline">Logout</button>
                `;
            }
        });
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', registerSupervisor);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginSupervisor);
    }
});