async function loadDashboard() {
    try {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Load statistics
        const statsResponse = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statsResponse.status === 401)