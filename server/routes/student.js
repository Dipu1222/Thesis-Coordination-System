const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isStudent = require('../middleware/isStudent');
const User = require('../models/User');
const Request = require('../models/Request');
const Team = require('../models/Team');
const Document = require('../models/Document');
const Defense = require('../models/Defense');
const Annex = require('../models/Annex');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        // Allow PDFs only
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'));
    }
});

// Get team requests
router.get('/team/requests', auth, isStudent, async (req, res) => {
    try {
        const studentId = req.user.userId;
        
        // Get pending requests to this student
        const incomingRequests = await Request.find({
            toStudent: studentId,
            type: 'team',
            status: 'pending'
        }).populate('fromStudent', 'name studentId department semester cgpa');
        
        // Get pending requests from this student
        const outgoingRequests = await Request.find({
            fromStudent: studentId,
            type: 'team',
            status: 'pending'
        }).populate('toStudent', 'name studentId department semester cgpa');
        
        res.json({
            incoming: incomingRequests,
            outgoing: outgoingRequests
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search students (for team formation)
router.get('/search-students', auth, isStudent, async (req, res) => {
    try {
        const { search, department } = req.query;
        const userId = req.user.userId;

        const filter = { role: 'student' };

        // Exclude current user
        if (userId) filter._id = { $ne: userId };

        // Only show students not already in a team
        filter.teamId = null;

        if (department) {
            filter.department = department;
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { studentId: regex },
                { email: regex }
            ];
        }

        const students = await User.find(filter, 'name studentId department semester cgpa email');
        res.json(students);
    } catch (error) {
        console.error('Search students error:', error);
        res.status(500).json({ message: 'Server error searching students' });
    }
});

// Get dashboard data
router.get('/dashboard', auth, isStudent, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user info
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get team info if exists
        let team = null;
        let supervisor = null;
        if (user.teamId) {
            team = await Team.findById(user.teamId).populate('members', 'name studentId').populate('supervisorId', 'name');
            if (team && team.supervisorId) {
                supervisor = team.supervisorId;
            }
        }

        // Get documents
        const documents = await Document.find({ uploadedBy: userId }).catch(() => []);

        // Get defenses
        const defenses = await Defense.find({ team: user.teamId }).catch(() => []);

        // Get notifications (mock for now)
        const notifications = [];

        res.json({
            student: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                email: user.email,
                department: user.department,
                semester: user.semester,
                cgpa: user.cgpa,
                completedCredits: user.completedCredits
            },
            team: team ? {
                id: team._id,
                teamName: team.teamName,
                status: team.status,
                members: team.members,
                supervisorId: team.supervisorId ? team.supervisorId._id : null,
                supervisorStatus: team.supervisorStatus
            } : null,
            supervisor: supervisor || null,
            documents: documents || [],
            defenses: defenses || [],
            notifications: notifications
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error loading dashboard', error: error.message });
    }
});

// Send team request
router.post('/team/send-request', auth, isStudent, async (req, res) => {
    try {
        const { toStudentId, message } = req.body;
        const fromStudentId = req.user.userId;
        
        // Check if from student already has a team
        const fromStudent = await User.findById(fromStudentId);
        if (fromStudent.teamId) {
            return res.status(400).json({ 
                message: 'You are already in a team. Leave your current team first.' 
            });
        }
        
        // Check if target student already has a team
        const toStudent = await User.findById(toStudentId);
        if (toStudent.teamId) {
            return res.status(400).json({ 
                message: 'This student is already in a team' 
            });
        }
        
        // Check if request already exists
        const existingRequest = await Request.findOne({
            fromStudent: fromStudentId,
            toStudent: toStudentId,
            type: 'team',
            status: 'pending'
        });
        
        if (existingRequest) {
            return res.status(400).json({ 
                message: 'Request already sent to this student' 
            });
        }
        
        // Check if reverse request exists
        const reverseRequest = await Request.findOne({
            fromStudent: toStudentId,
            toStudent: fromStudentId,
            type: 'team',
            status: 'pending'
        });
        
        if (reverseRequest) {
            // Accept the reverse request automatically
            reverseRequest.status = 'accepted';
            reverseRequest.respondedAt = new Date();
            await reverseRequest.save();
            
            // Create team with both students
            const team = new Team({
                teamName: `Team-${Date.now().toString().slice(-4)}`,
                teamLeader: fromStudentId,
                members: [fromStudentId, toStudentId],
                status: 'forming'
            });
            
            await team.save();
            
            // Update both students
            await User.findByIdAndUpdate(fromStudentId, { 
                teamId: team._id, 
                isTeamLeader: true 
            });
            
            await User.findByIdAndUpdate(toStudentId, { 
                teamId: team._id 
            });
            
            return res.json({ 
                message: 'Team created successfully! Both students are now in a team.', 
                team 
            });
        }
        
        // Create new request
        const request = new Request({
            type: 'team',
            fromStudent: fromStudentId,
            toStudent: toStudentId,
            message: message || 'Hi, would you like to join my thesis team?',
            status: 'pending'
        });
        
        await request.save();
        
        res.json({ 
            message: 'Team request sent successfully',
            request 
        });
    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Respond to team request
router.post('/team/respond-request', auth, isStudent, async (req, res) => {
    try {
        const { requestId, action } = req.body; // action: 'accept' or 'reject'
        const studentId = req.user.userId;
        
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Check if request is for this student
        if (request.toStudent.toString() !== studentId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already responded' });
        }
        
        // Get the students
        const fromStudent = await User.findById(request.fromStudent);
        const toStudent = await User.findById(request.toStudent);
        
        // Check if either student already has a team
        if (fromStudent.teamId || toStudent.teamId) {
            request.status = 'rejected';
            request.respondedAt = new Date();
            await request.save();
            return res.status(400).json({ 
                message: 'Cannot accept request. One of you is already in a team.' 
            });
        }
        
        if (action === 'accept') {
            request.status = 'accepted';
            request.respondedAt = new Date();
            await request.save();
            
            // Create team
            const team = new Team({
                teamName: `Team-${Date.now().toString().slice(-4)}`,
                teamLeader: request.fromStudent,
                members: [request.fromStudent, request.toStudent],
                status: 'forming'
            });
            
            await team.save();
            
            // Update both students
            await User.findByIdAndUpdate(request.fromStudent, { 
                teamId: team._id, 
                isTeamLeader: true 
            });
            
            await User.findByIdAndUpdate(request.toStudent, { 
                teamId: team._id 
            });
            
            res.json({ 
                message: 'Team request accepted! Team created successfully.',
                team 
            });
        } else if (action === 'reject') {
            request.status = 'rejected';
            request.respondedAt = new Date();
            await request.save();
            
            res.json({ 
                message: 'Team request rejected' 
            });
        }
    } catch (error) {
        console.error('Respond request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current team
router.get('/team/current', auth, isStudent, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const student = await User.findById(studentId);
        
        if (!student.teamId) {
            return res.json({ team: null });
        }
        
        const team = await Team.findById(student.teamId)
            .populate('members', 'name studentId email department')
            .populate('teamLeader', 'name studentId')
            .populate('pendingMembers.studentId', 'name studentId');
        
        res.json({ team });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave team
router.post('/team/leave', auth, isStudent, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const student = await User.findById(studentId);
        
        if (!student.teamId) {
            return res.status(400).json({ message: 'You are not in a team' });
        }
        
        const team = await Team.findById(student.teamId);
        
        // If team leader is leaving, delete the team
        if (team.teamLeader.toString() === studentId) {
            // Remove all members from team
            await User.updateMany(
                { _id: { $in: team.members } },
                { $unset: { teamId: "", isTeamLeader: false } }
            );
            
            await Team.findByIdAndDelete(team._id);
            
            res.json({ 
                message: 'Team deleted successfully as team leader left',
                teamDeleted: true 
            });
        } else {
            // Remove member from team
            team.members = team.members.filter(
                memberId => memberId.toString() !== studentId
            );
            
            // If only one member left, make them the leader
            if (team.members.length === 1) {
                team.teamLeader = team.members[0];
                await User.findByIdAndUpdate(team.members[0], { 
                    isTeamLeader: true 
                });
            }
            
            await team.save();
            
            // Update student
            await User.findByIdAndUpdate(studentId, { 
                $unset: { teamId: "", isTeamLeader: false } 
            });
            
            res.json({ 
                message: 'Successfully left the team',
                teamDeleted: false 
            });
        }
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Invite member by team code
router.post('/team/invite-by-code', auth, isStudent, async (req, res) => {
    try {
        const { teamCode } = req.body;
        const studentId = req.user.userId;
        
        const student = await User.findById(studentId);
        if (!student.isTeamLeader) {
            return res.status(403).json({ message: 'Only team leader can invite members' });
        }
        
        const team = await Team.findById(student.teamId);
        if (!team) {
            return res.status(400).json({ message: 'Team not found' });
        }
        
        // Check if team is full
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json({ message: 'Team is full (max 3 members)' });
        }
        
        // Find student by team code (in real app, you'd have a different system)
        // For now, we'll search for student
        const targetStudent = await User.findOne({ 
            studentId: teamCode, // Using studentId as code for simplicity
            role: 'student',
            teamId: null
        });
        
        if (!targetStudent) {
            return res.status(404).json({ 
                message: 'Student not found or already in a team' 
            });
        }
        
        // Send request
        const request = new Request({
            type: 'team',
            fromStudent: studentId,
            toStudent: targetStudent._id,
            message: `You've been invited to join team ${team.teamName}`,
            status: 'pending'
        });
        
        await request.save();
        
        res.json({ 
            message: 'Invitation sent successfully',
            request 
        });
    } catch (error) {
        console.error('Invite by code error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel request
router.post('/team/cancel-request', auth, isStudent, async (req, res) => {
    try {
        const { requestId } = req.body;
        const studentId = req.user.userId;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only the sender can cancel
        if (request.fromStudent.toString() !== studentId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel non-pending request' });
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

// Upload document
router.post('/document/upload', auth, isStudent, upload.single('document'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const documentType = req.body.documentType || 'other';
        const fileName = req.body.fileName || req.file.originalname;
        const fileSize = req.file.size;
        const filePath = `/uploads/${req.file.filename}`;

        const doc = new Document({
            teamId: user && user.teamId ? user.teamId : null,
            uploadedBy: userId,
            documentType,
            fileName,
            filePath,
            fileSize,
            status: 'uploaded'
        });

        await doc.save();

        res.json({ message: 'Document uploaded successfully', document: doc });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ message: 'Server error uploading document', error: error.message });
    }
});

// List documents for the student's team or their own uploads
router.get('/documents', auth, isStudent, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        let docs = [];
        if (user && user.teamId) {
            docs = await Document.find({ teamId: user.teamId }).sort({ createdAt: -1 });
        } else {
            docs = await Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });
        }

        res.json(docs);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ message: 'Server error fetching documents' });
    }
});

// Get available supervisors
router.get('/supervisors', auth, isStudent, async (req, res) => {
    try {
        console.log('Fetching supervisors...');
        const supervisors = await User.find({ role: 'supervisor' });
        console.log(`Found ${supervisors.length} supervisors`);

        const supervisorsWithSlots = supervisors.map(sup => {
            const currentTeamsCount = (sup.currentTeams && Array.isArray(sup.currentTeams)) ? sup.currentTeams.length : 0;
            const maxTeams = sup.maxTeams || 10;
            const availableSlots = Math.max(0, maxTeams - currentTeamsCount);
            const isAvailable = sup.availability !== false; // Default to true if not explicitly false
            
            return {
                _id: sup._id,
                id: sup._id,
                name: sup.name,
                facultyId: sup.facultyId,
                email: sup.email,
                department: sup.department,
                designation: sup.designation || 'Faculty',
                researchAreas: (sup.researchAreas && sup.researchAreas.length > 0) ? sup.researchAreas : [],
                availability: isAvailable,
                maxTeams: maxTeams,
                currentTeams: currentTeamsCount,
                availableSlots: availableSlots > 0 ? availableSlots : 0,
                rating: 4.5 // Mock rating
            };
        });

        console.log('Supervisors response:', JSON.stringify(supervisorsWithSlots, null, 2));
        res.json(supervisorsWithSlots);
    } catch (error) {
        console.error('Get supervisors error:', error);
        res.status(500).json({ message: 'Server error fetching supervisors', error: error.message });
    }
});

// Request a supervisor
router.post('/supervisor/request', auth, isStudent, async (req, res) => {
    try {
        const { supervisorId } = req.body;
        const studentId = req.user.userId;

        if (!supervisorId) {
            return res.status(400).json({ message: 'Supervisor ID is required' });
        }

        // Get student info
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if student already has a team with a supervisor
        if (student.teamId) {
            const team = await Team.findById(student.teamId);
            if (team && team.supervisorId) {
                return res.status(400).json({ message: 'You already have a supervisor assigned to your team' });
            }
        }

        // Get supervisor info
        const supervisor = await User.findById(supervisorId);
        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor not found' });
        }

        if (supervisor.role !== 'supervisor') {
            return res.status(400).json({ message: 'Selected user is not a supervisor' });
        }

        // Check if supervisor has available slots
        const currentTeamsCount = (supervisor.currentTeams && Array.isArray(supervisor.currentTeams)) ? supervisor.currentTeams.length : 0;
        const maxTeams = supervisor.maxTeams || 10;
        
        if (currentTeamsCount >= maxTeams) {
            return res.status(400).json({ message: 'This supervisor has no available slots' });
        }

        // Check if supervisor is available
        if (supervisor.availability === false) {
            return res.status(400).json({ message: 'This supervisor is not currently available' });
        }

        // Check if student's team already has a pending or accepted supervisor request
        if (student.teamId) {
            const SupervisorRequest = require('../models/SupervisorRequest');
            const existingRequest = await SupervisorRequest.findOne({
                teamId: student.teamId,
                supervisorId: supervisorId,
                status: { $in: ['pending', 'accepted'] }
            });

            if (existingRequest) {
                return res.status(400).json({ message: 'You already have a pending or accepted request with this supervisor' });
            }
        }

        // Create supervisor request
        const SupervisorRequest = require('../models/SupervisorRequest');
        const supervisorRequest = new SupervisorRequest({
            teamId: student.teamId || null,
            supervisorId: supervisorId,
            studentId: studentId,
            message: req.body.message || 'I would like to request your supervision for my thesis project',
            status: 'pending',
            requestedAt: new Date()
        });

        await supervisorRequest.save();

        res.json({
            message: 'Supervisor request sent successfully',
            request: supervisorRequest
        });
    } catch (error) {
        console.error('Supervisor request error:', error);
        res.status(500).json({ message: 'Server error sending supervisor request', error: error.message });
    }
});

// Submit annex form
router.post('/annex/submit', auth, isStudent, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        const { projectTitle, problemStatement, objectives, methodology, expectedOutcome, toolsTechnology } = req.body;

        if (!projectTitle || !problemStatement || !objectives || !methodology) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const annex = new Annex({
            teamId: user && user.teamId ? user.teamId : null,
            uploadedBy: userId,
            projectTitle,
            problemStatement,
            objectives,
            methodology,
            expectedOutcome,
            toolsTechnology
        });

        await annex.save();

        res.json({ message: 'Annex form submitted successfully', annex });
    } catch (error) {
        console.error('Annex submit error:', error);
        res.status(500).json({ message: 'Server error submitting annex form' });
    }
});

// Get defense schedules
router.get('/defenses', auth, isStudent, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get student's team
        const student = await User.findById(userId);
        if (!student.teamId) {
            return res.json([]);
        }

        // Get defenses for this team
        const defenses = await Defense.find({ teamId: student.teamId })
            .populate('teamId', 'teamName')
            .populate('panelMembers', 'name department')
            .sort({ scheduledDate: 1 });

        const defensesWithDetails = defenses.map(def => ({
            _id: def._id,
            projectTitle: def.projectTitle,
            defenseType: def.defenseType,
            scheduledDate: def.scheduledDate,
            scheduledTime: def.scheduledTime,
            venue: def.venue,
            room: def.room,
            status: def.status,
            panelMembers: def.panelMembers || [],
            teamId: def.teamId
        }));

        res.json(defensesWithDetails);
    } catch (error) {
        console.error('Get defenses error:', error);
        res.status(500).json({ message: 'Server error fetching defenses', error: error.message });
    }
});

// Get defense details
router.get('/defenses/:defenseId', auth, isStudent, async (req, res) => {
    try {
        const { defenseId } = req.params;
        const userId = req.user.userId;

        // Get student's team
        const student = await User.findById(userId);
        if (!student.teamId) {
            return res.status(404).json({ message: 'You do not have a team' });
        }

        // Get defense details
        const defense = await Defense.findOne({ 
            _id: defenseId, 
            teamId: student.teamId 
        })
        .populate('teamId', 'teamName members supervisorId')
        .populate('panelMembers', 'name department email');

        if (!defense) {
            return res.status(404).json({ message: 'Defense not found' });
        }

        res.json(defense);
    } catch (error) {
        console.error('Get defense details error:', error);
        res.status(500).json({ message: 'Server error fetching defense details', error: error.message });
    }
});

// Schedule defense (by student requesting)
router.post('/defenses/request', auth, isStudent, async (req, res) => {
    try {
        const { defenseType, proposedDate, proposedTime, venue } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!defenseType || !proposedDate || !proposedTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get student's team
        const student = await User.findById(userId);
        if (!student.teamId) {
            return res.status(400).json({ message: 'You must have a team to request a defense' });
        }

        const team = await Team.findById(student.teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if defense already scheduled for this team
        const existingDefense = await Defense.findOne({
            teamId: student.teamId,
            defenseType: defenseType,
            status: { $in: ['scheduled', 'completed'] }
        });

        if (existingDefense) {
            return res.status(400).json({ 
                message: `${defenseType} defense already scheduled for your team` 
            });
        }

        // Create defense request
        const defense = new Defense({
            teamId: student.teamId,
            projectTitle: team.projectTitle || 'Thesis Project',
            defenseType: defenseType,
            scheduledDate: proposedDate,
            scheduledTime: proposedTime,
            venue: venue || 'TBD',
            status: 'pending', // Pending supervisor approval
            requestedBy: userId,
            requestedAt: new Date()
        });

        await defense.save();

        res.json({
            message: 'Defense request submitted successfully. Awaiting supervisor approval.',
            defense
        });
    } catch (error) {
        console.error('Request defense error:', error);
        res.status(500).json({ message: 'Server error requesting defense', error: error.message });
    }
});

module.exports = router;
