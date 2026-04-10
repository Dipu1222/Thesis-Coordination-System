let teams = [];
let selectedTeamId = null;
let selectedTeamData = null;

async function loadTeams() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        teams = await response.json();
        displayTeams();
    } catch (error) {
        console.error('Load teams error:', error);
        showAlert('Failed to load teams', 'error');
    }
}

function displayTeams() {
    const container = document.getElementById('teamsList');
    
    if (teams.length === 0) {
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
        <div class="team-option" onclick="selectTeam('${team._id}')" id="team-${team._id}">
            <h4>${team.teamName}</h4>
            <p><strong>Project:</strong> ${team.projectTitle || 'Not assigned yet'}</p>
            <p><strong>Members:</strong> ${team.members.length} students</p>
            <p><strong>Status:</strong> <span class="badge badge-${getStatusColor(team.status)}">${team.status}</span></p>
        </div>
    `).join('');
}

async function selectTeam(teamId) {
    // Update selected team UI
    document.querySelectorAll('.team-option').forEach(option => {
        option.classList.remove('active');
    });
    document.getElementById(`team-${teamId}`).classList.add('active');
    
    selectedTeamId = teamId;
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/progress-report/${teamId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        selectedTeamData = await response.json();
        displayTeamProgress();
        
        // Show progress overview, hide empty state
        document.getElementById('progressOverview').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
    } catch (error) {
        console.error('Load team progress error:', error);
        showAlert('Failed to load team progress data', 'error');
    }
}

function displayTeamProgress() {
    if (!selectedTeamData) return;
    
    const team = selectedTeamData.team;
    const milestones = selectedTeamData.milestones?.list || [];
    const progressReports = selectedTeamData.progressReports || [];
    const meetings = selectedTeamData.meetings || [];
    
    // Update team info
    document.getElementById('teamName').textContent = team.teamName;
    
    // Calculate stats
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const activeMilestones = milestones.filter(m => m.status === 'in_progress').length;
    const overdueMilestones = milestones.filter(m => m.status === 'overdue').length;
    const totalMilestones = milestones.length;
    
    const progressPercentage = selectedTeamData.milestones?.stats?.completionRate || 0;
    const overallProgress = selectedTeamData.latestProgress?.overallProgress || 0;
    
    // Update stats
    document.getElementById('overallProgress').textContent = `${overallProgress}%`;
    document.getElementById('completedMilestones').textContent = completedMilestones;
    document.getElementById('activeMilestones').textContent = activeMilestones;
    document.getElementById('overdueMilestones').textContent = overdueMilestones;
    document.getElementById('progressPercentage').textContent = `${progressPercentage.toFixed(1)}%`;
    document.getElementById('progressBarFill').style.width = `${progressPercentage}%`;
    
    // Display milestones
    displayMilestones(milestones);
    
    // Display progress reports
    displayProgressReports(progressReports);
    
    // Display upcoming meetings
    displayUpcomingMeetings(meetings);
}

function displayMilestones(milestones) {
    const container = document.getElementById('milestonesList');
    
    if (milestones.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🎯</div>
                <p>No milestones set yet</p>
                <p class="text-muted">Add milestones to track team progress</p>
            </div>
        `;
        return;
    }

    container.innerHTML = milestones.map(milestone => {
        const dueDate = new Date(milestone.dueDate);
        const isOverdue = milestone.status === 'overdue' || (milestone.status === 'pending' && dueDate < new Date());
        
        return `
            <div class="milestone-card ${isOverdue ? 'overdue' : ''}">
                <div class="milestone-header">
                    <div class="milestone-title">${milestone.title}</div>
                    <span class="badge badge-${getMilestoneStatusColor(milestone.status)}">${milestone.status}</span>
                </div>
                
                <div class="milestone-date">
                    Due: ${dueDate.toLocaleDateString()}
                    ${milestone.completionDate ? `<br>Completed: ${new Date(milestone.completionDate).toLocaleDateString()}` : ''}
                </div>
                
                ${milestone.description ? `<p>${milestone.description}</p>` : ''}
                
                ${milestone.supervisorComments ? `
                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px;">
                        <small><strong>Comments:</strong> ${milestone.supervisorComments}</small>
                    </div>
                ` : ''}
                
                <div class="action-buttons" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    ${milestone.status !== 'completed' ? `
                        <button onclick="updateMilestoneStatus('${milestone._id}', 'completed')" class="btn btn-sm btn-success">
                            Mark Complete
                        </button>
                    ` : ''}
                    
                    ${milestone.status !== 'in_progress' && milestone.status !== 'completed' ? `
                        <button onclick="updateMilestoneStatus('${milestone._id}', 'in_progress')" class="btn btn-sm btn-primary">
                            Start Progress
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function displayProgressReports(reports) {
    const container = document.getElementById('progressReportsList');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No progress reports yet</p>
                <p class="text-muted">Add progress reports to track team performance</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <h4>Progress Report - ${new Date(report.reportDate).toLocaleDateString()}</h4>
                    <small>Overall Progress: ${report.overallProgress}%</small>
                </div>
                ${report.rating ? `
                    <div class="rating-display">
                        ${Array.from({length: 5}, (_, i) => 
                            `<span class="star ${i < report.rating ? 'filled' : 'empty'}">${i < report.rating ? '★' : '☆'}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="grid grid-2">
                <div>
                    <strong>Technical Progress:</strong> ${report.technicalProgress || 'N/A'}%
                </div>
                <div>
                    <strong>Documentation Progress:</strong> ${report.documentationProgress || 'N/A'}%
                </div>
            </div>
            
            ${report.strengths?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Strengths:</strong>
                    <ul class="strengths-list">
                        ${report.strengths.map(strength => `<li>${strength}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${report.weaknesses?.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Areas for Improvement:</strong>
                    <ul class="weaknesses-list">
                        ${report.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${report.recommendations ? `
                <div style="margin-top: 1rem;">
                    <strong>Recommendations:</strong>
                    <p>${report.recommendations}</p>
                </div>
            ` : ''}
            
            <div class="grid grid-2" style="margin-top: 1rem;">
                ${report.nextMilestone ? `
                    <div>
                        <strong>Next Milestone:</strong> ${report.nextMilestone}
                    </div>
                ` : ''}
                
                ${report.nextMeetingDate ? `
                    <div>
                        <strong>Next Meeting:</strong> ${new Date(report.nextMeetingDate).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function displayUpcomingMeetings(meetings) {
    const container = document.getElementById('upcomingMeetings');
    
    const upcoming = meetings.filter(m => 
        new Date(m.meetingDate) >= new Date() && m.status === 'scheduled'
    ).slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-muted">No upcoming meetings scheduled</p>';
        return;
    }

    container.innerHTML = upcoming.map(meeting => `
        <div class="meeting-schedule">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <strong>${meeting.title}</strong>
                    <div>${new Date(meeting.meetingDate).toLocaleDateString()} at ${meeting.startTime}</div>
                </div>
                <span class="badge badge-primary">${meeting.meetingType}</span>
            </div>
            
            ${meeting.description ? `<p style="margin-top: 0.5rem;">${meeting.description}</p>` : ''}
            
            ${meeting.agenda?.length > 0 ? `
                <div style="margin-top: 0.5rem;">
                    <strong>Agenda:</strong>
                    <ul style="margin: 0.25rem 0 0 1rem;">
                        ${meeting.agenda.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div style="margin-top: 1rem;">
                <button onclick="updateMeetingStatus('${meeting._id}', 'completed')" class="btn btn-sm btn-success">Mark Completed</button>
                <button onclick="updateMeetingStatus('${meeting._id}', 'cancelled')" class="btn btn-sm btn-danger">Cancel</button>
            </div>
        </div>
    `).join('');
}

function filterMilestones(filter) {
    const milestones = selectedTeamData.milestones?.list || [];
    let filtered = milestones;
    
    switch(filter) {
        case 'pending':
            filtered = milestones.filter(m => m.status === 'pending');
            break;
        case 'completed':
            filtered = milestones.filter(m => m.status === 'completed');
            break;
        case 'overdue':
            filtered = milestones.filter(m => m.status === 'overdue' || 
                (m.status === 'pending' && new Date(m.dueDate) < new Date()));
            break;
    }
    
    displayMilestones(filtered);
}

function openNewMilestoneModal() {
    document.getElementById('newMilestoneModal').style.display = 'block';
}

function closeNewMilestoneModal() {
    document.getElementById('milestoneForm').reset();
    document.getElementById('newMilestoneModal').style.display = 'none';
}

async function saveMilestone() {
    const title = document.getElementById('milestoneTitle').value.trim();
    const description = document.getElementById('milestoneDescription').value.trim();
    const dueDate = document.getElementById('milestoneDueDate').value;
    
    if (!title || !dueDate) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/milestones`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teamId: selectedTeamId,
                title,
                description,
                dueDate
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Milestone created successfully!', 'success');
            closeNewMilestoneModal();
            await selectTeam(selectedTeamId); // Reload data
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Save milestone error:', error);
        showAlert('Failed to create milestone', 'error');
    }
}

async function updateMilestoneStatus(milestoneId, status) {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/milestones/${milestoneId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Milestone marked as ${status}!`, 'success');
            await selectTeam(selectedTeamId); // Reload data
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Update milestone error:', error);
        showAlert('Failed to update milestone', 'error');
    }
}

function openNewReportModal() {
    document.getElementById('newReportModal').style.display = 'block';
}

function closeNewReportModal() {
    document.getElementById('progressReportForm').reset();
    resetRating();
    document.getElementById('newReportModal').style.display = 'none';
}

function setRating(rating) {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
        star.style.color = index < rating ? '#ffc107' : 'var(--border)';
    });
    document.getElementById('rating').value = rating;
}

function resetRating() {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach(star => {
        star.textContent = '☆';
        star.style.color = 'var(--border)';
    });
    document.getElementById('rating').value = 0;
}

async function saveProgressReport() {
    const overallProgress = parseInt(document.getElementById('overallProgressInput').value);
    const technicalProgress = parseInt(document.getElementById('technicalProgress').value) || 0;
    const documentationProgress = parseInt(document.getElementById('documentationProgress').value) || 0;
    const rating = parseInt(document.getElementById('rating').value) || 0;
    const strengths = document.getElementById('strengths').value.split('\n').filter(s => s.trim());
    const weaknesses = document.getElementById('weaknesses').value.split('\n').filter(w => w.trim());
    const recommendations = document.getElementById('recommendations').value.trim();
    const nextMilestone = document.getElementById('nextMilestone').value.trim();
    const nextMeetingDate = document.getElementById('nextMeetingDate').value;
    
    if (!overallProgress || !recommendations) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/progress-reports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teamId: selectedTeamId,
                overallProgress,
                technicalProgress,
                documentationProgress,
                strengths,
                weaknesses,
                recommendations,
                nextMilestone,
                nextMeetingDate,
                rating
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Progress report created successfully!', 'success');
            closeNewReportModal();
            await selectTeam(selectedTeamId); // Reload data
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Save progress report error:', error);
        showAlert('Failed to create progress report', 'error');
    }
}

async function updateMeetingStatus(meetingId, status) {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/meetings/${meetingId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Meeting ${status}!`, 'success');
            await selectTeam(selectedTeamId); // Reload data
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Update meeting error:', error);
        showAlert('Failed to update meeting', 'error');
    }
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

function getMilestoneStatusColor(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'in_progress': return 'primary';
        case 'overdue': return 'danger';
        default: return 'warning';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadTeams);