let allStudents = [];
let teamRequests = { incoming: [], outgoing: [] };
let currentTeam = null;
let selectedStudent = null;

// Check if user has team and show appropriate content
async function checkTeamStatus() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Load current team
        const response = await fetch(`${API_BASE_URL}/student/team/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.team) {
            currentTeam = data.team;
            showTeamSection();
            loadTeamRequests();
        } else {
            document.getElementById('currentTeamSection').style.display = 'none';
            document.getElementById('teamFormationTabs').style.display = 'block';
        }
        
        // Load team requests
        await loadTeamRequests();
        
    } catch (error) {
        console.error('Check team status error:', error);
    }
}

// Show team section
function showTeamSection() {
    document.getElementById('currentTeamSection').style.display = 'block';
    document.getElementById('teamFormationTabs').style.display = 'none';
    
    // Update team info
    if (currentTeam) {
        document.getElementById('teamCodeDisplay').textContent = currentTeam.teamCode;
        updateTeamMembers();
    }
}

// Update team members display
function updateTeamMembers() {
    const membersList = document.getElementById('teamMembersList');
    
    if (!currentTeam || !currentTeam.members || currentTeam.members.length === 0) {
        membersList.innerHTML = '<p>No team members found</p>';
        return;
    }
    
    membersList.innerHTML = currentTeam.members.map(member => `
        <div class="member-card">
            <h4>${member.name}</h4>
            <p><strong>ID:</strong> ${member.studentId}</p>
            <p><strong>Department:</strong> ${member.department}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            ${member._id === currentTeam.teamLeader._id ? 
                '<span class="member-role">Team Leader</span>' : 
                '<span class="member-role">Member</span>'
            }
        </div>
    `).join('');
}

// Search students
async function searchStudents() {
    const searchTerm = document.getElementById('searchInput').value;
    const department = document.getElementById('departmentFilter').value;

    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (department) params.append('department', department);

        const response = await fetch(`${API_BASE_URL}/student/search-students?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        allStudents = data;
        displayStudents(data);
    } catch (error) {
        console.error('Search error:', error);
        showAlert('Failed to search students', 'error');
    }
}

// Display students
function displayStudents(students) {
    const container = document.getElementById('studentsContainer');
    
    if (students.length === 0) {
        container.innerHTML = '<p>No students found matching your criteria.</p>';
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="student-info">
                <h4>${student.name}</h4>
                <p><strong>ID:</strong> ${student.studentId}</p>
                <p><strong>Department:</strong> ${student.department}</p>
                <p><strong>Semester:</strong> ${student.semester}</p>
                <p><strong>CGPA:</strong> ${student.cgpa}</p>
            </div>
            <button onclick="openRequestModal('${student._id}')" class="btn btn-primary">
                Send Request
            </button>
        </div>
    `).join('');
}

// Load team requests
async function loadTeamRequests() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        teamRequests = data;
        displayTeamRequests();
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

// Display team requests
function displayTeamRequests() {
    // Incoming requests
    const incomingContainer = document.getElementById('incomingRequests');
    if (teamRequests.incoming.length === 0) {
        incomingContainer.innerHTML = '<p>No incoming requests</p>';
    } else {
        incomingContainer.innerHTML = teamRequests.incoming.map(request => `
            <div class="request-card">
                <div class="request-info">
                    <h4>${request.fromStudent.name}</h4>
                    <p><strong>ID:</strong> ${request.fromStudent.studentId}</p>
                    <p><strong>Department:</strong> ${request.fromStudent.department}</p>
                    <p>${request.message}</p>
                    <small>${new Date(request.createdAt).toLocaleDateString()}</small>
                </div>
                <div>
                    <span class="request-status status-pending">Pending</span>
                    <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                        <button onclick="respondToRequest('${request._id}', 'accept')" 
                                class="btn btn-success" style="padding: 0.3rem 0.8rem;">
                            Accept
                        </button>
                        <button onclick="respondToRequest('${request._id}', 'reject')" 
                                class="btn btn-danger" style="padding: 0.3rem 0.8rem;">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Outgoing requests
    const outgoingContainer = document.getElementById('outgoingRequests');
    if (teamRequests.outgoing.length === 0) {
        outgoingContainer.innerHTML = '<p>No outgoing requests</p>';
    } else {
        outgoingContainer.innerHTML = teamRequests.outgoing.map(request => `
            <div class="request-card">
                <div class="request-info">
                    <h4>${request.toStudent.name}</h4>
                    <p><strong>ID:</strong> ${request.toStudent.studentId}</p>
                    <p><strong>Department:</strong> ${request.toStudent.department}</p>
                    <p>${request.message}</p>
                    <small>Sent: ${new Date(request.createdAt).toLocaleDateString()}</small>
                </div>
                <div>
                    <span class="request-status status-${request.status}">${request.status}</span>
                    ${request.status === 'pending' ? 
                        `<button onclick="cancelRequest('${request._id}')" 
                                class="btn btn-outline" style="margin-top: 0.5rem; padding: 0.3rem 0.8rem;">
                            Cancel
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }
}

// Open request modal
function openRequestModal(studentId) {
    selectedStudent = allStudents.find(s => s._id === studentId);
    if (!selectedStudent) return;
    
    document.getElementById('requestModalTitle').textContent = `Send Request to ${selectedStudent.name}`;
    document.getElementById('requestStudentInfo').innerHTML = `
        <p><strong>Student:</strong> ${selectedStudent.name} (${selectedStudent.studentId})</p>
        <p><strong>Department:</strong> ${selectedStudent.department}</p>
        <p><strong>CGPA:</strong> ${selectedStudent.cgpa}</p>
    `;
    
    document.getElementById('requestMessage').value = `Hi ${selectedStudent.name}, I would like to invite you to join my thesis team.`;
    document.getElementById('requestModal').style.display = 'block';
}

// Send team request
async function sendTeamRequest() {
    const message = document.getElementById('requestMessage').value;
    
    if (!selectedStudent) {
        showAlert('No student selected', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/send-request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                toStudentId: selectedStudent._id,
                message: message
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Team request sent successfully!', 'success');
            closeModal();
            loadTeamRequests();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Team request error:', error);
        showAlert('Failed to send team request', 'error');
    }
}

// Respond to team request
async function respondToRequest(requestId, action) {
    if (!confirm(`${action === 'accept' ? 'Accept' : 'Reject'} this team request?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/respond-request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requestId: requestId,
                action: action
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Request ${action}ed successfully!`, 'success');
            await loadTeamRequests();
            await checkTeamStatus();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Respond request error:', error);
        showAlert('Failed to respond to request', 'error');
    }
}

// Cancel request
async function cancelRequest(requestId) {
    if (!confirm('Cancel this request?')) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/cancel-request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestId })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Request cancelled successfully!', 'success');
            loadTeamRequests();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Cancel request error:', error);
        showAlert('Failed to cancel request', 'error');
    }
}

// Invite by code
async function inviteByCode() {
    const code = document.getElementById('inviteCodeInput').value.trim();
    
    if (!code) {
        showAlert('Please enter a student ID', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/invite-by-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teamCode: code })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Invitation sent successfully!', 'success');
            document.getElementById('inviteCodeInput').value = '';
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Invite by code error:', error);
        showAlert('Failed to send invitation', 'error');
    }
}

// Leave team
async function leaveTeam() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isLeader = user.isTeamLeader;
    
    const message = isLeader ? 
        'You are the team leader. If you leave, the team will be deleted. Are you sure?' :
        'Are you sure you want to leave the team?';
    
    if (!confirm(message)) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/team/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            
            // Update local storage
            localStorage.removeItem('teamInfo');
            const user = JSON.parse(localStorage.getItem('user'));
            user.teamId = null;
            user.isTeamLeader = false;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Reload page
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Leave team error:', error);
        showAlert('Failed to leave team', 'error');
    }
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Activate selected button
    event.target.classList.add('active');
    
    // Load data for tab if needed
    if (tabName === 'requests') {
        loadTeamRequests();
    } else if (tabName === 'search') {
        searchStudents();
    }
}

// Modal functions
function closeModal() {
    document.getElementById('createTeamModal').style.display = 'none';
    document.getElementById('requestModal').style.display = 'none';
    selectedStudent = null;
}

// Add cancel request route (add to server/routes/student.js)
router.post('/team/cancel-request', auth, isStudent, async (req, res) => {
    try {
        const { requestId } = req.body;
        const studentId = req.user.userId;
        
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Check if request belongs to this student
        if (request.fromStudent.toString() !== studentId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel non-pending request' });
        }
        
        request.status = 'cancelled';
        request.respondedAt = new Date();
        await request.save();
        
        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkTeamStatus();
    searchStudents();
});