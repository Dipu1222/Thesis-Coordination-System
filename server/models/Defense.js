const mongoose = require('mongoose');

const defenseSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    projectTitle: {
        type: String
    },
    defenseType: {
        type: String,
        enum: ['pre-defense', 'final-defense'],
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    room: {
        type: String
    },
    panelMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requestedAt: {
        type: Date
    },
    approvedAt: {
        type: Date
    },
    marks: {
        supervisor: Number,
        panel1: Number,
        panel2: Number,
        total: Number
    },
    comments: {
        type: String
    },
    result: {
        type: String,
        enum: ['pass', 'fail', 'conditional_pass']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Defense', defenseSchema);