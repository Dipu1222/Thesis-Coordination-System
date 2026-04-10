let allTeams = [];
let allSupervisors = [];
let selectedTeam = null;

async function loadTeams() {
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        allTeams = data;
        updateTeamStats(data);
        displayTeams(data);
    } catch (error) {
        console.error('Load teams error:', error);
        showAlert('Failed to load teams', 'error');
    }
}

function updateTeamStats(teams) {
    const totalTeams = teams.length;
    const activeTeams = teams.filter(t => 
        ['formed', 'supervisor_assigned', 'project_started'].includes(t.status)
    ).length;
    const teamsWithoutSupervisor = teams.filter(t => !t.supervisorId).length;
    const completedTeams = teams.filter(t => t.status === 'completed').length;
    
    document.getElementById('totalTeamsStat').textContent = totalTeams;
    document.getElementById('activeTeamsStat').textContent = activeTeams;
    document.getElementById('teamsWithoutSupervisor').textContent = teamsWithoutSupervisor;
    document.getElementById('completedTeams').textContent = completedTeams;
    document.getElementById('teamsCount').textContent = `${totalTeams} teams found`;
}

function searchTeams() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    let filteredTeams = allTeams;
    
    if (searchTerm) {
        filteredTeams = filteredTeams.filter(team => 
            team.teamName.toLowerCase().includes(searchTerm) ||
            (team.projectTitle && team.projectTitle.toLowerCase().includes(searchTerm)) ||
            team.members.some(member => member.name.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter) {
        filteredTeams = filteredTeams.filter(team => team.status === statusFilter);
    }
    
    // Note: Department filter would require additional data
    // For now, we'll skip it
    
    displayTeams(filteredTeams);
}

function displayTeams(teams) {
    const container = document.getElementById('teamsTable');
    
    if (teams.length === 0) {
        container.innerHTML = '<tr><td colspan="7">No teams found</td></tr>';
        return;
    }

    container.innerHTML = teams.map(team => `
        <tr>
            <td>
                <strong>${team.teamName}</strong><br>
                <small>Code: ${team.teamCode}</small>
            </td>
            <td>
                ${team.members.map(m => `
                    <div>${m.name} ${m.studentId === team.teamLeader?.studentId ? '👑' : ''}</div>
                `).join('')}
            </td>
            <td>${team.projectTitle || 'Not set'}</td>
            <td>
                ${team.supervisorId ? 
                    `<span>${team.supervisorId.name}</span>` : 
                    '<span class="badge badge-warning">No Supervisor</span>'
                }
            </td>
            <td>
                <span class="badge badge-${getStatusBadgeClass(team.status)}">
                    ${team.status.replace('_', ' ')}
                </span>
            </td>
            <td>${new Date(team.createdAt).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button onclick="viewTeamDetails('${team._id}')" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                    View
                </button>
                ${!team.supervisorId ? 
                    `<button onclick="openAssignSupervisorModal('${team._id}')" class="btn btn-primary" style="padding: 0.3rem 0.5rem;">
                        Assign
                    </button>` : 
                    `<button onclick="showComingSoon()" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                        Reassign
                    </button>`
                }
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'forming': 'warning',
        'formed': 'info',
        'supervisor_assigned': 'info',
        'project_started': 'success',
        'completed': 'success'
    };
    return statusClasses[status] || 'info';
}

function viewTeamDetails(teamId) {
    selectedTeam = allTeams.find(t => t._id === teamId);
    if (!selectedTeam) return;
    
    document.getElementById('teamDetailsContent').innerHTML = `
        <h4>${selectedTeam.teamName}</h4>
        <p><strong>Team Code:</strong> ${selectedTeam.teamCode}</p>
        <p><strong>Status:</strong> <span class="badge badge-${getStatusBadgeClass(selectedTeam.status)}">
            ${selectedTeam.status.replace('_', ' ')}
        </span></p>
        
        <h5>Team Members</h5>
        <div class="grid grid-3">
            ${selectedTeam.members.map(member => `
                <div class="member-card">
                    <h6>${member.name} ${member._id === selectedTeam.teamLeader?._id ? '👑' : ''}</h6>
                    <p>ID: ${member.studentId}</p>
                    <p>Email: ${member.email}</p>
                    <p>Department: ${member.department}</p>
                </div>
            `).join('')}
        </div>
        
        ${selectedTeam.supervisorId ? `
            <h5>Supervisor</h5>
            <p><strong>Name:</strong> ${selectedTeam.supervisorId.name}</p>
            <p><strong>Status:</strong> ${selectedTeam.supervisorStatus}</p>
        ` : ''}
        
        ${selectedTeam.projectTitle ? `
            <h5>Project Details</h5>
            <p><strong>Title:</strong> ${selectedTeam.projectTitle}</p>
        ` : ''}
        
        <p><strong>Created:</strong> ${new Date(selectedTeam.createdAt).toLocaleString()}</p>
    `;
    
    document.getElementById('teamDetailsModal').style.display = 'block';
}

async function openAssignSupervisorModal(teamId) {
    selectedTeam = allTeams.find(t => t._id === teamId);
    if (!selectedTeam) return;
    
    document.getElementById('teamInfo').innerHTML = `
        <p><strong>Team:</strong> ${selectedTeam.teamName}</p>
        <p><strong>Members:</strong> ${selectedTeam.members.map(m => m.name).join(', ')}</p>
    `;
    
    // Load supervisors
    await loadSupervisors();
    
    document.getElementById('assignSupervisorModal').style.display = 'block';
}

async function loadSupervisors() {
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/supervisors/workload`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        allSupervisors = data;
        
        const select = document.getElementById('supervisorSelect');
        select.innerHTML = '<option value="">Select Supervisor</option>' +
            data.map(sup => `
                <option value="${sup.id}">
                    ${sup.name} (${sup.currentTeams}/${sup.maxTeams} teams)
                </option>
            `).join('');
        
        // Add change event to show supervisor info
        select.onchange = () => {
            const selectedId = select.value;
            const supervisor = data.find(s => s.id === selectedId);
            if (supervisor) {
                document.getElementById('supervisorInfo').innerHTML = `
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                        <p><strong>Name:</strong> ${supervisor.name}</p>
                        <p><strong>Department:</strong> ${supervisor.department}</p>
                        <p><strong>Designation:</strong> ${supervisor.designation}</p>
                        <p><strong>Research Areas:</strong> ${supervisor.researchAreas.join(', ')}</p>
                        <p><strong>Current Teams:</strong> ${supervisor.currentTeams}/${supervisor.maxTeams}</p>
                        <p><strong>Available Slots:</strong> ${supervisor.availableSlots}</p>
                    </div>
                `;
            } else {
                document.getElementById('supervisorInfo').innerHTML = '';
            }
        };
    } catch (error) {
        console.error('Load supervisors error:', error);
        document.getElementById('supervisorSelect').innerHTML = 
            '<option value="">Failed to load supervisors</option>';
    }
}

async function assignSupervisor() {
    const supervisorId = document.getElementById('supervisorSelect').value;
    
    if (!supervisorId || !selectedTeam) {
        showAlert('Please select a supervisor', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/teams/${selectedTeam._id}/assign-supervisor`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ supervisorId })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Supervisor assigned successfully!', 'success');
            closeModal();
            loadTeams(); // Reload teams
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Assign supervisor error:', error);
        showAlert('Failed to assign supervisor', 'error');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    selectedTeam = null;
}

function showComingSoon() {
    alert('This feature is coming soon!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadTeams);