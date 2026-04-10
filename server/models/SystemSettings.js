const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    category: {
        type: String,
        enum: ['academic', 'email', 'system', 'notifications', 'deadlines'],
        required: true
    },
    description: {
        type: String
    },
    dataType: {
        type: String,
        enum: ['string', 'number', 'boolean', 'array', 'object', 'date'],
        default: 'string'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);