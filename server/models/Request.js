const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['team', 'supervisor'],
        required: true
    },
    fromStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    toSupervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    message: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Request', requestSchema);