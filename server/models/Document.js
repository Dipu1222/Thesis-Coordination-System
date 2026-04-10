const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    documentType: {
        type: String,
        enum: ['proposal', 'midterm', 'final', 'presentation', 'other'],
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision'],
        default: 'uploaded'
    },
    reviewerComments: {
        type: String
    },
    marks: {
        type: Number
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Track who uploaded the document
documentSchema.add({
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Document', documentSchema);