let currentDay = 0; // 0 = Sunday
let teams = [];
let availabilitySchedule = {};
let meetings = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

async function loadAvailability() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        // Load teams
        const teamsResponse = await fetch(`${API_BASE_URL}/supervisor/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        teams = await teamsResponse.json();
        
        // Load availability
        const availabilityResponse = await fetch(`${API_BASE_URL}/supervisor/availability`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (availabilityResponse.ok) {
            const schedule = await availabilityResponse.json();
            schedule.forEach(slot => {
                if (!availabilitySchedule[slot.dayOfWeek]) {
                    availabilitySchedule[slot.dayOfWeek] = [];
                }
                availabilitySchedule[slot.dayOfWeek].push(slot);
            });
        }
        
        // Load meetings
        const meetingsResponse = await fetch(`${API_BASE_URL}/supervisor/meetings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (meetingsResponse.ok) {
            meetings = await meetingsResponse.json();
        }
        
        updateAvailabilityStatus();
        displayTimeSlots();
        generateCalendar();
        displayUpcomingMeetings();
        
    } catch (error) {
        console.error('Load availability error:', error);
        showAlert('Failed to load availability data', 'error');
    }
}

function updateAvailabilityStatus() {
    const supervisor = JSON.parse(localStorage.getItem('supervisor'));
    const statusElement = document.getElementById('availabilityStatus');
    const toggleButton = document.getElementById('toggleAvailabilityBtn');
    
    if (supervisor.availability) {
        statusElement.textContent = 'Available';
        statusElement.className = 'badge badge-success';
        toggleButton.textContent = 'Set as Unavailable';
    } else {
        statusElement.textContent = 'Unavailable';
        statusElement.className = 'badge badge-danger';
        toggleButton.textContent = 'Set as Available';
    }
    
    // Calculate stats
    const today = new Date();
    const todayMeetings = meetings.filter(m => 
        new Date(m.meetingDate).toDateString() === today.toDateString()
    ).length;
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    
    const thisWeekMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.meetingDate);
        return meetingDate >= thisWeekStart && meetingDate <= thisWeekEnd;
    }).length;
    
    // Calculate available slots for today
    const dayOfWeek = today.getDay();
    const todaySlots = availabilitySchedule[dayOfWeek] || [];
    const bookedToday = meetings.filter(m => 
        new Date(m.meetingDate).toDateString() === today.toDateString()
    ).length;
    
    const availableToday = Math.max(0, (todaySlots.length * 4) - bookedToday); // Assuming 4 slots per time slot
    
    document.getElementById('meetingsToday').textContent = todayMeetings;
    document.getElementById('availableSlots').textContent = availableToday;
    document.getElementById('bookedThisWeek').textContent = thisWeekMeetings;
    document.getElementById('openSlots').textContent = Math.max(0, (Object.values(availabilitySchedule).flat().length * 4) - thisWeekMeetings);
    
    // Find next available time
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextAvailable = 'No availability today';
    for (const slot of todaySlots) {
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotStart = hours * 60 + minutes;
        
        if (slotStart > currentTime) {
            const nextHour = Math.floor(slotStart / 60);
            const nextMinute = slotStart % 60;
            nextAvailable = `Today, ${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
            break;
        }
    }
    
    document.getElementById('nextAvailable').textContent = nextAvailable;
}

function selectDay(day) {
    currentDay = day;
    
    // Update day buttons
    document.querySelectorAll('.day-button').forEach((btn, index) => {
        btn.classList.toggle('active', index === day);
    });
    
    // Update selected day display
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + (day - today.getDay()));
    
    document.getElementById('selectedDay').textContent = 
        `${days[day]}, ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    
    displayTimeSlots();
}

function displayTimeSlots() {
    const container = document.getElementById('timeSlots');
    const slots = availabilitySchedule[currentDay] || [];
    
    if (slots.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⏰</div>
                <p>No time slots configured for this day</p>
                <p class="text-muted">Set your availability schedule to create time slots</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = slots.map(slot => `
        <div class="time-slot">
            <div class="slot-time">
                ${slot.startTime} - ${slot.endTime}
            </div>
            <div>
                <small class="text-muted">
                    Duration: ${slot.slotDuration} min • 
                    Type: ${slot.meetingType} • 
                    Max: ${slot.maxSlotsPerDay} slots
                </small>
            </div>
            <div class="slot-actions">
                <button onclick="editSlot('${slot._id || slot.startTime}')" class="btn btn-sm btn-outline">
                    Edit
                </button>
                <button onclick="deleteSlot('${slot._id || slot.startTime}')" class="btn btn-sm btn-danger">
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

function generateSlots() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const slotDuration = parseInt(document.getElementById('slotDuration').value);
    const maxSlots = parseInt(document.getElementById('maxSlots').value);
    
    if (!startTime || !endTime) {
        showAlert('Please set start and end times', 'error');
        return;
    }
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    
    if (endTotal <= startTotal) {
        showAlert('End time must be after start time', 'error');
        return;
    }
    
    // Clear existing slots for this day
    if (!availabilitySchedule[currentDay]) {
        availabilitySchedule[currentDay] = [];
    }
    
    // Generate slots based on duration
    const totalDuration = endTotal - startTotal;
    const numSlots = Math.floor(totalDuration / slotDuration);
    
    for (let i = 0; i < numSlots; i++) {
        const slotStart = startTotal + (i * slotDuration);
        const slotEnd = slotStart + slotDuration;
        
        const startHour = Math.floor(slotStart / 60);
        const startMinute = slotStart % 60;
        const endHour = Math.floor(slotEnd / 60);
        const endMinute = slotEnd % 60;
        
        const slot = {
            startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
            endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
            slotDuration: slotDuration,
            meetingType: 'both',
            maxSlotsPerDay: maxSlots,
            isActive: true
        };
        
        availabilitySchedule[currentDay].push(slot);
    }
    
    // Check if should apply to other days
    const applyToAll = document.getElementById('applyToAll').checked;
    const includeWeekends = document.getElementById('includeWeekends').checked;
    
    if (applyToAll) {
        const daysToApply = includeWeekends ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
        
        daysToApply.forEach(day => {
            if (day !== currentDay) {
                availabilitySchedule[day] = availabilitySchedule[currentDay].map(slot => ({
                    ...slot
                }));
            }
        });
    }
    
    showAlert(`Generated ${numSlots} time slots`, 'success');
    displayTimeSlots();
}

function clearSlots() {
    if (!confirm('Clear all time slots for this day?')) return;
    
    availabilitySchedule[currentDay] = [];
    displayTimeSlots();
    showAlert('Time slots cleared', 'success');
}

async function saveAvailability() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        // Prepare schedule data
        const schedule = [];
        Object.entries(availabilitySchedule).forEach(([day, slots]) => {
            slots.forEach(slot => {
                schedule.push({
                    dayOfWeek: parseInt(day),
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    slotDuration: slot.slotDuration || 30,
                    meetingType: slot.meetingType || 'both',
                    maxSlotsPerDay: slot.maxSlotsPerDay || 8,
                    isActive: slot.isActive !== false
                });
            });
        });
        
        const response = await fetch(`${API_BASE_URL}/supervisor/availability`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ schedule })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Availability schedule saved successfully!', 'success');
            updateAvailabilityStatus();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Save availability error:', error);
        showAlert('Failed to save availability schedule', 'error');
    }
}

function generateCalendar() {
    const container = document.getElementById('calendarGrid');
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear container
    container.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        container.appendChild(header);
    });
    
    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay();
    
    // Get last day of month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get today's date
    const today = new Date();
    const isToday = (day) => {
        return day === today.getDate() && 
               currentMonth === today.getMonth() && 
               currentYear === today.getFullYear();
    };
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        container.appendChild(emptyCell);
    }
    
    // Add days of month
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        if (isToday(day)) {
            dayCell.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.style.fontWeight = '600';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        // Add events for this day
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay();
        
        // Add availability indicator
        if (availabilitySchedule[dayOfWeek]?.length > 0) {
            const availDiv = document.createElement('div');
            availDiv.className = 'calendar-event';
            availDiv.style.background = '#28a745';
            availDiv.textContent = 'Available';
            dayCell.appendChild(availDiv);
        }
        
        // Add meetings for this day
        const dayMeetings = meetings.filter(m => {
            const meetingDate = new Date(m.meetingDate);
            return meetingDate.getDate() === day && 
                   meetingDate.getMonth() === currentMonth &&
                   meetingDate.getFullYear() === currentYear;
        });
        
        dayMeetings.forEach(meeting => {
            const meetingDiv = document.createElement('div');
            meetingDiv.className = 'calendar-event';
            meetingDiv.style.background = '#007bff';
            meetingDiv.textContent = `${meeting.startTime} ${meeting.teamId?.teamName?.substring(0, 10) || 'Meeting'}`;
            meetingDiv.title = `${meeting.title} with ${meeting.teamId?.teamName || 'team'}`;
            dayCell.appendChild(meetingDiv);
        });
        
        container.appendChild(dayCell);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    generateCalendar();
}

function displayUpcomingMeetings() {
    const container = document.getElementById('upcomingMeetings');
    
    const upcoming = meetings
        .filter(m => new Date(m.meetingDate) >= new Date())
        .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No upcoming meetings</p>
                <p class="text-muted">Meetings scheduled with teams will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcoming.map(meeting => {
        const meetingDate = new Date(meeting.meetingDate);
        const statusClass = meeting.status === 'scheduled' ? 'badge-primary' : 
                          meeting.status === 'completed' ? 'badge-success' : 'badge-danger';
        
        return `
            <div class="meeting-item">
                <div class="meeting-header">
                    <div class="meeting-title">${meeting.title}</div>
                    <span class="badge ${statusClass}">${meeting.status}</span>
                </div>
                <div class="meeting-time">
                    ${meetingDate.toLocaleDateString()} at ${meeting.startTime} - ${meeting.endTime}
                </div>
                <div>${meeting.description || ''}</div>
                <div class="meeting-team">Team: ${meeting.teamId?.teamName || 'Unknown'}</div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button onclick="updateMeetingStatus('${meeting._id}', 'completed')" class="btn btn-sm btn-success">
                        Mark Completed
                    </button>
                    <button onclick="updateMeetingStatus('${meeting._id}', 'cancelled')" class="btn btn-sm btn-danger">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function scheduleMeeting() {
    // Load teams into dropdown
    const teamSelect = document.getElementById('meetingTeam');
    teamSelect.innerHTML = '<option value="">Choose a team</option>' +
        teams.map(team => `
            <option value="${team._id}">${team.teamName}</option>
        `).join('');
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('meetingDate').value = tomorrow.toISOString().split('T')[0];
    
    // Set default times
    document.getElementById('meetingStartTime').value = '10:00';
    document.getElementById('meetingEndTime').value = '11:00';
    
    document.getElementById('meetingModal').style.display = 'block';
}

function closeMeetingModal() {
    document.getElementById('meetingForm').reset();
    document.getElementById('meetingModal').style.display = 'none';
}

async function saveMeeting() {
    const teamId = document.getElementById('meetingTeam').value;
    const title = document.getElementById('meetingTitle').value.trim();
    const date = document.getElementById('meetingDate').value;
    const startTime = document.getElementById('meetingStartTime').value;
    const endTime = document.getElementById('meetingEndTime').value;
    const type = document.getElementById('meetingType').value;
    const location = document.getElementById('meetingLocation').value.trim() || 'Supervisor Office';
    const agenda = document.getElementById('meetingAgenda').value.split('\n').filter(a => a.trim());
    const description = document.getElementById('meetingDescription').value.trim();
    
    if (!teamId || !title || !date || !startTime || !endTime) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/meetings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teamId,
                title,
                meetingDate: date,
                startTime,
                endTime,
                meetingType: type,
                location,
                agenda,
                description
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Meeting scheduled successfully!', 'success');
            closeMeetingModal();
            
            // Add to local meetings array
            meetings.push({
                ...data.meeting,
                teamId: teams.find(t => t._id === teamId)
            });
            
            displayUpcomingMeetings();
            generateCalendar();
            updateAvailabilityStatus();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Save meeting error:', error);
        showAlert('Failed to schedule meeting', 'error');
    }
}

async function updateMeetingStatus(meetingId, status) {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/meetings/${meetingId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Meeting ${status}!`, 'success');
            
            // Update local meetings array
            const meetingIndex = meetings.findIndex(m => m._id === meetingId);
            if (meetingIndex > -1) {
                meetings[meetingIndex].status = status;
            }
            
            displayUpcomingMeetings();
            generateCalendar();
            updateAvailabilityStatus();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Update meeting error:', error);
        showAlert('Failed to update meeting', 'error');
    }
}

async function toggleAvailability() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/toggle-availability`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Availability ${data.availability ? 'enabled' : 'disabled'} successfully`, 'success');
            
            // Update local storage
            const supervisor = JSON.parse(localStorage.getItem('supervisor'));
            supervisor.availability = data.availability;
            localStorage.setItem('supervisor', JSON.stringify(supervisor));
            
            updateAvailabilityStatus();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Toggle availability error:', error);
        showAlert('Failed to toggle availability', 'error');
    }
}

function editSlot(slotId) {
    // Find and edit slot
    const slots = availabilitySchedule[currentDay] || [];
    const slot = slots.find(s => s._id === slotId || s.startTime === slotId);
    
    if (slot) {
        // Populate form with slot data
        document.getElementById('startTime').value = slot.startTime;
        document.getElementById('endTime').value = slot.endTime;
        document.getElementById('slotDuration').value = slot.slotDuration;
        document.getElementById('maxSlots').value = slot.maxSlotsPerDay;
        
        showAlert('Slot loaded for editing. Make changes and save.', 'info');
    }
}

function deleteSlot(slotId) {
    if (!confirm('Delete this time slot?')) return;
    
    const slots = availabilitySchedule[currentDay] || [];
    const index = slots.findIndex(s => s._id === slotId || s.startTime === slotId);
    
    if (index > -1) {
        slots.splice(index, 1);
        displayTimeSlots();
        showAlert('Time slot deleted', 'success');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAvailability);