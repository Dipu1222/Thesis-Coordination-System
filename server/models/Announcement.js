const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'student', 'supervisor', 'urgent'],
        default: 'general'
    },
    targetGroups: [{
        type: String,
        enum: ['all', 'students', 'supervisors', 'board']
    }],
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Announcement', announcementSchema);