const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');

// Get chat rooms for student
router.get('/rooms', auth, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const student = await User.findById(studentId);

        // Get team chat room
        const teamChat = await Chat.findOne({
            roomType: 'team',
            participants: studentId
        }).populate('participants', 'name');

        // Get supervisor chat room if supervisor assigned
        let supervisorChat = null;
        if (student.teamId) {
            supervisorChat = await Chat.findOne({
                roomType: 'supervisor',
                participants: studentId
            }).populate('participants', 'name');
        }

        res.json({
            teamChat,
            supervisorChat
        });
    } catch (error) {
        console.error('Chat rooms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat messages
router.get('/messages/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        
        const chat = await Chat.findById(roomId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Check if user is participant (compare as strings)
        const isParticipant = chat.participants.some(p => p.toString() === req.user.userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(chat.messages);
    } catch (error) {
        console.error('Messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send message
router.post('/send', auth, async (req, res) => {
    try {
        const { roomId, message } = req.body;
        const senderId = req.user.userId;
        const sender = await User.findById(senderId);

        const chat = await Chat.findById(roomId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Add message
        chat.messages.push({
            senderId,
            senderName: sender.name,
            message,
            readBy: [senderId]
        });

        chat.lastActivity = new Date();
        await chat.save();

        res.json({ 
            message: 'Message sent successfully',
            newMessage: chat.messages[chat.messages.length - 1]
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;