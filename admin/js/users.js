let allUsers = [];
let selectedUser = null;

async function loadUsers() {
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        allUsers = data;
        displayUsers(data);
    } catch (error) {
        console.error('Load users error:', error);
        showAlert('Failed to load users', 'error');
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    let filteredUsers = allUsers;
    
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.studentId && user.studentId.toLowerCase().includes(searchTerm))
        );
    }
    
    if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }
    
    if (departmentFilter) {
        filteredUsers = filteredUsers.filter(user => user.department === departmentFilter);
    }
    
    displayUsers(filteredUsers);
}

function displayUsers(users) {
    const container = document.getElementById('usersTable');
    
    if (users.length === 0) {
        container.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
        return;
    }

    container.innerHTML = users.map(user => `
        <tr>
            <td>
                <strong>${user.name}</strong>
                ${user.role === 'admin' ? ' 👑' : ''}
            </td>
            <td>
                ${user.email}<br>
                ${user.studentId ? `<small>ID: ${user.studentId}</small>` : ''}
            </td>
            <td>
                <span class="badge badge-info">${user.role}</span>
            </td>
            <td>${user.department || '-'}</td>
            <td>
                <span class="status-indicator ${user.isActive !== false ? 'status-active' : 'status-inactive'}"></span>
                ${user.isActive !== false ? 'Active' : 'Inactive'}
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button onclick="editUser('${user._id}')" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                    Edit
                </button>
                <button onclick="deleteUser('${user._id}')" class="btn btn-danger" style="padding: 0.3rem 0.5rem;">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function toggleUserFields() {
    const role = document.getElementById('userRole').value;
    
    document.getElementById('studentFields').style.display = role === 'student' ? 'block' : 'none';
    document.getElementById('supervisorFields').style.display = role === 'supervisor' ? 'block' : 'none';
}

async function addNewUser() {
    const role = document.getElementById('userRole').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const department = document.getElementById('userDepartment').value;
    
    if (!role || !name || !email || !password) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    const userData = {
        name,
        email,
        password,
        role,
        department
    };
    
    if (role === 'student') {
        userData.studentId = document.getElementById('studentId').value;
        userData.cgpa = document.getElementById('studentCgpa').value;
        userData.semester = '8';
    }
    
    if (role === 'supervisor') {
        userData.designation = document.getElementById('supervisorDesignation').value;
        userData.researchAreas = document.getElementById('researchAreas').value;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('User added successfully!', 'success');
            closeModal();
            loadUsers();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showAlert('Failed to add user', 'error');
    }
}

function editUser(userId) {
    selectedUser = allUsers.find(u => u._id === userId);
    if (!selectedUser) return;
    
    document.getElementById('editName').value = selectedUser.name;
    document.getElementById('editEmail').value = selectedUser.email;
    document.getElementById('editRole').value = selectedUser.role;
    document.getElementById('editDepartment').value = selectedUser.department || '';
    document.getElementById('editStatus').value = selectedUser.isActive !== false ? 'active' : 'inactive';
    
    document.getElementById('editUserModal').style.display = 'block';
}

async function saveUserChanges() {
    if (!selectedUser) return;
    
    const updates = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        department: document.getElementById('editDepartment').value,
        isActive: document.getElementById('editStatus').value === 'active'
    };
    
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('User updated successfully!', 'success');
            closeModal();
            loadUsers();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Update user error:', error);
        showAlert('Failed to update user', 'error');
    }
}

function showResetPasswordModal() {
    if (!selectedUser) return;
    
    document.getElementById('resetUserInfo').textContent = 
        `Reset password for: ${selectedUser.name} (${selectedUser.email})`;
    
    document.getElementById('editUserModal').style.display = 'none';
    document.getElementById('resetPasswordModal').style.display = 'block';
}

async function resetUserPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        showAlert('Please fill all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Password reset successfully!', 'success');
            closeModal();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showAlert('Failed to reset password', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    // In a real app, you would have a DELETE endpoint
    // For now, show coming soon
    showComingSoon();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    selectedUser = null;
}

function showComingSoon() {
    alert('This feature is coming soon!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadUsers);