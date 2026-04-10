let allSupervisors = [];
let workloadChart = null;

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
        updateSupervisorStats(data);
        displaySupervisors(data);
        createWorkloadChart(data);
    } catch (error) {
        console.error('Load supervisors error:', error);
        showAlert('Failed to load supervisors', 'error');
    }
}

function updateSupervisorStats(supervisors) {
    const totalSupervisors = supervisors.length;
    const activeSupervisors = supervisors.filter(s => s.availableSlots > 0).length;
    const fullyBooked = supervisors.filter(s => s.availableSlots === 0).length;
    const availableSlots = supervisors.reduce((sum, s) => sum + s.availableSlots, 0);
    
    document.getElementById('totalSupervisorsStat').textContent = totalSupervisors;
    document.getElementById('activeSupervisors').textContent = activeSupervisors;
    document.getElementById('fullyBooked').textContent = fullyBooked;
    document.getElementById('availableSlots').textContent = availableSlots;
}

function displaySupervisors(supervisors) {
    const container = document.getElementById('supervisorsTable');
    
    if (supervisors.length === 0) {
        container.innerHTML = '<tr><td colspan="7">No supervisors found</td></tr>';
        return;
    }

    container.innerHTML = supervisors.map(sup => `
        <tr>
            <td>
                <strong>${sup.name}</strong><br>
                <small>${sup.email}</small>
            </td>
            <td>${sup.department}</td>
            <td>${sup.designation}</td>
            <td>
                <div style="max-width: 200px;">
                    ${sup.researchAreas.slice(0, 3).map(area => 
                        `<span class="badge badge-info" style="margin: 2px; display: inline-block;">${area}</span>`
                    ).join('')}
                    ${sup.researchAreas.length > 3 ? '...' : ''}
                </div>
            </td>
            <td>
                <span class="${sup.currentTeams >= sup.maxTeams ? 'badge badge-danger' : 'badge badge-success'}">
                    ${sup.currentTeams}/${sup.maxTeams}
                </span>
            </td>
            <td>
                <span class="status-indicator ${sup.availableSlots > 0 ? 'status-active' : 'status-inactive'}"></span>
                ${sup.availableSlots > 0 ? 'Available' : 'Fully Booked'}
                ${sup.availableSlots > 0 ? `(${sup.availableSlots} slots)` : ''}
            </td>
            <td class="action-buttons">
                <button onclick="showComingSoon()" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                    View
                </button>
                <button onclick="showComingSoon()" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                    Edit
                </button>
            </td>
        </tr>
    `).join('');
}

function createWorkloadChart(supervisors) {
    const ctx = document.getElementById('workloadChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (workloadChart) {
        workloadChart.destroy();
    }
    
    // Prepare data
    const labels = supervisors.map(s => s.name.split(' ')[0]); // First name only
    const currentTeams = supervisors.map(s => s.currentTeams);
    const maxTeams = supervisors.map(s => s.maxTeams);
    const availableSlots = supervisors.map(s => s.availableSlots);
    
    workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Teams',
                    data: currentTeams,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Available Slots',
                    data: availableSlots,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Teams'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Supervisors'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Supervisor Team Allocation'
                }
            }
        }
    });
}

function showComingSoon() {
    alert('This feature is coming soon!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadSupervisors);