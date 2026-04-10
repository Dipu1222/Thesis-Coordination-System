const mongoose = require('mongoose');

const annexSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    projectTitle: {
        type: String,
        required: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    objectives: {
        type: String,
        required: true
    },
    methodology: {
        type: String,
        required: true
    },
    expectedOutcome: {
        type: String
    },
    toolsTechnology: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_revision'],
        default: 'submitted'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewerComments: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Annex', annexSchema);