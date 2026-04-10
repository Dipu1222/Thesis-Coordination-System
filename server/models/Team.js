const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true
    },
    teamCode: {
        type: String,
        unique: true,
        required: true
    },
    teamLeader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingMembers: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }],
    maxMembers: {
        type: Number,
        default: 3
    },
    status: {
        type: String,
        enum: ['forming', 'formed', 'supervisor_assigned', 'project_started', 'completed'],
        default: 'forming'
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    supervisorStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    projectTitle: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique team code
teamSchema.pre('save', async function(next) {
    if (!this.teamCode) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.teamCode = code;
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema);