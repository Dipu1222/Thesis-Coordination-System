async function loadAnnouncements() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/admin/announcements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAnnouncements(data);
        }
    } catch (error) {
        console.error('Load announcements error:', error);
    }
}

function displayAnnouncements(announcements) {
    const container = document.getElementById('announcementsTable');
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<tr><td colspan="5">No announcements</td></tr>';
        return;
    }
    
    container.innerHTML = announcements.map(a => `
        <tr>
            <td>${a.title}</td>
            <td>${a.type}</td>
            <td>${a.targetGroups.join(', ')}</td>
            <td>${new Date(a.publishDate).toLocaleDateString()}</td>
            <td>
                <span class="status-indicator ${a.isActive ? 'status-active' : 'status-inactive'}"></span>
                ${a.isActive ? 'Active' : 'Expired'}
            </td>
        </tr>
    `).join('');
}

function publishAnnouncement() {
    const title = document.getElementById('announcementTitle').value;
    const content = document.getElementById('announcementContent').value;
    const type = document.getElementById('announcementType').value;
    const targetGroups = Array.from(document.getElementById('targetGroups').selectedOptions).map(o => o.value);
    
    if (!title || !content) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    // In real app, send to server
    showAlert('Announcement published successfully!', 'success');
    document.getElementById('publishAnnouncementForm').reset();
}

document.addEventListener('DOMContentLoaded', loadAnnouncements);