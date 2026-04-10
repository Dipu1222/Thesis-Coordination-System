let allAnnexes = [];
let currentAnnexId = null;

async function loadAnnexes() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        if (!token) {
            showAlert('Please login first', 'error');
            return;
        }
        
        console.log('Loading annexes...');
        const response = await fetch(`${API_BASE_URL}/supervisor/annexes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Annexes loaded:', data);
        allAnnexes = data || [];
        
        updateStats();
        filterAnnexes('pending');
    } catch (error) {
        console.error('Load annexes error:', error);
        showAlert('Failed to load annex forms: ' + error.message, 'error');
    }
}

function updateStats() {
    const total = allAnnexes.length;
    const pending = allAnnexes.filter(a => a.status === 'submitted').length;
    const approved = allAnnexes.filter(a => a.status === 'approved').length;
    const needsRevision = allAnnexes.filter(a => a.status === 'needs_revision').length;
    const rejected = allAnnexes.filter(a => a.status === 'rejected').length;
    
    console.log(`Stats: total=${total}, pending=${pending}, approved=${approved}, needs_revision=${needsRevision}, rejected=${rejected}`);
    
    const totalEl = document.getElementById('totalAnnexes');
    const pendingEl = document.getElementById('pendingAnnexes');
    const approvedEl = document.getElementById('approvedAnnexes');
    const revisionEl = document.getElementById('needsRevision');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (revisionEl) revisionEl.textContent = needsRevision;
}

function filterAnnexes(filter) {
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Only set active if event is available (from user click)
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Find the button for this filter and mark it as active
        const button = document.querySelector(`[data-filter="${filter}"]`);
        if (button) button.classList.add('active');
    }
    
    // Filter annexes
    let filteredAnnexes = allAnnexes;
    
    switch(filter) {
        case 'pending':
            filteredAnnexes = allAnnexes.filter(a => a.status === 'submitted');
            break;
        case 'approved':
            filteredAnnexes = allAnnexes.filter(a => a.status === 'approved');
            break;
        case 'rejected':
            filteredAnnexes = allAnnexes.filter(a => a.status === 'rejected');
            break;
        case 'revision':
            filteredAnnexes = allAnnexes.filter(a => a.status === 'needs_revision');
            break;
        case 'all':
            filteredAnnexes = allAnnexes;
            break;
    }
    
    // Display annexes
    displayAnnexes(filteredAnnexes);
}

function displayAnnexes(annexes) {
    const container = document.getElementById('annexesList');
    
    if (annexes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>No annex forms found</p>
                <p class="text-muted">Try selecting a different filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = annexes.map(annex => {
        const statusClass = `status-${annex.status.replace('_', '-')}`;
        const teamName = (annex.teamId && annex.teamId.teamName) ? annex.teamId.teamName : 'Unknown Team';
        
        return `
            <div class="annex-card">
                <div class="annex-header">
                    <div>
                        <div class="annex-title">${annex.projectTitle || 'Untitled Project'}</div>
                        <div class="annex-team">
                            Team: ${teamName}
                            • Submitted: ${new Date(annex.submittedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <span class="status-indicator ${statusClass}">${annex.status}</span>
                </div>
                
                <div class="annex-content">
                    <div class="section-title">Problem Statement</div>
                    <p>${annex.problemStatement || 'Not provided'}</p>
                    
                    <div class="section-title">Objectives</div>
                    <p>${annex.objectives || 'Not provided'}</p>
                    
                    <div class="section-title">Methodology</div>
                    <p>${annex.methodology || 'Not provided'}</p>
                </div>
                
                ${annex.reviewerComments ? `
                    <div class="comment-box">
                        <div class="comment-header">
                            <div class="comment-author">Your Feedback</div>
                            <div class="comment-date">${new Date(annex.submittedAt).toLocaleDateString()}</div>
                        </div>
                        <p>${annex.reviewerComments}</p>
                    </div>
                ` : ''}
                
                ${annex.status === 'submitted' ? `
                    <div class="action-buttons">
                        <button onclick="openReviewModal('${annex._id}')" class="btn btn-primary">
                            Review Annex Form
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openReviewModal(annexId) {
    currentAnnexId = annexId;
    const annex = allAnnexes.find(a => a._id === annexId);
    
    if (!annex) return;
    
    const modalContent = `
        <div class="annex-card">
            <div class="annex-header">
                <div>
                    <div class="annex-title">${annex.projectTitle || 'Untitled Project'}</div>
                    <div class="annex-team">
                        Team: ${annex.team?.teamName || 'Unknown Team'}
                        • Members: ${annex.team?.members?.map(m => m.name).join(', ') || 'Unknown'}
                    </div>
                </div>
            </div>
            
            <div class="annex-content">
                <div class="section-title">Project Title</div>
                <p>${annex.projectTitle || 'Not provided'}</p>
                
                <div class="section-title">Problem Statement</div>
                <p>${annex.problemStatement || 'Not provided'}</p>
                
                <div class="section-title">Objectives</div>
                <p>${annex.objectives || 'Not provided'}</p>
                
                <div class="section-title">Methodology</div>
                <p>${annex.methodology || 'Not provided'}</p>
                
                ${annex.expectedOutcome ? `
                    <div class="section-title">Expected Outcome</div>
                    <p>${annex.expectedOutcome}</p>
                ` : ''}
                
                ${annex.toolsTechnology ? `
                    <div class="section-title">Tools & Technology</div>
                    <p>${annex.toolsTechnology}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('annexDetails').innerHTML = modalContent;
    document.getElementById('reviewModal').style.display = 'block';
}

function closeReviewModal() {
    currentAnnexId = null;
    document.getElementById('reviewComments').value = '';
    document.getElementById('reviewModal').style.display = 'none';
}

async function submitReview(action) {
    const comments = document.getElementById('reviewComments').value.trim();
    
    if (!comments && (action === 'request_revision' || action === 'reject')) {
        showAlert('Please provide feedback for the team', 'error');
        return;
    }
    
    const actionText = action === 'approve' ? 'approve' : 
                      action === 'request_revision' ? 'request revision for' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} this annex form?`)) return;
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/annex/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                annexId: currentAnnexId,
                action: action,
                comments: comments
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Annex form ${actionText}d successfully!`, 'success');
            closeReviewModal();
            loadAnnexes();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Submit review error:', error);
        showAlert('Failed to submit review', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAnnexes);