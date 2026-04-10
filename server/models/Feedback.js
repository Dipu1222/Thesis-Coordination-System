const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
    feedbackType: {
        type: String,
        enum: ['progress', 'document', 'meeting', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        fileName: String,
        filePath: String,
        uploadedAt: Date
    }],
    actionItems: [{
        item: String,
        completed: {
            type: Boolean,
            default: false
        },
        dueDate: Date
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acknowledgedBy: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        acknowledgedAt: Date
    }]
});

module.exports = mongoose.model('Feedback', feedbackSchema);