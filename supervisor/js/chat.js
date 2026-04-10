let teams = [];
let selectedChat = null;
let messages = {};
let announcements = [];

// Mock WebSocket simulation
let mockWebSocket = {
    connect: function(teamId) {
        console.log(`Mock WebSocket connected to team: ${teamId}`);
        // In real implementation, connect to actual WebSocket server
        return {
            send: function(message) {
                console.log('Sending message:', message);
                // Simulate message delivery
                setTimeout(() => {
                    receiveMessage({
                        id: Date.now(),
                        sender: 'You',
                        content: message,
                        timestamp: new Date(),
                        type: 'sent'
                    });
                }, 100);
            },
            disconnect: function() {
                console.log('Mock WebSocket disconnected');
            }
        };
    }
};

async function loadTeamsForChat() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        const response = await fetch(`${API_BASE_URL}/supervisor/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        teams = await response.json();
        displayChatList();
        loadAnnouncements();
    } catch (error) {
        console.error('Load teams for chat error:', error);
        showAlert('Failed to load teams for chat', 'error');
    }
}

function displayChatList() {
    const container = document.getElementById('chatList');
    
    if (teams.length === 0) {
        container.innerHTML = `
            <div class="empty-chat">
                <div class="empty-chat-icon">💬</div>
                <p>No teams assigned yet</p>
                <p class="text-muted">Teams will appear here when assigned</p>
            </div>
        `;
        return;
    }

    container.innerHTML = teams.map(team => {
        const lastMessage = getLastMessage(team._id);
        const unreadCount = getUnreadCount(team._id);
        
        return `
            <div class="chat-item" onclick="selectChat('${team._id}')" id="chat-item-${team._id}">
                <div class="chat-item-header">
                    <div class="chat-item-name">${team.teamName}</div>
                    <div class="chat-item-time">
                        ${lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </div>
                </div>
                <div class="chat-item-preview">
                    ${lastMessage ? lastMessage.content : 'No messages yet'}
                </div>
                ${unreadCount > 0 ? `<div class="chat-unread">${unreadCount}</div>` : ''}
            </div>
        `;
    }).join('');
}

function selectChat(teamId) {
    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`chat-item-${teamId}`).classList.add('active');
    
    selectedChat = teams.find(t => t._id === teamId);
    
    // Show chat header
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';
    
    // Update chat info
    document.getElementById('chatTitle').textContent = selectedChat.teamName;
    document.getElementById('chatSubtitle').textContent = `${selectedChat.members?.length || 0} members`;
    document.getElementById('chatAvatar').textContent = selectedChat.teamName.charAt(0);
    
    // Load messages for this chat
    loadMessages(teamId);
}

function loadMessages(teamId) {
    // In real implementation, fetch messages from server
    // For now, use mock data
    if (!messages[teamId]) {
        messages[teamId] = [
            {
                id: 1,
                sender: 'Team Leader',
                content: 'Hello Professor, we have completed the initial research phase.',
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                type: 'received'
            },
            {
                id: 2,
                sender: 'You',
                content: 'Great! Please share your progress report by Friday.',
                timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
                type: 'sent'
            },
            {
                id: 3,
                sender: 'Team Member',
                content: 'We have uploaded the progress report. Please review it when you get a chance.',
                timestamp: new Date(Date.now() - 900000), // 15 minutes ago
                type: 'received'
            }
        ];
    }
    
    displayMessages(teamId);
}

function displayMessages(teamId) {
    const container = document.getElementById('chatMessages');
    const chatMessages = messages[teamId] || [];
    
    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-chat">
                <div class="empty-chat-icon">💭</div>
                <p>No messages yet</p>
                <p class="text-muted">Start the conversation with ${selectedChat?.teamName || 'this team'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = chatMessages.map(msg => `
        <div class="message message-${msg.type}">
            <div class="message-header">
                <div class="message-sender">${msg.sender}</div>
                <div class="message-time">
                    ${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
            <div class="message-content">${msg.content}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function getLastMessage(teamId) {
    const chatMessages = messages[teamId] || [];
    return chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
}

function getUnreadCount(teamId) {
    // In real implementation, count unread messages
    return 0;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !selectedChat) return;
    
    // Add message to UI immediately
    const message = {
        id: Date.now(),
        sender: 'You',
        content: content,
        timestamp: new Date(),
        type: 'sent'
    };
    
    if (!messages[selectedChat._id]) {
        messages[selectedChat._id] = [];
    }
    
    messages[selectedChat._id].push(message);
    displayMessages(selectedChat._id);
    
    // Clear input
    input.value = '';
    
    // In real implementation, send via WebSocket
    console.log(`Sending message to team ${selectedChat._id}: ${content}`);
    
    // Simulate response after 2 seconds
    setTimeout(() => {
        const responses = [
            "Thanks for the update!",
            "We'll work on that.",
            "Can we discuss this in our next meeting?",
            "Understood, will proceed accordingly."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        receiveMessage({
            id: Date.now(),
            sender: 'Team Member',
            content: randomResponse,
            timestamp: new Date(),
            type: 'received'
        });
    }, 2000);
}

function receiveMessage(message) {
    if (!selectedChat || !messages[selectedChat._id]) return;
    
    messages[selectedChat._id].push(message);
    displayMessages(selectedChat._id);
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function loadAnnouncements() {
    try {
        const token = localStorage.getItem('supervisor_token');
        
        // In real implementation, fetch announcements from server
        // For now, use mock data
        announcements = [
            {
                id: 1,
                title: 'Important: Progress Report Deadline',
                content: 'All progress reports must be submitted by Friday, 5 PM.',
                date: new Date(Date.now() - 86400000), // 1 day ago
                priority: 'important',
                teams: teams.map(t => t._id)
            },
            {
                id: 2,
                title: 'Meeting Schedule Update',
                content: 'Next week\'s meetings have been rescheduled. Please check your calendar.',
                date: new Date(Date.now() - 172800000), // 2 days ago
                priority: 'normal',
                teams: [teams[0]?._id]
            }
        ];
        
        displayAnnouncements();
    } catch (error) {
        console.error('Load announcements error:', error);
    }
}

function displayAnnouncements() {
    const container = document.getElementById('announcementsList');
    
    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📢</div>
                <p>No announcements yet</p>
                <p class="text-muted">Create announcements to communicate with all your teams</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = announcements.map(announcement => {
        const priorityClass = announcement.priority === 'urgent' ? 'badge-danger' : 
                            announcement.priority === 'important' ? 'badge-warning' : 'badge-info';
        
        return `
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-header">
                    <h4 style="margin: 0;">${announcement.title}</h4>
                    <span class="badge ${priorityClass}">${announcement.priority}</span>
                </div>
                <div style="padding: 1rem;">
                    <p>${announcement.content}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <small class="text-muted">
                            Sent: ${new Date(announcement.date).toLocaleDateString()}
                        </small>
                        <button onclick="deleteAnnouncement(${announcement.id})" class="btn btn-sm btn-outline">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openAnnouncementModal() {
    // Load teams checklist
    const checklist = document.getElementById('teamsChecklist');
    checklist.innerHTML = teams.map(team => `
        <div style="margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" value="${team._id}" checked>
                ${team.teamName}
            </label>
        </div>
    `).join('');
    
    document.getElementById('announcementModal').style.display = 'block';
}

function closeAnnouncementModal() {
    document.getElementById('announcementForm').reset();
    document.getElementById('announcementModal').style.display = 'none';
}

function submitAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const priority = document.getElementById('announcementPriority').value;
    
    if (!title || !content) {
        showAlert('Please fill all required fields', 'error');
        return;
    }
    
    // Get selected teams
    const selectedTeams = Array.from(document.querySelectorAll('#teamsChecklist input:checked'))
        .map(input => input.value);
    
    if (selectedTeams.length === 0) {
        showAlert('Please select at least one team', 'error');
        return;
    }
    
    // Create new announcement
    const newAnnouncement = {
        id: announcements.length + 1,
        title,
        content,
        date: new Date(),
        priority,
        teams: selectedTeams
    };
    
    announcements.unshift(newAnnouncement);
    
    showAlert('Announcement sent successfully!', 'success');
    closeAnnouncementModal();
    displayAnnouncements();
}

function deleteAnnouncement(announcementId) {
    if (!confirm('Delete this announcement?')) return;
    
    const index = announcements.findIndex(a => a.id === announcementId);
    if (index > -1) {
        announcements.splice(index, 1);
        displayAnnouncements();
        showAlert('Announcement deleted successfully', 'success');
    }
}

function createAnnouncement() {
    openAnnouncementModal();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadTeamsForChat);