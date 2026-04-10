const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType'
    },
    userType: {
        type: String,
        enum: ['User', 'Admin']
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'warning'],
        default: 'success'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
systemLogSchema.index({ userId: 1, timestamp: -1 });
systemLogSchema.index({ module: 1, timestamp: -1 });
systemLogSchema.index({ action: 1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);