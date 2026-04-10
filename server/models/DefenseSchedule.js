const mongoose = require('mongoose');

const defenseScheduleSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    defenseType: {
        type: String,
        enum: ['pre-defense', 'final-defense'],
        required: true
    },
    scheduledDate: {
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
    venue: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    panelMembers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['chair', 'member', 'external']
        }
    }],
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    marks: {
        supervisor: Number,
        panel1: Number,
        panel2: Number,
        total: Number
    },
    result: {
        type: String,
        enum: ['pass', 'fail', 'conditional_pass', 'pending']
    },
    comments: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    lastModifiedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for date queries
defenseScheduleSchema.index({ scheduledDate: 1 });
defenseScheduleSchema.index({ teamId: 1 });
defenseScheduleSchema.index({ status: 1 });

module.exports = mongoose.model('DefenseSchedule', defenseScheduleSchema);