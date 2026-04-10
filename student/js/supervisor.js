let supervisors = [];

async function loadSupervisors() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showAlert('Please login first', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/student/supervisors`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Supervisors loaded:', data);
        supervisors = data;
        displaySupervisors(data);
    } catch (error) {
        console.error('Load supervisors error:', error);
        showAlert('Failed to load supervisors: ' + error.message, 'error');
    }
}

function displaySupervisors(supervisorsList) {
    const container = document.getElementById('supervisorsContainer');
    
    if (!supervisorsList || supervisorsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👨‍🏫</div>
                <p>No supervisors available.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = supervisorsList.map(sup => {
        const isAvailable = sup.availability === true || sup.availability === 'true';
        const hasSlots = (sup.availableSlots || 0) > 0;
        const canRequest = isAvailable && hasSlots;
        
        return `
        <div class="supervisor-card">
            <div class="supervisor-header">
                <div>
                    <div class="supervisor-name">${sup.name || 'Unknown'}</div>
                    <div class="supervisor-title">${sup.designation || 'Faculty'}</div>
                    <span class="supervisor-status ${isAvailable ? 'status-available' : 'status-full'}">
                        ${isAvailable ? '✓ Available' : '✗ Unavailable'}
                    </span>
                </div>
            </div>
            <div class="supervisor-details">
                <div class="detail-item">
                    <span class="detail-label">Department:</span>
                    <span class="detail-value">${sup.department || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Teams:</span>
                    <span class="detail-value">${sup.currentTeams || 0}/${sup.maxTeams || 10}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Available Slots:</span>
                    <span class="detail-value">${sup.availableSlots || 0}</span>
                </div>
            </div>
            <div class="research-areas">
                <strong style="font-size: 0.9rem;">Research Areas:</strong>
                <div class="research-tags">
                    ${(sup.researchAreas && sup.researchAreas.length > 0) ? 
                        sup.researchAreas.map(area => `<span class="tag">${area}</span>`).join('') :
                        '<span class="tag">Not specified</span>'
                    }
                </div>
            </div>
            <div style="margin-top: 1rem;">
                ${canRequest ? 
                    `<button onclick="requestSupervisor('${sup._id}')" class="btn btn-primary" style="width: 100%;">
                        Request Supervisor
                    </button>` :
                    `<button class="btn btn-secondary" disabled style="width: 100%;">
                        ${!isAvailable ? 'Unavailable' : 'No Slots Available'}
                    </button>`
                }
            </div>
        </div>
    `;
    }).join('');
}

async function requestSupervisor(supervisorId) {
    if (!confirm('Send request to this supervisor?')) return;

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/supervisor/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ supervisorId })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Supervisor request sent successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Supervisor request error:', error);
        showAlert('Failed to send supervisor request', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadSupervisors);