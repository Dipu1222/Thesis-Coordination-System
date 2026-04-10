let allDefenses = [];
let currentDefenseId = null;
let currentDefense = null;

async function loadDefenses() {
    try {
        const token = localStorage.getItem('supervisor_token');
        const supervisor = JSON.parse(localStorage.getItem('supervisor'));
        
        // Get teams first
        const teamsResponse = await fetch(`${API_BASE_URL}/supervisor/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const teams = await teamsResponse.json();
        
        // Collect defenses from all teams
        allDefenses = [];
        
        for (const team of teams) {
            try {
                const teamData = await fetch(`${API_BASE_URL}/supervisor/teams/${team._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(res => res.json());
                
                // In real implementation, you would have a separate API for defenses
                // For now, we'll use mock data
                const mockDefenses = [
                    {
                        _id: `def-${team._id}-1`,
                        teamId: team._id,
                        team: team,
                        defenseType: 'pre-defense',
                        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                        scheduledTime: '10:00 AM',
                        venue: 'Room 101',
                        status: 'scheduled',
                        panelMembers: [
                            { name: 'Dr. Smith', department: 'CSE' },
                            { name: 'Prof. Johnson', department: 'CSE' }
                        ]
                    },
                    {
                        _id: `def-${team._id}-2`,
                        teamId: team._id,
                        team: team,
                        defenseType: 'final-defense',
                        scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        scheduledTime: '2:00 PM',
                        venue: 'Main Auditorium',
                        status: 'scheduled',
                        panelMembers: [
                            { name: 'Dr. Smith', department: 'CSE' },
                            { name: 'Prof. Johnson', department: 'CSE' },
                            { name: 'Dr. Williams', department: 'EEE' }
                        ]
                    }
                ];
                
                allDefenses.push(...mockDefenses);
            } catch (error) {
                console.error(`Error loading defenses for team ${team._id}:`, error);
            }
        }
        
        updateStats();
        filterDefenses('upcoming');
    } catch (error) {
        console.error('Load defenses error:', error);
        showAlert('Failed to load defense sessions', 'error');
    }
}

function updateStats() {
    const total = allDefenses.length;
    const upcoming = allDefenses.filter(d => 
        new Date(d.scheduledDate) > new Date() && d.status === 'scheduled'
    ).length;
    const completed = allDefenses.filter(d => d.status === 'completed').length;
    const evaluated = allDefenses.filter(d => d.status === 'evaluated').length;
    
    document.getElementById('totalDefenses').textContent = total;
    document.getElementById('upcomingDefenses').textContent = upcoming;
    document.getElementById('completedDefenses').textContent = completed;
    document.getElementById('evaluatedDefenses').textContent = evaluated;
}

function filterDefenses(filter) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter defenses
    let filteredDefenses = allDefenses;
    const now = new Date();
    
    switch(filter) {
        case 'upcoming':
            filteredDefenses = allDefenses.filter(d => 
                new Date(d.scheduledDate) > now && d.status === 'scheduled'
            );
            break;
        case 'completed':
            filteredDefenses = allDefenses.filter(d => d.status === 'completed');
            break;
        case 'evaluated':
            filteredDefenses = allDefenses.filter(d => d.status === 'evaluated');
            break;
    }
    
    // Display defenses
    displayDefenses(filteredDefenses);
}

function displayDefenses(defenses) {
    const container = document.getElementById('defensesList');
    
    if (defenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎓</div>
                <p>No defense sessions found</p>
                <p class="text-muted">Try selecting a different filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = defenses.map(defense => {
        const defenseDate = new Date(defense.scheduledDate);
        const isPast = defenseDate < new Date();
        const statusColor = isPast ? 'badge-success' : 'badge-primary';
        
        return `
            <div class="defense-card">
                <div class="defense-header">
                    <div>
                        <div class="defense-title">
                            ${defense.defenseType.toUpperCase()} - ${defense.team?.teamName || 'Unknown Team'}
                        </div>
                        <div class="defense-meta">
                            Project: ${defense.team?.projectTitle || 'Not assigned yet'} • 
                            Status: <span class="badge ${statusColor}">${defense.status}</span>
                        </div>
                    </div>
                    ${!isPast ? `
                        <button onclick="openEvaluationModal('${defense._id}')" class="btn btn-primary">
                            Evaluate
                        </button>
                    ` : `
                        <span class="badge badge-success">Evaluated</span>
                    `}
                </div>
                
                <div class="defense-schedule">
                    <div class="schedule-grid">
                        <div class="schedule-item">
                            <div class="schedule-label">Date</div>
                            <div class="schedule-value">${defenseDate.toLocaleDateString()}</div>
                        </div>
                        <div class="schedule-item">
                            <div class="schedule-label">Time</div>
                            <div class="schedule-value">${defense.scheduledTime}</div>
                        </div>
                        <div class="schedule-item">
                            <div class="schedule-label">Venue</div>
                            <div class="schedule-value">${defense.venue}</div>
                        </div>
                        <div class="schedule-item">
                            <div class="schedule-label">Type</div>
                            <div class="schedule-value">${defense.defenseType}</div>
                        </div>
                    </div>
                </div>
                
                ${defense.panelMembers?.length > 0 ? `
                    <div>
                        <strong>Panel Members:</strong>
                        <div class="panel-members">
                            ${defense.panelMembers.map(member => `
                                <span class="panel-member">${member.name}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${defense.team?.members?.length > 0 ? `
                    <div style="margin-top: 1rem;">
                        <strong>Team Members:</strong>
                        <div class="panel-members">
                            ${defense.team.members.map(member => `
                                <span class="panel-member">${member.name} (${member.studentId})</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openEvaluationModal(defenseId) {
    currentDefenseId = defenseId;
    currentDefense = allDefenses.find(d => d._id === defenseId);
    
    if (!currentDefense) return;
    
    const defenseDate = new Date(currentDefense.scheduledDate);
    const modalContent = `
        <div class="defense-card">
            <div class="defense-header">
                <div>
                    <div class="defense-title">
                        ${currentDefense.defenseType.toUpperCase()} Evaluation
                    </div>
                    <div class="defense-meta">
                        Team: ${currentDefense.team?.teamName || 'Unknown Team'} • 
                        Date: ${defenseDate.toLocaleDateString()} • 
                        Time: ${currentDefense.scheduledTime}
                    </div>
                </div>
            </div>
            
            <div class="defense-schedule">
                <div class="schedule-grid">
                    <div class="schedule-item">
                        <div class="schedule-label">Project Title</div>
                        <div class="schedule-value">${currentDefense.team?.projectTitle || 'Not assigned yet'}</div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Venue</div>
                        <div class="schedule-value">${currentDefense.venue}</div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Defense Type</div>
                        <div class="schedule-value">${currentDefense.defenseType}</div>
                    </div>
                    <div class="schedule-item">
                        <div class="schedule-label">Duration</div>
                        <div class="schedule-value">60 minutes</div>
                    </div>
                </div>
            </div>
            
            ${currentDefense.panelMembers?.length > 0 ? `
                <div>
                    <strong>Panel Members:</strong>
                    <div class="panel-members">
                        ${currentDefense.panelMembers.map(member => `
                            <span class="panel-member">${member.name} (${member.department})</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-top: 1rem;">
                <strong>Team Members:</strong>
                <div class="panel-members">
                    ${currentDefense.team?.members?.map(member => `
                        <span class="panel-member">${member.name} (${member.studentId})</span>
                    `).join('') || 'No team members'}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('defenseDetails').innerHTML = modalContent;
    
    // Reset evaluation form
    resetEvaluationForm();
    
    document.getElementById('evaluationModal').style.display = 'block';
}

function closeEvaluationModal() {
    currentDefenseId = null;
    currentDefense = null;
    resetEvaluationForm();
    document.getElementById('evaluationModal').style.display = 'none';
}

function resetEvaluationForm() {
    // Reset all score inputs
    document.getElementById('presentationClarity').value = 0;
    document.getElementById('timeManagement').value = 0;
    document.getElementById('communicationSkills').value = 0;
    document.getElementById('technicalDepth').value = 0;
    document.getElementById('innovation').value = 0;
    document.getElementById('methodology').value = 0;
    document.getElementById('questionUnderstanding').value = 0;
    document.getElementById('answerQuality').value = 0;
    document.getElementById('overallPerformance').value = 0;
    document.getElementById('professionalism').value = 0;
    
    // Reset text areas
    document.getElementById('strengths').value = '';
    document.getElementById('areasForImprovement').value = '';
    document.getElementById('comments').value = '';
    document.getElementById('recommendation').value = 'pass';
    
    calculateTotal();
}

function calculateTotal() {
    const scores = [
        'presentationClarity',
        'timeManagement', 
        'communicationSkills',
        'technicalDepth',
        'innovation',
        'methodology',
        'questionUnderstanding',
        'answerQuality',
        'overallPerformance',
        'professionalism'
    ];
    
    let total = 0;
    scores.forEach(id => {
        total += parseInt(document.getElementById(id).value) || 0;
    });
    
    document.getElementById('totalScoreDisplay').textContent = total;
    
    // Calculate grade
    let grade = 'F';
    let gradeClass = 'grade-F';
    
    if (total >= 90) {
        grade = 'A+';
        gradeClass = 'grade-A';
    } else if (total >= 85) {
        grade = 'A';
        gradeClass = 'grade-A';
    } else if (total >= 80) {
        grade = 'A-';
        gradeClass = 'grade-A';
    } else if (total >= 75) {
        grade = 'B+';
        gradeClass = 'grade-B';
    } else if (total >= 70) {
        grade = 'B';
        gradeClass = 'grade-B';
    } else if (total >= 65) {
        grade = 'B-';
        gradeClass = 'grade-B';
    } else if (total >= 60) {
        grade = 'C+';
        gradeClass = 'grade-C';
    } else if (total >= 55) {
        grade = 'C';
        gradeClass = 'grade-C';
    }
    
    const gradeDisplay = document.getElementById('gradeDisplay');
    gradeDisplay.textContent = grade;
    gradeDisplay.className = `grade-display ${gradeClass}`;
    
    return total;
}

async function submitDefenseEvaluation() {
    const totalScore = calculateTotal();
    const strengths = document.getElementById('strengths').value.split('\n').filter(s => s.trim());
    const areasForImprovement = document.getElementById('areasForImprovement').value.split('\n').filter(a => a.trim());
    const comments = document.getElementById('comments').value.trim();
    const recommendation = document.getElementById('recommendation').value;
    
    if (totalScore === 0) {
        showAlert('Please provide evaluation scores', 'error');
        return;
    }
    
    if (!comments) {
        showAlert('Please provide overall comments', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/defense-evaluations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                defenseId: currentDefenseId,
                teamId: currentDefense.teamId,
                presentationClarity: parseInt(document.getElementById('presentationClarity').value) || 0,
                timeManagement: parseInt(document.getElementById('timeManagement').value) || 0,
                communicationSkills: parseInt(document.getElementById('communicationSkills').value) || 0,
                technicalDepth: parseInt(document.getElementById('technicalDepth').value) || 0,
                innovation: parseInt(document.getElementById('innovation').value) || 0,
                methodology: parseInt(document.getElementById('methodology').value) || 0,
                questionUnderstanding: parseInt(document.getElementById('questionUnderstanding').value) || 0,
                answerQuality: parseInt(document.getElementById('answerQuality').value) || 0,
                overallPerformance: parseInt(document.getElementById('overallPerformance').value) || 0,
                professionalism: parseInt(document.getElementById('professionalism').value) || 0,
                strengths,
                areasForImprovement,
                comments,
                recommendation
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Defense evaluation submitted successfully!', 'success');
            closeEvaluationModal();
            
            // Update defense status to evaluated
            currentDefense.status = 'evaluated';
            updateStats();
            filterDefenses('evaluated');
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Submit defense evaluation error:', error);
        showAlert('Failed to submit evaluation', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDefenses);