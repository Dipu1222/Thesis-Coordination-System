// This is a JavaScript file for handling team requests
// It includes functions to load, accept, and reject requests

let allRequests = [];
let currentRequestId = null;

async function loadTeamRequests() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/team-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        allRequests = data;
        
        updateStats(data);
        filterRequests('all');
    } catch (error) {
        console.error('Load team requests error:', error);
        showAlert('Failed to load team requests', 'error');
    }
}

function updateStats(requests) {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('acceptedRequests').textContent = accepted;
    document.getElementById('rejectedRequests').textContent = rejected;
}

function filterRequests(status, el) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (el && el.classList) el.classList.add('active');
    
    // Filter requests
    let filteredRequests = allRequests;
    if (status !== 'all') {
        filteredRequests = allRequests.filter(r => r.status === status);
    }
    
    // Display requests
    displayRequests(filteredRequests);
}

function displayRequests(requests) {
    const container = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No team requests found</p>
                <p class="text-muted">Try selecting a different filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const team = request.teamId;
        const members = team?.members || [];
        const leader = team?.teamLeader;
        
        // Calculate team stats
        const cgpas = members.map(m => m.cgpa).filter(c => c);
        const avgCGPA = cgpas.length > 0 ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : 'N/A';
        const minCGPA = cgpas.length > 0 ? Math.min(...cgpas).toFixed(2) : 'N/A';
        const maxCGPA = cgpas.length > 0 ? Math.max(...cgpas).toFixed(2) : 'N/A';
        
        return `
            <div class="request-card">
                <div class="request-header">
                    <div>
                        <div class="request-team-name">${team?.teamName || 'Unnamed Team'}</div>
                        <div class="request-date">
                            Requested: ${new Date(request.requestedAt).toLocaleDateString()}
                            ${request.respondedAt ? `• Responded: ${new Date(request.respondedAt).toLocaleDateString()}` : ''}
                        </div>
                    </div>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
                
                <div class="team-stats">
                    <div class="stat-item">
                        <div class="stat-value">${members.length}</div>
                        <div class="stat-label">Members</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${avgCGPA}</div>
                        <div class="stat-label">Avg CGPA</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${minCGPA}</div>
                        <div class="stat-label">Min CGPA</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${maxCGPA}</div>
                        <div class="stat-label">Max CGPA</div>
                    </div>
                </div>
                
                <div>
                    <strong>Team Members:</strong>
                    <div class="member-list">
                        ${members.map(member => `
                            <div class="member-item ${member._id === leader?._id ? 'leader' : ''}">
                                ${member.name} (${member.studentId})
                                ${member._id === leader?._id ? '👑' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${request.rejectionReason ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                        <strong>Rejection Reason:</strong>
                        <p>${request.rejectionReason}</p>
                    </div>
                ` : ''}
                
                ${request.status === 'pending' ? `
                    <div class="action-buttons">
                        <button onclick="acceptRequest('${request._id}')" class="btn btn-success">
                            Accept Request
                        </button>
                        <button onclick="showRejectModal('${request._id}')" class="btn btn-danger">
                            Reject Request
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function acceptRequest(requestId) {
    if (!confirm('Accept this team request? This will assign you as their supervisor.')) return;
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/team-requests/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requestId: requestId,
                action: 'accept'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Team request accepted successfully!', 'success');
            loadTeamRequests();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Accept request error:', error);
        showAlert('Failed to accept request', 'error');
    }
}

function showRejectModal(requestId) {
    currentRequestId = requestId;
    document.getElementById('rejectModal').style.display = 'block';
}

function closeRejectModal() {
    currentRequestId = null;
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectModal').style.display = 'none';
}

async function submitRejection() {
    const reason = document.getElementById('rejectionReason').value.trim();
    
    if (!reason) {
        showAlert('Please provide a reason for rejection', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/team-requests/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requestId: currentRequestId,
                action: 'reject',
                rejectionReason: reason
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Team request rejected successfully!', 'success');
            closeRejectModal();
            loadTeamRequests();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Reject request error:', error);
        showAlert('Failed to reject request', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadTeamRequests);