const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'sms', 'push', 'system'],
        required: true
    },
    category: {
        type: String,
        enum: ['registration', 'deadline', 'reminder', 'announcement', 'result', 'warning'],
        required: true
    },
    variables: [{
        name: String,
        description: String,
        example: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);