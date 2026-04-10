const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    facultyId: {
        type: String,
        unique: true,
        sparse: true
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', null],
        default: null
    },
    researchAreas: [{
        type: String
    }],
    role: {
        type: String,
        enum: ['student', 'supervisor', 'admin', 'board'],
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    isTeamLeader: {
        type: Boolean,
        default: false
    },
    availability: {
        type: Boolean,
        default: true
    },
    maxTeams: {
        type: Number,
        default: 10
    },
    currentTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
     employeeId: {
        type: String,
        unique: true,
        sparse: true // Allows null for non-admin users
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for studentId/facultyId
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ facultyId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);