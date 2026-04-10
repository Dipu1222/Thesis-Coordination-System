const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    meetingDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    meetingType: {
        type: String,
        enum: ['consultation', 'progress_review', 'other'],
        default: 'consultation'
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    location: {
        type: String,
        default: 'Supervisor Office'
    },
    agenda: [{
        type: String
    }],
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);