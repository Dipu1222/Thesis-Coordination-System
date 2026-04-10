const mongoose = require('mongoose');

const supervisorRequestSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: false,
        sparse: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    priority: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('SupervisorRequest', supervisorRequestSchema);