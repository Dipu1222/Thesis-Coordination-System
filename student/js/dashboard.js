let dashboardData = null;

async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/student/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        dashboardData = data;
        
        updateDashboardUI(data);
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
}

function updateDashboardUI(data) {
    // Update student info
    document.getElementById('studentName').textContent = data.student.name;
    document.getElementById('studentId').textContent = data.student.studentId;
    document.getElementById('department').textContent = data.student.department;
    document.getElementById('semester').textContent = data.student.semester;
    document.getElementById('cgpa').textContent = data.student.cgpa;

    // Update team status
    if (data.team) {
        document.getElementById('teamStatus').innerHTML = `
            <h3>Team: ${data.team.teamName}</h3>
            <p><strong>Status:</strong> <span class="status-badge status-${data.team.status}">${data.team.status}</span></p>
            <p><strong>Members:</strong> ${data.team.members.map(m => m.name).join(', ')}</p>
            ${data.supervisor ? `<p><strong>Supervisor:</strong> ${data.supervisor.name}</p>` : ''}
        `;
        
        // Show team actions
        document.getElementById('teamActions').innerHTML = `
            ${!data.team.supervisorId ? 
                '<a href="supervisor-selection.html" class="btn btn-primary">Select Supervisor</a>' : ''}
            ${data.team.supervisorStatus === 'accepted' && !data.annex ? 
                '<a href="annex-form.html" class="btn btn-primary">Submit Annex Form</a>' : ''}
        `;
    } else {
        document.getElementById('teamStatus').innerHTML = `
            <p>You are not in a team yet.</p>
            <a href="team-formation.html" class="btn btn-primary">Form Team</a>
        `;
    }

    // Update notifications
    if (data.notifications && data.notifications.length > 0) {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = data.notifications.map(notif => `
            <div class="notification-item ${!notif.read ? 'unread' : ''}">
                <p>${notif.message}</p>
                <small>${new Date(notif.date).toLocaleDateString()}</small>
            </div>
        `).join('');
    }

    // Update documents
    if (data.documents && data.documents.length > 0) {
        const documentsList = document.getElementById('documentsList');
        documentsList.innerHTML = data.documents.map(doc => `
            <tr>
                <td>${doc.documentType}</td>
                <td>${doc.fileName}</td>
                <td><span class="status-badge status-${doc.status}">${doc.status}</span></td>
                <td>${new Date(doc.submissionDate).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    // Update defenses
    if (data.defenses && data.defenses.length > 0) {
        const defensesList = document.getElementById('defensesList');
        defensesList.innerHTML = data.defenses.map(def => `
            <tr>
                <td>${def.defenseType}</td>
                <td>${new Date(def.scheduledDate).toLocaleDateString()}</td>
                <td>${def.scheduledTime}</td>
                <td>${def.venue}</td>
                <td><span class="status-badge status-${def.status}">${def.status}</span></td>
            </tr>
        `).join('');
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', loadDashboard);