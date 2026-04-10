let currentRoom = null;
let socket = null;

async function loadChatRooms() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        displayChatRooms(data);
    } catch (error) {
        console.error('Load chat rooms error:', error);
    }
}

function displayChatRooms(rooms) {
    const roomsContainer = document.getElementById('chatRooms');
    
    let roomsHTML = '';
    
    if (rooms.teamChat) {
        roomsHTML += `
            <div class="chat-room-item" onclick="joinRoom('${rooms.teamChat._id}', 'team')">
                <h4>Team Chat</h4>
                <p>Members: ${rooms.teamChat.participants.map(p => p.name).join(', ')}</p>
            </div>
        `;
    }
    
    if (rooms.supervisorChat) {
        roomsHTML += `
            <div class="chat-room-item" onclick="joinRoom('${rooms.supervisorChat._id}', 'supervisor')">
                <h4>Supervisor Chat</h4>
                <p>Chat with your supervisor</p>
            </div>
        `;
    }
    
    roomsContainer.innerHTML = roomsHTML || '<p>No chat rooms available.</p>';
}

async function joinRoom(roomId, roomType) {
    currentRoom = roomId;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const messages = await response.json();
        displayMessages(messages);
        
        // Show chat interface
        document.getElementById('chatRoom').style.display = 'block';
        document.getElementById('chatHeader').textContent = 
            roomType === 'team' ? 'Team Chat' : 'Supervisor Chat';
        
        // Initialize WebSocket connection (simplified)
        initializeWebSocket(roomId);
    } catch (error) {
        console.error('Join room error:', error);
    }
}

function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    const user = JSON.parse(localStorage.getItem('user'));
    
    chatMessages.innerHTML = messages.map(msg => `
        <div class="message ${msg.senderId === user.id ? 'sent' : 'received'}">
            <div class="message-header">
                <strong>${msg.senderName}</strong>
                <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
            <div class="message-content">${msg.message}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentRoom) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/chat/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: currentRoom,
                message: message
            })
        });

        if (response.ok) {
            messageInput.value = '';
            // Refresh messages
            joinRoom(currentRoom, 'team');
        }
    } catch (error) {
        console.error('Send message error:', error);
    }
}

function initializeWebSocket(roomId) {
    // In a real implementation, use WebSocket for real-time chat
    // This is a simplified version
    console.log('WebSocket would connect to room:', roomId);
}

// Handle Enter key for sending messages
document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadChatRooms);