const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema({
    academicYear: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        enum: ['spring', 'summer', 'fall'],
        required: true
    },
    semesterNumber: {
        type: Number,
        required: true
    },
    events: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        eventType: {
            type: String,
            enum: ['registration', 'team_formation', 'supervisor_selection', 
                   'annex_submission', 'midterm', 'final_defense', 'result_publish',
                   'holiday', 'meeting', 'other'],
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        isDeadline: {
            type: Boolean,
            default: false
        },
        notifyBeforeDays: {
            type: Number,
            default: 7
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming'
        }
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
    }
});

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);