const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Team = require('../models/Team');
const SupervisorRequest = require('../models/SupervisorRequest');
const Annex = require('../models/Annex');
const Document = require('../models/Document');
const Milestone = require('../models/Milestone');
const ProgressReport = require('../models/ProgressReport');
const Defense = require('../models/Defense');
const DefenseEvaluation = require('../models/DefenseEvaluation');
const Availability = require('../models/Availability');
const Meeting = require('../models/Meeting');

// Middleware to check if user is supervisor
const isSupervisor = (req, res, next) => {
    if (req.user.role !== 'supervisor') {
        return res.status(403).json({ message: 'Access denied. Supervisor only.' });
    }
    next();
};

// Supervisor Registration
router.post('/register', async (req, res) => {
    try {
        const { name, facultyId, email, password, department, designation, researchAreas } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ facultyId }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Supervisor with this ID or email already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new supervisor
        const supervisor = new User({
            name,
            facultyId,
            email,
            password: hashedPassword,
            department,
            designation,
            researchAreas: researchAreas || [],
            role: 'supervisor',
            availability: true,
            maxTeams: 10
        });

        await supervisor.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: supervisor._id, role: supervisor.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Supervisor registration successful',
            token,
            supervisor: {
                id: supervisor._id,
                name: supervisor.name,
                facultyId: supervisor.facultyId,
                email: supervisor.email,
                department: supervisor.department,
                designation: supervisor.designation,
                researchAreas: supervisor.researchAreas,
                role: supervisor.role
            }
        });
    } catch (error) {
        console.error('Supervisor registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Supervisor Login
router.post('/login', async (req, res) => {
    try {
        const { facultyId, password } = req.body;

        // Find supervisor
        const supervisor = await User.findOne({ facultyId, role: 'supervisor' });
        if (!supervisor) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, supervisor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Get assigned teams
        const teams = await Team.find({ supervisorId: supervisor._id })
            .populate('members', 'name studentId')
            .populate('teamLeader', 'name');

        // Get pending requests
        const pendingRequests = await SupervisorRequest.find({ 
            supervisorId: supervisor._id,
            status: 'pending'
        }).populate('teamId');

        // Create JWT token
        const token = jwt.sign(
            { userId: supervisor._id, role: supervisor.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            supervisor: {
                id: supervisor._id,
                name: supervisor.name,
                facultyId: supervisor.facultyId,
                email: supervisor.email,
                department: supervisor.department,
                designation: supervisor.designation,
                researchAreas: supervisor.researchAreas,
                availability: supervisor.availability,
                maxTeams: supervisor.maxTeams,
                currentTeams: supervisor.currentTeams,
                role: supervisor.role
            },
            teams,
            pendingRequests
        });
    } catch (error) {
        console.error('Supervisor login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get supervisor dashboard data
router.get('/dashboard', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        // Get supervisor details
        const supervisor = await User.findById(supervisorId);
        
        // Get assigned teams with details
        const teams = await Team.find({ supervisorId: supervisor._id })
            .populate('members', 'name studentId email')
            .populate('teamLeader', 'name studentId')
            .sort({ createdAt: -1 });
        
        // Get pending team requests
        const pendingRequests = await SupervisorRequest.find({
            supervisorId: supervisor._id,
            status: 'pending'
        })
        .populate({
            path: 'teamId',
            populate: [
                { path: 'members', select: 'name studentId cgpa' },
                { path: 'teamLeader', select: 'name studentId' }
            ]
        })
        .sort({ requestedAt: -1 });
        
        // Get pending annex forms
        const pendingAnnexes = await Annex.find({
            supervisorId: supervisor._id,
            status: 'submitted'
        })
        .populate('teamId', 'teamName members')
        .sort({ submittedAt: -1 });
        
        // Get pending documents for review
        const pendingDocuments = await Document.find({
            status: 'uploaded',
            teamId: { $in: teams.map(t => t._id) }
        })
        .populate('teamId', 'teamName')
        .sort({ submissionDate: -1 })
        .limit(10);
        
        // Get upcoming defenses
        const upcomingDefenses = await Defense.find({
            supervisorId: supervisor._id,
            status: 'scheduled',
            scheduledDate: { $gte: new Date() }
        })
        .populate('teamId', 'teamName')
        .sort({ scheduledDate: 1 })
        .limit(5);
        
        // Get recent meetings
        const recentMeetings = await Meeting.find({
            supervisorId: supervisor._id,
            meetingDate: { $gte: new Date() }
        })
        .populate('teamId', 'teamName')
        .sort({ meetingDate: 1 })
        .limit(5);
        
        // Get notifications
        const notifications = [
            {
                id: 1,
                type: 'request',
                message: `You have ${pendingRequests.length} pending team requests`,
                date: new Date(),
                read: false
            },
            {
                id: 2,
                type: 'document',
                message: `You have ${pendingDocuments.length} documents pending review`,
                date: new Date(),
                read: false
            }
        ];
        
        // Calculate statistics
        const stats = {
            totalTeams: teams.length,
            pendingRequests: pendingRequests.length,
            pendingAnnexes: pendingAnnexes.length,
            pendingDocuments: pendingDocuments.length,
            upcomingDefenses: upcomingDefenses.length,
            availability: supervisor.availability ? 'Available' : 'Unavailable'
        };
        
        res.json({
            supervisor: {
                name: supervisor.name,
                facultyId: supervisor.facultyId,
                department: supervisor.department,
                designation: supervisor.designation,
                researchAreas: supervisor.researchAreas,
                availability: supervisor.availability,
                maxTeams: supervisor.maxTeams,
                currentTeams: teams.length
            },
            teams,
            pendingRequests,
            pendingAnnexes,
            pendingDocuments,
            upcomingDefenses,
            recentMeetings,
            notifications,
            stats
        });
    } catch (error) {
        console.error('Supervisor dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get team requests
router.get('/team-requests', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        const requests = await SupervisorRequest.find({ supervisorId })
            .populate({
                path: 'teamId',
                populate: [
                    { path: 'members', select: 'name studentId cgpa department' },
                    { path: 'teamLeader', select: 'name studentId' }
                ]
            })
            .sort({ requestedAt: -1 });
        
        res.json(requests);
    } catch (error) {
        console.error('Get team requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Respond to team request
router.post('/team-requests/respond', auth, isSupervisor, async (req, res) => {
    try {
        const { requestId, action, rejectionReason } = req.body;
        const supervisorId = req.user.userId;
        
        const request = await SupervisorRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Check if request belongs to this supervisor
        if (request.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already responded' });
        }
        
        const supervisor = await User.findById(supervisorId);
        const team = await Team.findById(request.teamId);
        
        if (action === 'accept') {
            // Check if supervisor has reached max teams
            if (supervisor.currentTeams.length >= supervisor.maxTeams) {
                return res.status(400).json({ 
                    message: `Cannot accept request. You have reached your maximum capacity of ${supervisor.maxTeams} teams.` 
                });
            }
            
            request.status = 'accepted';
            request.respondedAt = new Date();
            await request.save();
            
            // Assign supervisor to team
            team.supervisorId = supervisorId;
            team.supervisorStatus = 'accepted';
            team.status = 'supervisor_assigned';
            await team.save();
            
            // Add team to supervisor's current teams
            await User.findByIdAndUpdate(supervisorId, {
                $push: { currentTeams: team._id }
            });
            
            // Update other pending requests for this team
            await SupervisorRequest.updateMany(
                { 
                    teamId: team._id, 
                    _id: { $ne: requestId },
                    status: 'pending' 
                },
                { 
                    status: 'rejected',
                    respondedAt: new Date(),
                    rejectionReason: 'Another supervisor accepted this team'
                }
            );
            
            res.json({ 
                message: 'Team request accepted successfully',
                team 
            });
            
        } else if (action === 'reject') {
            request.status = 'rejected';
            request.rejectionReason = rejectionReason || 'Not available';
            request.respondedAt = new Date();
            await request.save();
            
            res.json({ 
                message: 'Team request rejected' 
            });
        }
    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get assigned teams
router.get('/teams', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        const teams = await Team.find({ supervisorId: supervisorId })
            .populate('members', 'name studentId email cgpa department')
            .populate('teamLeader', 'name studentId')
            .sort({ createdAt: -1 });
        
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get team details
router.get('/teams/:teamId', auth, isSupervisor, async (req, res) => {
    try {
        const { teamId } = req.params;
        const supervisorId = req.user.userId;
        
        const team = await Team.findOne({ 
            _id: teamId, 
            supervisorId: supervisorId 
        })
        .populate('members', 'name studentId email cgpa department semester')
        .populate('teamLeader', 'name studentId email');
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        // Get annex form
        const annex = await Annex.findOne({ teamId });
        
        // Get documents
        const documents = await Document.find({ teamId })
            .sort({ submissionDate: -1 });
        
        // Get milestones
        const milestones = await Milestone.find({ teamId })
            .sort({ dueDate: 1 });
        
        // Get progress reports
        const progressReports = await ProgressReport.find({ teamId })
            .sort({ reportDate: -1 });
        
        // Get meetings
        const meetings = await Meeting.find({ teamId })
            .sort({ meetingDate: 1 });
        
        res.json({
            team,
            annex,
            documents,
            milestones,
            progressReports,
            meetings
        });
    } catch (error) {
        console.error('Get team details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Review annex form
router.post('/annex/review', auth, isSupervisor, async (req, res) => {
    try {
        const { annexId, action, comments } = req.body;
        const supervisorId = req.user.userId;
        
        const annex = await Annex.findById(annexId);
        if (!annex) {
            return res.status(404).json({ message: 'Annex form not found' });
        }
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(annex.teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (action === 'approve') {
            annex.status = 'approved';
            annex.reviewerComments = comments;
            
            // Update team status
            team.projectTitle = annex.projectTitle;
            await team.save();
            
        } else if (action === 'reject') {
            annex.status = 'rejected';
            annex.reviewerComments = comments;
        } else if (action === 'request_revision') {
            annex.status = 'needs_revision';
            annex.reviewerComments = comments;
        }
        
        await annex.save();
        
        res.json({ 
            message: `Annex form ${action}d successfully`,
            annex 
        });
    } catch (error) {
        console.error('Review annex error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Review document
router.post('/documents/review', auth, isSupervisor, async (req, res) => {
    try {
        const { documentId, action, comments, marks } = req.body;
        const supervisorId = req.user.userId;
        
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(document.teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (action === 'approve') {
            document.status = 'approved';
            document.reviewerComments = comments;
            document.marks = marks;
            document.reviewedBy = supervisorId;
            
        } else if (action === 'reject') {
            document.status = 'rejected';
            document.reviewerComments = comments;
            document.reviewedBy = supervisorId;
            
        } else if (action === 'request_revision') {
            document.status = 'needs_revision';
            document.reviewerComments = comments;
            document.reviewedBy = supervisorId;
        }
        
        await document.save();
        
        res.json({ 
            message: `Document ${action}d successfully`,
            document 
        });
    } catch (error) {
        console.error('Review document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create milestone
router.post('/milestones', auth, isSupervisor, async (req, res) => {
    try {
        const { teamId, title, description, dueDate } = req.body;
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const milestone = new Milestone({
            teamId,
            title,
            description,
            dueDate,
            createdBy: supervisorId
        });
        
        await milestone.save();
        
        res.json({ 
            message: 'Milestone created successfully',
            milestone 
        });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update milestone status
router.put('/milestones/:milestoneId', auth, isSupervisor, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { status, comments } = req.body;
        const supervisorId = req.user.userId;
        
        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }
        
        // Check if supervisor created this milestone
        if (milestone.createdBy.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        milestone.status = status;
        if (comments) {
            milestone.supervisorComments = comments;
        }
        
        if (status === 'completed') {
            milestone.completionDate = new Date();
        }
        
        await milestone.save();
        
        res.json({ 
            message: 'Milestone updated successfully',
            milestone 
        });
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create progress report
router.post('/progress-reports', auth, isSupervisor, async (req, res) => {
    try {
        const { 
            teamId, 
            overallProgress, 
            technicalProgress, 
            documentationProgress, 
            strengths, 
            weaknesses, 
            recommendations, 
            nextMilestone, 
            nextMeetingDate, 
            rating 
        } = req.body;
        
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const progressReport = new ProgressReport({
            teamId,
            supervisorId,
            overallProgress,
            technicalProgress,
            documentationProgress,
            strengths: strengths || [],
            weaknesses: weaknesses || [],
            recommendations,
            nextMilestone,
            nextMeetingDate,
            rating
        });
        
        await progressReport.save();
        
        res.json({ 
            message: 'Progress report created successfully',
            progressReport 
        });
    } catch (error) {
        console.error('Create progress report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit defense evaluation
router.post('/defense-evaluations', auth, isSupervisor, async (req, res) => {
    try {
        const { 
            defenseId,
            teamId,
            presentationClarity,
            timeManagement,
            communicationSkills,
            technicalDepth,
            innovation,
            methodology,
            questionUnderstanding,
            answerQuality,
            overallPerformance,
            professionalism,
            comments,
            strengths,
            areasForImprovement,
            recommendation
        } = req.body;
        
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Calculate total score (weights can be adjusted)
        const totalScore = 
            (presentationClarity || 0) +
            (timeManagement || 0) +
            (communicationSkills || 0) +
            (technicalDepth || 0) +
            (innovation || 0) +
            (methodology || 0) +
            (questionUnderstanding || 0) +
            (answerQuality || 0) +
            (overallPerformance || 0) +
            (professionalism || 0);
        
        // Determine grade
        let grade;
        if (totalScore >= 90) grade = 'A+';
        else if (totalScore >= 85) grade = 'A';
        else if (totalScore >= 80) grade = 'A-';
        else if (totalScore >= 75) grade = 'B+';
        else if (totalScore >= 70) grade = 'B';
        else if (totalScore >= 65) grade = 'B-';
        else if (totalScore >= 60) grade = 'C+';
        else if (totalScore >= 55) grade = 'C';
        else grade = 'F';
        
        const evaluation = new DefenseEvaluation({
            defenseId,
            teamId,
            supervisorId,
            presentationClarity,
            timeManagement,
            communicationSkills,
            technicalDepth,
            innovation,
            methodology,
            questionUnderstanding,
            answerQuality,
            overallPerformance,
            professionalism,
            totalScore,
            grade,
            comments,
            strengths: strengths || [],
            areasForImprovement: areasForImprovement || [],
            recommendation
        });
        
        await evaluation.save();
        
        res.json({ 
            message: 'Defense evaluation submitted successfully',
            evaluation 
        });
    } catch (error) {
        console.error('Submit defense evaluation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Manage availability
router.post('/availability', auth, isSupervisor, async (req, res) => {
    try {
        const { schedule } = req.body;
        const supervisorId = req.user.userId;
        
        // Delete existing availability
        await Availability.deleteMany({ supervisorId });
        
        // Create new availability schedule
        const availabilitySlots = schedule.map(slot => ({
            supervisorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration || 30,
            meetingType: slot.meetingType || 'both',
            maxSlotsPerDay: slot.maxSlotsPerDay || 8,
            isActive: slot.isActive !== false
        }));
        
        await Availability.insertMany(availabilitySlots);
        
        res.json({ 
            message: 'Availability updated successfully',
            schedule: availabilitySlots 
        });
    } catch (error) {
        console.error('Manage availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get availability
router.get('/availability', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        const availability = await Availability.find({ supervisorId })
            .sort({ dayOfWeek: 1, startTime: 1 });
        
        res.json(availability);
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get meetings
router.get('/meetings', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        const meetings = await Meeting.find({ supervisorId })
            .populate('teamId', 'teamName')
            .sort({ meetingDate: 1 });
        
        res.json(meetings);
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create meeting
router.post('/meetings', auth, isSupervisor, async (req, res) => {
    try {
        const { teamId, title, description, meetingDate, startTime, endTime, meetingType, location, agenda } = req.body;
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const meeting = new Meeting({
            supervisorId,
            teamId,
            title,
            description,
            meetingDate,
            startTime,
            endTime,
            meetingType: meetingType || 'consultation',
            location: location || 'Supervisor Office',
            agenda: agenda || [],
            createdBy: supervisorId
        });
        
        await meeting.save();
        
        res.json({ 
            message: 'Meeting scheduled successfully',
            meeting 
        });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update meeting status
router.put('/meetings/:meetingId', auth, isSupervisor, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status, notes } = req.body;
        const supervisorId = req.user.userId;
        
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        // Check if supervisor owns this meeting
        if (meeting.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        meeting.status = status;
        if (notes) {
            meeting.notes = notes;
        }
        
        await meeting.save();
        
        res.json({ 
            message: 'Meeting updated successfully',
            meeting 
        });
    } catch (error) {
        console.error('Update meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle availability status
router.put('/toggle-availability', auth, isSupervisor, async (req, res) => {
    try {
        const supervisorId = req.user.userId;
        
        const supervisor = await User.findById(supervisorId);
        supervisor.availability = !supervisor.availability;
        await supervisor.save();
        
        res.json({ 
            message: `Availability ${supervisor.availability ? 'enabled' : 'disabled'} successfully`,
            availability: supervisor.availability 
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate progress report
router.get('/progress-report/:teamId', auth, isSupervisor, async (req, res) => {
    try {
        const { teamId } = req.params;
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Get all data for the report
        const [teamDetails, annex, documents, milestones, progressReports, meetings] = await Promise.all([
            Team.findById(teamId).populate('members', 'name studentId cgpa'),
            Annex.findOne({ teamId }),
            Document.find({ teamId }),
            Milestone.find({ teamId }),
            ProgressReport.find({ teamId }).sort({ reportDate: -1 }),
            Meeting.find({ teamId }).sort({ meetingDate: -1 })
        ]);
        
        // Calculate statistics
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const totalMilestones = milestones.length;
        const overdueMilestones = milestones.filter(m => m.status === 'overdue').length;
        
        const latestProgress = progressReports.length > 0 ? progressReports[0] : null;
        
        res.json({
            team: teamDetails,
            annex,
            documents,
            milestones: {
                list: milestones,
                stats: {
                    total: totalMilestones,
                    completed: completedMilestones,
                    overdue: overdueMilestones,
                    completionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones * 100) : 0
                }
            },
            progressReports,
            meetings,
            latestProgress,
            summary: {
                teamStrength: teamDetails.members.length,
                projectStatus: teamDetails.status,
                lastMeeting: meetings.length > 0 ? meetings[0].meetingDate : null,
                nextDeadline: milestones.find(m => m.status === 'pending')?.dueDate || null
            }
        });
    } catch (error) {
        console.error('Generate progress report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Add these routes to the existing supervisor.js file

// Get progress report for a team
router.get('/progress-report/:teamId', auth, isSupervisor, async (req, res) => {
    try {
        const { teamId } = req.params;
        const supervisorId = req.user.userId;
        
        // Check if supervisor is assigned to this team
        const team = await Team.findById(teamId);
        if (team.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Get all data for the report
        const [teamDetails, annex, documents, milestones, progressReports, meetings] = await Promise.all([
            Team.findById(teamId).populate('members', 'name studentId cgpa'),
            Annex.findOne({ teamId }),
            Document.find({ teamId }),
            Milestone.find({ teamId }),
            ProgressReport.find({ teamId }).sort({ reportDate: -1 }),
            Meeting.find({ teamId }).sort({ meetingDate: -1 })
        ]);
        
        // Calculate statistics
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const totalMilestones = milestones.length;
        const overdueMilestones = milestones.filter(m => m.status === 'overdue').length;
        
        const latestProgress = progressReports.length > 0 ? progressReports[0] : null;
        
        res.json({
            team: teamDetails,
            annex,
            documents,
            milestones: {
                list: milestones,
                stats: {
                    total: totalMilestones,
                    completed: completedMilestones,
                    overdue: overdueMilestones,
                    completionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones * 100) : 0
                }
            },
            progressReports,
            meetings,
            latestProgress,
            summary: {
                teamStrength: teamDetails.members.length,
                projectStatus: teamDetails.status,
                lastMeeting: meetings.length > 0 ? meetings[0].meetingDate : null,
                nextDeadline: milestones.find(m => m.status === 'pending')?.dueDate || null
            }
        });
    } catch (error) {
        console.error('Generate progress report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel team request
router.post('/team-requests/cancel', auth, isSupervisor, async (req, res) => {
    try {
        const { requestId } = req.body;
        const supervisorId = req.user.userId;
        
        const request = await SupervisorRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Check if request belongs to this supervisor
        if (request.supervisorId.toString() !== supervisorId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        request.status = 'cancelled';
        request.respondedAt = new Date();
        await request.save();
        
        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;