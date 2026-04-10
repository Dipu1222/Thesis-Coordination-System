const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportDate: {
        type: Date,
        default: Date.now
    },
    overallProgress: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    technicalProgress: {
        type: Number,
        min: 0,
        max: 100
    },
    documentationProgress: {
        type: Number,
        min: 0,
        max: 100
    },
    strengths: [{
        type: String
    }],
    weaknesses: [{
        type: String
    }],
    recommendations: {
        type: String
    },
    nextMilestone: {
        type: String
    },
    nextMeetingDate: {
        type: Date
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
});

module.exports = mongoose.model('ProgressReport', progressReportSchema);