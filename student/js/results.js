let resultsData = null;

// Load results data
async function loadResults() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        // In a real app, you would fetch from API
        // For now, we'll use mock data
        const mockResults = {
            finalGrade: "A+",
            gradeRemark: "Excellent - Distinction",
            status: "approved",
            marks: {
                supervisor: 45,
                midterm: 18,
                final: 35,
                report: 19,
                total: 117
            },
            defenses: {
                preDefense: {
                    status: "completed",
                    date: "2024-03-10",
                    marks: 18,
                    maxMarks: 20
                },
                finalDefense: {
                    status: "completed",
                    date: "2024-03-20",
                    marks: 35,
                    maxMarks: 40
                }
            },
            supervisorFeedback: [
                {
                    author: "Dr. Sarah Johnson",
                    date: "2024-03-18",
                    comment: "Excellent work on the implementation. The team showed great understanding of the concepts."
                }
            ],
            panelFeedback: [
                {
                    author: "Dr. Michael Chen",
                    date: "2024-03-20",
                    comment: "Good technical content but presentation could be more structured."
                },
                {
                    author: "Prof. David Wilson",
                    date: "2024-03-20",
                    comment: "Impressive project with real-world applications."
                }
            ],
            corrections: [
                "Add more details to methodology section",
                "Include comparison with existing systems",
                "Add references to recent papers"
            ],
            correctionDeadline: "2024-04-10",
            certificate: {
                projectTitle: "AI-Powered Thesis Management System",
                supervisor: "Dr. Sarah Johnson",
                issueDate: "2024-03-25"
            }
        };
        
        resultsData = mockResults;
        updateResultsUI(mockResults);
        
        // Update progress indicator based on status
        updateProgressIndicator(mockResults.status);
        
    } catch (error) {
        console.error('Load results error:', error);
        showAlert('Failed to load results', 'error');
    }
}

// Update results UI
function updateResultsUI(data) {
    // Update summary
    document.getElementById('finalGrade').textContent = data.finalGrade;
    document.getElementById('gradeRemark').textContent = data.gradeRemark;
    document.getElementById('resultStatus').textContent = 
        `Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`;
    
    // Update marks breakdown
    const marksBreakdown = document.getElementById('marksBreakdown');
    marksBreakdown.innerHTML = `
        <div class="mark-item">
            <div class="mark-value">${data.marks.supervisor}/50</div>
            <div class="mark-label">Supervisor Evaluation</div>
        </div>
        <div class="mark-item">
            <div class="mark-value">${data.marks.midterm}/20</div>
            <div class="mark-label">Mid-term Defense</div>
        </div>
        <div class="mark-item">
            <div class="mark-value">${data.marks.final}/40</div>
            <div class="mark-label">Final Defense</div>
        </div>
        <div class="mark-item">
            <div class="mark-value">${data.marks.report}/20</div>
            <div class="mark-label">Report Quality</div>
        </div>
        <div class="mark-item">
            <div class="mark-value">${data.marks.total}/130</div>
            <div class="mark-label">Total</div>
        </div>
    `;
    
    // Update defense results
    const preDefenseCard = document.getElementById('preDefenseResult');
    const finalDefenseCard = document.getElementById('finalDefenseResult');
    
    preDefenseCard.innerHTML = `
        <h4>Pre-Defense Evaluation</h4>
        <p>Status: <span class="status-badge status-${data.defenses.preDefense.status}">
            ${data.defenses.preDefense.status}
        </span></p>
        <p>Date: ${new Date(data.defenses.preDefense.date).toLocaleDateString()}</p>
        <p>Marks: ${data.defenses.preDefense.marks}/${data.defenses.preDefense.maxMarks}</p>
    `;
    
    finalDefenseCard.innerHTML = `
        <h4>Final Defense</h4>
        <p>Status: <span class="status-badge status-${data.defenses.finalDefense.status}">
            ${data.defenses.finalDefense.status}
        </span></p>
        <p>Date: ${new Date(data.defenses.finalDefense.date).toLocaleDateString()}</p>
        <p>Marks: ${data.defenses.finalDefense.marks}/${data.defenses.finalDefense.maxMarks}</p>
    `;
    
    // Update feedback
    const supervisorFeedback = document.getElementById('supervisorFeedback');
    if (data.supervisorFeedback.length > 0) {
        supervisorFeedback.innerHTML = data.supervisorFeedback.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-author">${feedback.author}</div>
                <div class="feedback-date">${new Date(feedback.date).toLocaleDateString()}</div>
                <p>${feedback.comment}</p>
            </div>
        `).join('');
    }
    
    // Update panel feedback
    const panelFeedback = document.getElementById('panelFeedback');
    if (data.panelFeedback.length > 0) {
        panelFeedback.innerHTML = data.panelFeedback.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-author">${feedback.author}</div>
                <div class="feedback-date">${new Date(feedback.date).toLocaleDateString()}</div>
                <p>${feedback.comment}</p>
            </div>
        `).join('');
    }
    
    // Update corrections
    const correctionsList = document.getElementById('correctionsList');
    const correctionStatus = document.getElementById('correctionStatus');
    const correctionActions = document.getElementById('correctionActions');
    
    if (data.corrections.length > 0) {
        correctionsList.innerHTML = `
            <h5>Required Corrections:</h5>
            <ul>
                ${data.corrections.map(correction => `<li>${correction}</li>`).join('')}
            </ul>
        `;
        correctionStatus.textContent = 'Pending Submission';
        correctionStatus.className = 'status-badge status-pending';
        correctionActions.style.display = 'block';
        document.getElementById('correctionDeadline').textContent = 
            new Date(data.correctionDeadline).toLocaleDateString();
    } else {
        correctionsList.innerHTML = '<p>No corrections required.</p>';
        correctionStatus.textContent = 'Completed';
        correctionStatus.className = 'status-badge status-approved';
        correctionActions.style.display = 'none';
    }
    
    // Update certificate if approved
    if (data.status === 'approved') {
        const certificateSection = document.getElementById('certificateSection');
        certificateSection.style.display = 'block';
        
        const user = JSON.parse(localStorage.getItem('user'));
        document.getElementById('certificateName').textContent = user.name;
        document.getElementById('certificateProject').textContent = data.certificate.projectTitle;
        document.getElementById('certificateSupervisor').textContent = data.certificate.supervisor;
        document.getElementById('certificateGrade').textContent = data.finalGrade;
        document.getElementById('certificateDate').textContent = 
            `Date: ${new Date(data.certificate.issueDate).toLocaleDateString()}`;
    }
    
    // Enable appeal button if not satisfied
    const appealButton = document.getElementById('appealButton');
    appealButton.disabled = false;
}

// Update progress indicator
function updateProgressIndicator(status) {
    const defenseStep = document.getElementById('defenseStep');
    const resultsStep = document.getElementById('resultsStep');
    
    if (status === 'approved' || status === 'conditional') {
        defenseStep.classList.add('completed');
        resultsStep.classList.add('completed');
        defenseStep.textContent = '✓';
        resultsStep.textContent = '✓';
    } else if (status === 'defended') {
        defenseStep.classList.add('completed');
        defenseStep.textContent = '✓';
    }
}

// Submit corrections
function submitCorrections() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        // Show confirmation
        if (confirm(`Submit ${files.length} corrected document(s)?`)) {
            // In real app, upload to server
            showAlert('Corrected documents submitted successfully', 'success');
            
            // Update status
            document.getElementById('correctionStatus').textContent = 'Under Review';
            document.getElementById('correctionStatus').className = 'status-badge status-submitted';
            
            // Disable submit button
            const submitBtn = document.querySelector('#correctionActions button');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitted - Under Review';
        }
    };
    
    fileInput.click();
}

// Download certificate
function downloadCertificate(format) {
    const user = JSON.parse(localStorage.getItem('user'));
    const project = resultsData.certificate.projectTitle;
    const supervisor = resultsData.certificate.supervisor;
    const grade = resultsData.finalGrade;
    const date = new Date(resultsData.certificate.issueDate).toLocaleDateString();
    
    if (format === 'pdf') {
        // In real app, generate PDF
        const content = `
            CERTIFICATE OF COMPLETION
            
            This certifies that
            
            ${user.name}
            
            has successfully completed the thesis project
            
            "${project}"
            
            under the supervision of
            
            ${supervisor}
            
            and has been awarded the grade of
            
            ${grade}
            
            Date: ${date}
            
            Thesis Coordination System
            Department of Computer Science & Engineering
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thesis-certificate-${user.studentId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('Certificate downloaded as text file', 'success');
    } else {
        showAlert('Image download feature will be implemented soon', 'info');
    }
}

// Share certificate
function shareCertificate() {
    if (navigator.share) {
        navigator.share({
            title: 'My Thesis Certificate',
            text: `I completed my thesis with grade ${resultsData.finalGrade}!`,
            url: window.location.href
        });
    } else {
        showAlert('Share functionality not available in this browser', 'info');
    }
}

// Submit appeal
function submitAppeal() {
    const appealReason = document.getElementById('appealReason').value.trim();
    
    if (!appealReason) {
        showAlert('Please provide a reason for appeal', 'error');
        return;
    }
    
    if (confirm('Submit grade appeal? This will be reviewed by the academic committee.')) {
        // In real app, submit to server
        document.getElementById('appealButton').disabled = true;
        document.getElementById('appealButton').textContent = 'Appeal Submitted';
        document.getElementById('appealStatus').textContent = 
            'Appeal submitted successfully. You will be notified of the decision.';
        document.getElementById('appealStatus').style.color = '#28a745';
        
        showAlert('Appeal submitted successfully', 'success');
    }
}

// Calculate grade based on marks
function calculateGrade(totalMarks, maxMarks = 130) {
    const percentage = (totalMarks / maxMarks) * 100;
    
    if (percentage >= 90) return { grade: "A+", remark: "Excellent - Distinction" };
    if (percentage >= 85) return { grade: "A", remark: "Very Good" };
    if (percentage >= 80) return { grade: "A-", remark: "Good" };
    if (percentage >= 75) return { grade: "B+", remark: "Satisfactory" };
    if (percentage >= 70) return { grade: "B", remark: "Acceptable" };
    if (percentage >= 65) return { grade: "B-", remark: "Pass" };
    if (percentage >= 60) return { grade: "C+", remark: "Conditional Pass" };
    if (percentage >= 55) return { grade: "C", remark: "Marginal Pass" };
    return { grade: "F", remark: "Fail - Needs Re-defense" };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadResults);