const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    evaluationType: {
        type: String,
        enum: ['defense', 'report', 'progress', 'final'],
        required: true
    },
    defenseType: {
        type: String,
        enum: ['pre-defense', 'final-defense']
    },
    criteria: [{
        name: String,
        description: String,
        maxScore: Number,
        score: Number,
        comments: String
    }],
    totalScore: {
        type: Number,
        min: 0,
        max: 100
    },
    overallComments: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    plagiarismScore: {
        percentage: Number,
        reportUrl: String,
        checkedAt: Date
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved'],
        default: 'draft'
    },
    submittedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);