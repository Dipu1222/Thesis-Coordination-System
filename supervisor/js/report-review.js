let allDocuments = [];
let currentDocumentId = null;
let currentDocument = null;

async function loadDocuments() {
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
        
        // Get documents for each team
        const documentPromises = teams.map(team => 
            fetch(`${API_BASE_URL}/supervisor/teams/${team._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => res.json())
        );
        
        const teamsData = await Promise.all(documentPromises);
        
        // Collect all documents
        allDocuments = [];
        teamsData.forEach(teamData => {
            if (teamData && teamData.documents && teamData.documents.length > 0) {
                teamData.documents.forEach(doc => {
                    allDocuments.push({
                        _id: doc._id,
                        title: doc.title || 'Untitled Document',
                        documentType: doc.documentType || 'Document',
                        submissionDate: doc.submissionDate,
                        status: doc.status || 'uploaded',
                        marks: doc.marks,
                        reviewerComments: doc.reviewerComments,
                        team: teamData.team ? {
                            _id: teamData.team._id,
                            teamName: teamData.team.teamName
                        } : null
                    });
                });
            }
        });
        
        console.log('Loaded documents:', allDocuments);
        updateStats();
        filterDocuments('all', null);
    } catch (error) {
        console.error('Load documents error:', error);
        showAlert('Failed to load documents: ' + error.message, 'error');
    }
}

function updateStats() {
    const total = allDocuments.length;
    const pending = allDocuments.filter(d => d.status === 'uploaded').length;
    const approved = allDocuments.filter(d => d.status === 'approved').length;
    const needsRevision = allDocuments.filter(d => d.status === 'needs_revision').length;
    
    document.getElementById('totalDocuments').textContent = total;
    document.getElementById('pendingReview').textContent = pending;
    document.getElementById('approvedDocs').textContent = approved;
    document.getElementById('needsRevisionDocs').textContent = needsRevision;
}

function filterDocuments(filter, element) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // If element is passed (onclick with 'this'), use it. Otherwise find by filter value
    if (element) {
        element.classList.add('active');
    } else {
        // Find and mark active based on filter value
        const filterMap = {
            'all': 'All Documents',
            'pending': 'Pending Review',
            'approved': 'Approved',
            'revision': 'Needs Revision'
        };
        const tabText = filterMap[filter];
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            if (tab.textContent === tabText) {
                tab.classList.add('active');
            }
        });
    }
    
    // Filter documents
    let filteredDocs = allDocuments;
    
    switch(filter) {
        case 'pending':
            filteredDocs = allDocuments.filter(d => d.status === 'uploaded');
            break;
        case 'approved':
            filteredDocs = allDocuments.filter(d => d.status === 'approved');
            break;
        case 'revision':
            filteredDocs = allDocuments.filter(d => d.status === 'needs_revision');
            break;
    }
    
    // Apply type filter if active
    const activeType = document.querySelector('.type-tab.active')?.textContent.toLowerCase() || 'all types';
    if (activeType !== 'all types') {
        filteredDocs = filteredDocs.filter(d => 
            (d.documentType || '').toLowerCase().includes(activeType)
        );
    }
    
    // Display documents
    displayDocuments(filteredDocs);
}

function filterByType(type, element) {
    // Update active tab
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
    }
    
    // Reapply current status filter
    const activeStatusEl = document.querySelector('.filter-tab.active');
    let activeFilter = 'all';
    
    if (activeStatusEl) {
        const statusText = activeStatusEl.textContent.toLowerCase();
        if (statusText.includes('pending')) activeFilter = 'pending';
        else if (statusText.includes('approved')) activeFilter = 'approved';
        else if (statusText.includes('revision')) activeFilter = 'revision';
    }
    
    filterDocuments(activeFilter);
}

function displayDocuments(documents) {
    const container = document.getElementById('documentsList');
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>No documents found</p>
                <p class="text-muted">Try selecting a different filter</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => {
        const statusClass = `badge-${getDocumentStatusColor(doc.status)}`;
        const typeClass = `badge-${getDocumentTypeColor(doc.documentType)}`;
        
        return `
            <div class="document-card">
                <div class="document-header">
                    <div>
                        <div class="document-title">${doc.title || doc.fileName || 'Untitled Document'}</div>
                        <div class="document-meta">
                            Team: ${doc.team?.teamName || 'Unknown Team'} • 
                            Type: <span class="badge ${typeClass}">${doc.documentType || 'Document'}</span> • 
                            Submitted: ${doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : 'N/A'} • 
                            ${doc.fileSize ? `Size: ${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                        </div>
                    </div>
                    <span class="badge ${statusClass}">${doc.status || 'unknown'}</span>
                </div>
                
                ${doc.reviewerComments ? `
                    <div class="review-section">
                        <strong>Your Feedback:</strong>
                        <p>${doc.reviewerComments}</p>
                        ${doc.marks ? `<p><strong>Marks:</strong> ${doc.marks}/100</p>` : ''}
                    </div>
                ` : ''}
                
                ${doc.status === 'uploaded' || doc.status === 'needs_revision' ? `
                    <div class="action-buttons" style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button onclick="openReviewModal('${doc._id}')" class="btn btn-primary">
                            Review Document
                        </button>
                        <button onclick="downloadDocument('${doc._id}', '${doc.title || doc.fileName || 'document'}')" class="btn btn-outline">
                            Download
                        </button>
                    </div>
                ` : `
                    <div style="margin-top: 1rem;">
                        <button onclick="downloadDocument('${doc._id}', '${doc.title || doc.fileName || 'document'}')" class="btn btn-outline">
                            Download Document
                        </button>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

function openReviewModal(documentId) {
    currentDocumentId = documentId;
    currentDocument = allDocuments.find(d => d._id === documentId);
    
    if (!currentDocument) return;
    
    const modalContent = `
        <div class="document-card">
            <div class="document-header">
                <div>
                    <div class="document-title">${currentDocument.fileName}</div>
                    <div class="document-meta">
                        Team: ${currentDocument.team?.teamName || 'Unknown Team'} • 
                        Type: ${currentDocument.documentType} • 
                        Submitted: ${new Date(currentDocument.submissionDate).toLocaleDateString()}
                    </div>
                </div>
            </div>
            
            <div class="document-preview">
                <p><strong>Document Preview:</strong></p>
                <p>This would show the actual document content in a real implementation.</p>
                <p>For now, you can download the document to review it.</p>
            </div>
            
            <div class="action-buttons" style="display: flex; gap: 1rem;">
                <button onclick="downloadDocument('${currentDocument._id}', '${currentDocument.fileName}')" class="btn btn-primary">
                    📥 Download Full Document
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('documentDetails').innerHTML = modalContent;
    
    // Reset evaluation form
    resetEvaluationForm();
    
    // Set existing marks if available
    if (currentDocument.marks) {
        const marks = currentDocument.marks;
        document.getElementById('technicalContent').value = Math.min(40, marks * 0.4);
        document.getElementById('structure').value = Math.min(20, marks * 0.2);
        document.getElementById('clarity').value = Math.min(15, marks * 0.15);
        document.getElementById('references').value = Math.min(15, marks * 0.15);
        document.getElementById('formatting').value = Math.min(10, marks * 0.1);
        calculateTotal();
    }
    
    if (currentDocument.reviewerComments) {
        document.getElementById('reviewComments').value = currentDocument.reviewerComments;
    }
    
    document.getElementById('reviewModal').style.display = 'block';
}

function closeReviewModal() {
    currentDocumentId = null;
    currentDocument = null;
    resetEvaluationForm();
    document.getElementById('reviewModal').style.display = 'none';
}

function resetEvaluationForm() {
    document.getElementById('technicalContent').value = 0;
    document.getElementById('structure').value = 0;
    document.getElementById('clarity').value = 0;
    document.getElementById('references').value = 0;
    document.getElementById('formatting').value = 0;
    document.getElementById('reviewComments').value = '';
    calculateTotal();
}

function calculateTotal() {
    const technical = parseInt(document.getElementById('technicalContent').value) || 0;
    const structure = parseInt(document.getElementById('structure').value) || 0;
    const clarity = parseInt(document.getElementById('clarity').value) || 0;
    const references = parseInt(document.getElementById('references').value) || 0;
    const formatting = parseInt(document.getElementById('formatting').value) || 0;
    
    // Update displays
    document.getElementById('technicalDisplay').textContent = technical;
    document.getElementById('structureDisplay').textContent = structure;
    document.getElementById('clarityDisplay').textContent = clarity;
    document.getElementById('referencesDisplay').textContent = references;
    document.getElementById('formattingDisplay').textContent = formatting;
    
    const total = technical + structure + clarity + references + formatting;
    document.getElementById('totalScore').textContent = total;
    
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

function runPlagiarismCheck() {
    // Simulate plagiarism check
    const score = Math.floor(Math.random() * 21); // 0-20%
    const scoreElement = document.getElementById('plagiarismScore');
    scoreElement.textContent = `${score}%`;
    
    if (score < 5) {
        scoreElement.className = 'plagiarism-score score-low';
    } else if (score < 15) {
        scoreElement.className = 'plagiarism-score score-medium';
    } else {
        scoreElement.className = 'plagiarism-score score-high';
    }
    
    showAlert(`Plagiarism check completed. Similarity score: ${score}%`, 'info');
}

async function submitEvaluation(action) {
    const totalScore = calculateTotal();
    const comments = document.getElementById('reviewComments').value.trim();
    
    if (action !== 'reject' && totalScore === 0) {
        showAlert('Please provide evaluation scores', 'error');
        return;
    }
    
    if ((action === 'request_revision' || action === 'reject') && !comments) {
        showAlert('Please provide feedback for the team', 'error');
        return;
    }
    
    const actionText = action === 'approve' ? 'approve' : 
                      action === 'request_revision' ? 'request revision for' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} this document?`)) return;
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/documents/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documentId: currentDocumentId,
                action: action,
                comments: comments,
                marks: action === 'approve' ? totalScore : null
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Document ${actionText}d successfully!`, 'success');
            closeReviewModal();
            loadDocuments();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Submit evaluation error:', error);
        showAlert('Failed to submit evaluation', 'error');
    }
}

function downloadDocument(documentId, fileName) {
    // In a real implementation, this would download the actual file
    // For demo purposes, we'll simulate download
    const content = `This is a simulation of downloading: ${fileName}\n\nDocument ID: ${documentId}\nTeam: ${currentDocument?.team?.teamName || 'Unknown'}\nDownloaded: ${new Date().toLocaleString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.pdf', '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Document download started', 'info');
}

function getDocumentStatusColor(status) {
    switch(status) {
        case 'uploaded': return 'warning';
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        case 'needs_revision': return 'info';
        default: return 'secondary';
    }
}

function getDocumentTypeColor(type) {
    switch(type) {
        case 'proposal': return 'primary';
        case 'midterm': return 'info';
        case 'final': return 'success';
        case 'presentation': return 'warning';
        default: return 'secondary';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDocuments);