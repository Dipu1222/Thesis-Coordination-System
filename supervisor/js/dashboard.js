let dashboardData = null;

async function loadDashboard() {
    try {
        const token = localStorage.getItem('supervisor_token');
        const supervisor = JSON.parse(localStorage.getItem('supervisor'));
        
        if (!token || !supervisor) {
            window.location.href = 'login.html';
            return;
        }

        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/supervisor/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logoutSupervisor();
            return;
        }

        const data = await response.json();
        dashboardData = data;
        
        updateDashboardUI(data);
        hideLoading();
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Failed to load dashboard data', 'error');
        hideLoading();
    }
}

function updateDashboardUI(data) {
    // Update supervisor info
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

    setText('supervisorName', `Dr. ${data.supervisor.name}`);
    setText('facultyId', data.supervisor.facultyId || '');
    setText('department', data.supervisor.department || '');
    setText('designation', data.supervisor.designation || '');

    // Availability: update both badge and button span used in markup
    setText('availability', data.supervisor.availability ? 'Available' : 'Unavailable');
    setText('availabilityStatus', data.supervisor.availability ? 'Available' : 'Unavailable');
    const availabilityEl = document.getElementById('availability');
    if (availabilityEl) availabilityEl.className = data.supervisor.availability ? 'badge badge-success' : 'badge badge-danger';

    // Welcome info fields
    setText('maxTeams', data.supervisor.maxTeams ? `${data.supervisor.maxTeams} teams` : '0 teams');
    setText('currentTeamsCount', data.supervisor.currentTeams ? `${data.supervisor.currentTeams} teams` : '0 teams');
    const availableSlots = (data.supervisor.maxTeams || 0) - (data.supervisor.currentTeams || 0);
    setText('availableSlots', `${availableSlots} slots`);
    
    // Update stats
    document.getElementById('totalTeams').textContent = data.stats.totalTeams;
    document.getElementById('pendingRequests').textContent = data.stats.pendingRequests;
    document.getElementById('pendingAnnexes').textContent = data.stats.pendingAnnexes;
    document.getElementById('pendingDocuments').textContent = data.stats.pendingDocuments;
    document.getElementById('upcomingDefenses').textContent = data.stats.upcomingDefenses;
    
    // Update teams list
    updateTeamsList(data.teams);
    
    // Update pending requests
    updatePendingRequests(data.pendingRequests);
    
    // Update pending annexes
    updatePendingAnnexes(data.pendingAnnexes);
    
    // Update upcoming defenses
    updateUpcomingDefenses(data.upcomingDefenses);
    
    // Update recent meetings
    updateRecentMeetings(data.recentMeetings);
    
    // Update notifications
    updateNotifications(data.notifications);
}

function updateTeamsList(teams) {
    const container = document.getElementById('teamsList');
    
    if (!teams || teams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No teams assigned yet</p>
                <p class="text-muted">You will see your assigned teams here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = teams.map(team => `
        <div class="team-card">
            <div class="team-header">
                <div>
                    <h4 class="team-title">${team.teamName}</h4>
                    <span class="badge badge-${getStatusColor(team.status)}">${team.status}</span>
                </div>
                <a href="progress-monitoring.html?team=${team._id}" class="btn btn-sm btn-outline">View Details</a>
            </div>
            
            <div class="team-members">
                ${team.members.map(member => `
                    <span class="member-badge ${member._id === team.teamLeader._id ? 'leader-badge' : ''}">
                        ${member.name} (${member.studentId})
                    </span>
                `).join('')}
            </div>
            
            <div class="mt-2">
                <small class="text-muted">
                    Project: ${team.projectTitle || 'Not assigned yet'}
                </small>
            </div>
        </div>
    `).join('');
}

function updatePendingRequests(requests) {
    const container = document.getElementById('pendingRequestsList') || document.getElementById('recentRequests');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="text-muted">No pending requests</p>';
        return;
    }

    container.innerHTML = requests.slice(0, 5).map(request => `
        <div class="request-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>Team: ${request.teamId.teamName || 'Unnamed Team'}</strong>
                <div>
                    <button onclick="respondToRequest('${request._id}', 'accept')" class="btn btn-sm btn-success">Accept</button>
                    <button onclick="showRejectModal('${request._id}')" class="btn btn-sm btn-danger">Reject</button>
                </div>
            </div>
            <p class="mb-1">
                <small>Members: ${request.teamId.members.map(m => m.name).join(', ')}</small>
            </p>
            <p class="mb-0">
                <small>CGPA Range: ${Math.min(...request.teamId.members.map(m => m.cgpa)).toFixed(2)} - ${Math.max(...request.teamId.members.map(m => m.cgpa)).toFixed(2)}</small>
            </p>
        </div>
    `).join('');
    
    if (requests.length > 5) {
        container.innerHTML += `
            <div class="text-center mt-2">
                <a href="team-requests.html" class="btn btn-sm btn-outline">
                    View all ${requests.length} requests
                </a>
            </div>
        `;
    }
}

function updatePendingAnnexes(annexes) {
    const container = document.getElementById('pendingAnnexesList') || document.getElementById('pendingReviews');
    
    if (!annexes || annexes.length === 0) {
        container.innerHTML = '<p class="text-muted">No annexes pending review</p>';
        return;
    }

    container.innerHTML = annexes.slice(0, 5).map(annex => `
        <div class="request-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>${annex.projectTitle || 'Untitled Project'}</strong>
                <a href="annex-review.html?id=${annex._id}" class="btn btn-sm btn-primary">Review</a>
            </div>
            <p class="mb-1">
                <small>Team: ${annex.teamId.teamName}</small>
            </p>
            <p class="mb-0">
                <small>Submitted: ${new Date(annex.submittedAt).toLocaleDateString()}</small>
            </p>
        </div>
    `).join('');
}

function updateUpcomingDefenses(defenses) {
    const container = document.getElementById('upcomingDefensesList');
    
    if (!defenses || defenses.length === 0) {
        container.innerHTML = '<p class="text-muted">No upcoming defenses</p>';
        return;
    }

    container.innerHTML = defenses.slice(0, 5).map(defense => `
        <div class="request-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>${defense.defenseType} - ${defense.teamId.teamName}</strong>
                <span class="badge badge-info">${defense.scheduledDate ? new Date(defense.scheduledDate).toLocaleDateString() : 'TBD'}</span>
            </div>
            <p class="mb-1">
                <small>Time: ${defense.scheduledTime}</small>
            </p>
            <p class="mb-0">
                <small>Venue: ${defense.venue}</small>
            </p>
        </div>
    `).join('');
}

function updateRecentMeetings(meetings) {
    const container = document.getElementById('recentMeetingsList');
    
    if (!meetings || meetings.length === 0) {
        container.innerHTML = '<p class="text-muted">No upcoming meetings</p>';
        return;
    }

    container.innerHTML = meetings.slice(0, 5).map(meeting => `
        <div class="request-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>${meeting.title}</strong>
                <span class="badge badge-primary">${new Date(meeting.meetingDate).toLocaleDateString()}</span>
            </div>
            <p class="mb-1">
                <small>Team: ${meeting.teamId.teamName}</small>
            </p>
            <p class="mb-0">
                <small>Time: ${meeting.startTime} - ${meeting.endTime}</small>
            </p>
        </div>
    `).join('');
}

function updateNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<p class="text-muted">No notifications</p>';
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${!notification.read ? 'unread' : ''}">
            <p>${notification.message}</p>
            <small>${new Date(notification.date).toLocaleTimeString()}</small>
        </div>
    `).join('');
}

function getStatusColor(status) {
    switch(status) {
        case 'formed': return 'primary';
        case 'supervisor_assigned': return 'info';
        case 'project_started': return 'warning';
        case 'completed': return 'success';
        default: return 'secondary';
    }
}

async function toggleAvailability() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/toggle-availability`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Availability ${data.availability ? 'enabled' : 'disabled'} successfully`, 'success');
            // Update local storage
            const supervisor = JSON.parse(localStorage.getItem('supervisor'));
            supervisor.availability = data.availability;
            localStorage.setItem('supervisor', JSON.stringify(supervisor));
            
            // Update UI
            document.getElementById('availability').textContent = data.availability ? 'Available' : 'Unavailable';
            document.getElementById('availability').className = data.availability ? 'badge badge-success' : 'badge badge-danger';
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Toggle availability error:', error);
        showAlert('Failed to toggle availability', 'error');
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', loadDashboard);