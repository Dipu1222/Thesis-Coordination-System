async function uploadDocument(event) {
    event.preventDefault();
    
    const documentType = document.getElementById('documentType').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a file', 'error');
        return;
    }

    // Check file type (PDF only)
    if (file.type !== 'application/pdf') {
        showAlert('Only PDF files are allowed', 'error');
        return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size);

    try {
        const token = localStorage.getItem('token');
        
        // Note: In a real implementation, you would upload to a server endpoint
        // that handles file storage. This is a simplified version.
        
        const response = await fetch(`${API_BASE_URL}/student/document/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Document uploaded successfully!', 'success');
            fileInput.value = '';
            loadDocuments();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Failed to upload document', 'error');
    }
}

async function loadDocuments() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/documents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        displayDocuments(data);
    } catch (error) {
        console.error('Load documents error:', error);
    }
}

function displayDocuments(documents) {
    const container = document.getElementById('documentsList');
    
    if (!documents || documents.length === 0) {
        container.innerHTML = '<tr><td colspan="5">No documents uploaded yet.</td></tr>';
        return;
    }

    container.innerHTML = documents.map(doc => `
        <tr>
            <td>${doc.documentType}</td>
            <td>${doc.fileName}</td>
            <td>${(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
            <td><span class="status-badge status-${doc.status}">${doc.status}</span></td>
            <td>${new Date(doc.submissionDate).toLocaleDateString()}</td>
            <td>
                ${doc.status === 'approved' ? 
                    `<span class="badge badge-success">Approved</span>` :
                doc.status === 'rejected' ? 
                    `<span class="badge badge-danger">Rejected</span>` :
                doc.status === 'needs_revision' ?
                    `<span class="badge badge-warning">Needs Revision</span>` :
                    `<span class="badge badge-info">Under Review</span>`
                }
            </td>
        </tr>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', uploadDocument);
    }
    
    loadDocuments();
});