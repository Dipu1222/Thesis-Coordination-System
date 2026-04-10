let currentDate = new Date();
let defenses = [];

// Load defense schedules
async function loadDefenseSchedules() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/student/defenses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        defenses = data;
        
        updateDefenseTable(data);
        generateCalendar();
        updateCountdownTimer();
    } catch (error) {
        console.error('Load defenses error:', error);
        showAlert('Failed to load defense schedules', 'error');
    }
}

// Update defenses table
function updateDefenseTable(defensesList) {
    const tableBody = document.getElementById('defensesTable');
    
    if (!defensesList || defensesList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">
                    No defense schedules available yet.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = defensesList.map(def => `
        <tr>
            <td>${new Date(def.scheduledDate).toLocaleDateString()}</td>
            <td>${def.scheduledTime}</td>
            <td>${def.defenseType}</td>
            <td>${def.venue}</td>
            <td>${def.projectTitle || 'N/A'}</td>
            <td><span class="status-badge status-${def.status}">${def.status}</span></td>
            <td>
                <button onclick="showDefenseDetails('${def._id}')" class="btn btn-outline" style="padding: 0.3rem 0.5rem;">
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

// Generate calendar
function generateCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    // Update month display
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Get first day of month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startingDay = firstDay.getDay();
    
    // Get last day of month
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get today's date
    const today = new Date();
    const isToday = (day) => {
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
    };
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        calendar.appendChild(emptyCell);
    }
    
    // Add days of month
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.innerHTML = `<strong>${day}</strong>`;
        
        if (isToday(day)) {
            dayCell.classList.add('today');
        }
        
        // Check if there are defenses on this day
        const defensesOnDay = defenses.filter(def => {
            const defenseDate = new Date(def.scheduledDate);
            return defenseDate.getDate() === day && 
                   defenseDate.getMonth() === currentDate.getMonth() &&
                   defenseDate.getFullYear() === currentDate.getFullYear();
        });
        
        if (defensesOnDay.length > 0) {
            dayCell.classList.add('has-defense');
            defensesOnDay.forEach(def => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'defense-event';
                eventDiv.textContent = `${def.scheduledTime} ${def.defenseType}`;
                eventDiv.onclick = (e) => {
                    e.stopPropagation();
                    showDefenseDetails(def._id);
                };
                dayCell.appendChild(eventDiv);
            });
        }
        
        calendar.appendChild(dayCell);
    }
}

// Change month
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    generateCalendar();
}

// Show defense details
function showDefenseDetails(defenseId) {
    const defense = defenses.find(d => d._id === defenseId);
    if (!defense) return;
    
    document.getElementById('defenseDetails').style.display = 'block';
    
    // Scroll to details
    document.getElementById('defenseDetails').scrollIntoView({ behavior: 'smooth' });
    
    // Update details
    document.getElementById('detailTitle').textContent = defense.projectTitle || 'Thesis Defense';
    document.getElementById('detailDate').textContent = new Date(defense.scheduledDate).toLocaleDateString();
    document.getElementById('detailTime').textContent = defense.scheduledTime;
    document.getElementById('detailType').textContent = defense.defenseType;
    document.getElementById('detailVenue').textContent = defense.venue;
    document.getElementById('detailRoom').textContent = defense.room || 'Main Conference Room';
    document.getElementById('detailDuration').textContent = '60 minutes';
    
    // Update panel members
    const panelContainer = document.getElementById('panelMembers');
    if (defense.panelMembers && defense.panelMembers.length > 0) {
        panelContainer.innerHTML = defense.panelMembers.map(member => `
            <div class="panel-member">
                <h6>${member.name}</h6>
                <p>Panel Member</p>
                <p>${member.department || 'Department of CSE'}</p>
            </div>
        `).join('');
    } else {
        panelContainer.innerHTML = '<p>Panel members will be announced soon.</p>';
    }
    
    // Update supervisor
    const user = JSON.parse(localStorage.getItem('user'));
    const teamInfo = JSON.parse(localStorage.getItem('teamInfo'));
    document.getElementById('detailSupervisor').textContent = 
        teamInfo?.supervisorId?.name || 'Supervisor will be assigned';
    
    // Update team members
    document.getElementById('detailTeam').textContent = 
        teamInfo?.members?.map(m => m.name).join(', ') || 'Team members';
}

// Close details
function closeDetails() {
    document.getElementById('defenseDetails').style.display = 'none';
}

// Download schedule
function downloadSchedule() {
    const details = {
        title: document.getElementById('detailTitle').textContent,
        date: document.getElementById('detailDate').textContent,
        time: document.getElementById('detailTime').textContent,
        venue: document.getElementById('detailVenue').textContent
    };
    
    const content = `
        Defense Schedule
        =================
        Project: ${details.title}
        Date: ${details.date}
        Time: ${details.time}
        Venue: ${details.venue}
        
        Instructions:
        1. Arrive 15 minutes early
        2. Bring student ID
        3. Prepare 15-minute presentation
        4. Dress formally
        
        Good luck!
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defense-schedule.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Schedule downloaded successfully', 'success');
}

// Set reminder
function setReminder() {
    if ('Notification' in window && Notification.permission === 'granted') {
        // Schedule notification for 1 day before defense
        const defenseDate = new Date(defenses[0]?.scheduledDate);
        const reminderTime = new Date(defenseDate.getTime() - 24 * 60 * 60 * 1000);
        
        const now = new Date();
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        if (timeUntilReminder > 0) {
            setTimeout(() => {
                new Notification('Defense Reminder', {
                    body: 'Your defense is scheduled for tomorrow!',
                    icon: '/icon.png'
                });
            }, timeUntilReminder);
            
            showAlert('Reminder set for 24 hours before defense', 'success');
        }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                setReminder();
            }
        });
    }
}

// Update countdown timer
function updateCountdownTimer() {
    if (defenses.length === 0) return;
    
    // Find next upcoming defense
    const now = new Date();
    const upcomingDefenses = defenses
        .filter(def => new Date(def.scheduledDate) > now)
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    if (upcomingDefenses.length === 0) return;
    
    const nextDefense = upcomingDefenses[0];
    const defenseDate = new Date(nextDefense.scheduledDate);
    
    // Update countdown display
    function updateTimer() {
        const now = new Date();
        const diff = defenseDate.getTime() - now.getTime();
        
        if (diff <= 0) {
            document.getElementById('timerDisplay').textContent = '00:00:00:00';
            document.getElementById('nextDefenseTitle').textContent = 'Defense is happening now!';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('timerDisplay').textContent = 
            `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('nextDefenseTitle').textContent = 
            `Next: ${nextDefense.defenseType} - ${new Date(nextDefense.scheduledDate).toLocaleDateString()}`;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDefenseSchedules);

// Request defense
async function requestDefense() {
    const defenseType = document.getElementById('defenseTypeSelect')?.value;
    const proposedDate = document.getElementById('proposedDate')?.value;
    const proposedTime = document.getElementById('proposedTime')?.value;
    const venue = document.getElementById('venue')?.value;

    if (!defenseType || !proposedDate || !proposedTime) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/student/defenses/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                defenseType,
                proposedDate,
                proposedTime,
                venue: venue || 'Main Conference Room'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Defense request submitted successfully! Awaiting supervisor approval.', 'success');
            // Close modal if exists
            if (document.getElementById('requestDefenseModal')) {
                document.getElementById('requestDefenseModal').style.display = 'none';
            }
            // Reload defenses
            setTimeout(() => loadDefenseSchedules(), 1500);
        } else {
            showAlert(data.message || 'Failed to request defense', 'error');
        }
    } catch (error) {
        console.error('Request defense error:', error);
        showAlert('Failed to send defense request', 'error');
    }
}