const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    researchAreas: [{
        type: String
    }],
    maxTeams: {
        type: Number,
        default: 10
    },
    currentTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    availability: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Supervisor', supervisorSchema);