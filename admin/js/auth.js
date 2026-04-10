const API_BASE_URL = 'http://localhost:5000/api';

// Admin Login with Employee ID
async function loginAdmin(event) {
    event.preventDefault();
    
    const formData = {
        employeeId: document.getElementById('employeeId').value.trim(),
        password: document.getElementById('password').value
    };

    // Basic validation
    if (!formData.employeeId || !formData.password) {
        showAlert('Please enter employee ID and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and admin data
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('admin', JSON.stringify(data.user));
            
            showAlert('Admin login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Check if admin is logged in
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    const admin = JSON.parse(localStorage.getItem('admin'));
    
    if (!token || !admin || admin.role !== 'admin') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Admin Logout
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        window.location.href = 'login.html';
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
    window.location.pathname.includes('users') ||
    window.location.pathname.includes('teams') ||
    window.location.pathname.includes('supervisors') ||
    window.location.pathname.includes('defenses') ||
    window.location.pathname.includes('documents') ||
    window.location.pathname.includes('announcements') ||
    window.location.pathname.includes('reports') ||
    window.location.pathname.includes('settings')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!checkAdminAuth()) return;
        
        // Load admin info in navigation
        const admin = JSON.parse(localStorage.getItem('admin'));
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement && admin) {
            userInfoElement.innerHTML = `
                <span style="margin-right: 1rem;">
                    <strong>${admin.name}</strong><br>
                    <small>ID: ${admin.employeeId}</small>
                </span>
                <button onclick="logoutAdmin()" class="btn btn-outline">Logout</button>
            `;
        }
    });
}

// Add event listener for login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginAdmin);
    }
    
    // Auto-focus on employee ID field
    const employeeIdField = document.getElementById('employeeId');
    if (employeeIdField) {
        employeeIdField.focus();
    }
});