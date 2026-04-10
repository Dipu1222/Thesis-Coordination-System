const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
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
    slotDuration: {
        type: Number,
        default: 30
    },
    meetingType: {
        type: String,
        enum: ['consultation', 'meeting', 'both'],
        default: 'both'
    },
    maxSlotsPerDay: {
        type: Number,
        default: 8
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Availability', availabilitySchema);