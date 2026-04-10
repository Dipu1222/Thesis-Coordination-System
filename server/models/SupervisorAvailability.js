const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduleType: {
        type: String,
        enum: ['weekly', 'custom'],
        default: 'weekly'
    },
    weeklySchedule: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        slots: [{
            startTime: String,
            endTime: String,
            maxMeetings: Number
        }]
    }],
    customSlots: [{
        date: Date,
        startTime: String,
        endTime: String,
        maxMeetings: Number,
        bookedBy: [{
            teamId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Team'
            },
            bookedAt: Date
        }]
    }],
    bufferTime: {
        type: Number,
        default: 15 // minutes
    },
    meetingDuration: {
        type: Number,
        default: 30 // minutes
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SupervisorAvailability', availabilitySchema);