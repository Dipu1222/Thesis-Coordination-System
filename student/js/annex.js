async function submitAnnexForm(event) {
    event.preventDefault();
    
    const formData = {
        projectTitle: document.getElementById('projectTitle').value,
        problemStatement: document.getElementById('problemStatement').value,
        objectives: document.getElementById('objectives').value,
        methodology: document.getElementById('methodology').value,
        expectedOutcome: document.getElementById('expectedOutcome').value,
        toolsTechnology: document.getElementById('toolsTechnology').value
    };

    // Validation
    if (!formData.projectTitle || !formData.problemStatement || !formData.objectives || !formData.methodology) {
        showAlert('Please fill all required fields', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/annex/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Annex form submitted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Annex submission error:', error);
        showAlert('Failed to submit annex form', 'error');
    }
}

// Add event listener
document.addEventListener('DOMContentLoaded', () => {
    const annexForm = document.getElementById('annexForm');
    if (annexForm) {
        annexForm.addEventListener('submit', submitAnnexForm);
    }
});