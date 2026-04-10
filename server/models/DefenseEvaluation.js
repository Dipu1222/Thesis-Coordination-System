const mongoose = require('mongoose');

const defenseEvaluationSchema = new mongoose.Schema({
    defenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Defense',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    evaluationDate: {
        type: Date,
        default: Date.now
    },
    // Presentation Skills (20%)
    presentationClarity: { type: Number, min: 0, max: 10 },
    timeManagement: { type: Number, min: 0, max: 5 },
    communicationSkills: { type: Number, min: 0, max: 5 },
    
    // Technical Content (40%)
    technicalDepth: { type: Number, min: 0, max: 15 },
    innovation: { type: Number, min: 0, max: 10 },
    methodology: { type: Number, min: 0, max: 15 },
    
    // Q&A Performance (20%)
    questionUnderstanding: { type: Number, min: 0, max: 10 },
    answerQuality: { type: Number, min: 0, max: 10 },
    
    // Overall (20%)
    overallPerformance: { type: Number, min: 0, max: 10 },
    professionalism: { type: Number, min: 0, max: 10 },
    
    totalScore: {
        type: Number,
        min: 0,
        max: 100
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'F']
    },
    comments: {
        type: String
    },
    strengths: [{
        type: String
    }],
    areasForImprovement: [{
        type: String
    }],
    recommendation: {
        type: String,
        enum: ['pass', 'conditional_pass', 'fail', 'needs_revision']
    }
});

module.exports = mongoose.model('DefenseEvaluation', defenseEvaluationSchema);