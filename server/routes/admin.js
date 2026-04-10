const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Team = require('../models/Team');
const Supervisor = require('../models/Supervisor');
const Defense = require('../models/Defense');
const Document = require('../models/Document');
const Announcement = require('../models/Announcement');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Log admin action
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
    try {
        const log = new AdminLog({
            adminId,
            action,
            targetType,
            targetId,
            details,
            ipAddress: req.ip
        });
        await log.save();
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
};

// Admin Login
// Use Admin model and employeeId for login
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        // Find admin by employeeId
        const admin = await Admin.findOne({ employeeId });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: admin._id, role: admin.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                employeeId: admin.employeeId,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Admin Dashboard Statistics
router.get('/dashboard/stats', auth, isAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalSupervisors = await User.countDocuments({ role: 'supervisor' });
        const totalTeams = await Team.countDocuments();
        const activeTeams = await Team.countDocuments({ status: { $in: ['formed', 'supervisor_assigned', 'project_started'] } });
        const pendingApprovals = await Team.countDocuments({ supervisorStatus: 'pending' });
        const upcomingDefenses = await Defense.countDocuments({ 
            status: 'scheduled',
            scheduledDate: { $gte: new Date() }
        });
        const pendingDocuments = await Document.countDocuments({ status: 'uploaded' });

        res.json({
            totalStudents,
            totalSupervisors,
            totalTeams,
            activeTeams,
            pendingApprovals,
            upcomingDefenses,
            pendingDocuments
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users
// Create new user - Update this route
router.post('/users', auth, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, employeeId, studentId, department, designation, researchAreas } = req.body;
        
        // Check if user exists
        let query = { $or: [] };
        if (email) query.$or.push({ email });
        if (employeeId) query.$or.push({ employeeId });
        if (studentId) query.$or.push({ studentId });
        
        if (query.$or.length > 0) {
            const existingUser = await User.findOne(query);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            employeeId: role === 'admin' ? employeeId : null,
            studentId: role === 'student' ? studentId : null,
            department,
            designation: role === 'supervisor' ? designation : null
        });
        
        await user.save();
        
        // If supervisor, create supervisor profile
        if (role === 'supervisor') {
            const supervisor = new Supervisor({
                userId: user._id,
                designation: designation || 'Professor',
                researchAreas: researchAreas ? researchAreas.split(',') : []
            });
            await supervisor.save();
        }
        
        // Log action
        await logAdminAction(req.user.userId, 'create_user', 'user', user._id, { role });
        
        res.json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                studentId: user.studentId
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new user
router.post('/users', auth, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, studentId, department, semester, cgpa, designation, researchAreas } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { studentId: studentId || null }].filter(Boolean)
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            studentId: role === 'student' ? studentId : null,
            department,
            semester: role === 'student' ? semester : null,
            cgpa: role === 'student' ? cgpa : null,
            designation: role === 'supervisor' ? designation : null
        });
        
        await user.save();
        
        // If supervisor, create supervisor profile
        if (role === 'supervisor') {
            const supervisor = new Supervisor({
                userId: user._id,
                designation: designation || 'Professor',
                researchAreas: researchAreas ? researchAreas.split(',') : []
            });
            await supervisor.save();
        }
        
        // Log action
        await logAdminAction(req.user.userId, 'create_user', 'user', user._id, { role });
        
        res.json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove password from updates if present
        delete updates.password;
        
        const user = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log action
        await logAdminAction(req.user.userId, 'update_user', 'user', user._id, updates);
        
        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset user password
router.post('/users/:id/reset-password', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        // Log action
        await logAdminAction(req.user.userId, 'reset_password', 'user', user._id);
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all teams
router.get('/teams', auth, isAdmin, async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('members', 'name studentId')
            .populate('teamLeader', 'name studentId')
            .populate('supervisorId', 'name')
            .sort({ createdAt: -1 });
        
        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign supervisor to team
router.post('/teams/:teamId/assign-supervisor', auth, isAdmin, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { supervisorId } = req.body;
        
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const supervisor = await User.findById(supervisorId);
        if (!supervisor || supervisor.role !== 'supervisor') {
            return res.status(400).json({ message: 'Invalid supervisor' });
        }
        
        // Check supervisor load
        const supervisorTeams = await Team.countDocuments({ supervisorId });
        const supervisorProfile = await Supervisor.findOne({ userId: supervisorId });
        const maxTeams = supervisorProfile?.maxTeams || 10;
        
        if (supervisorTeams >= maxTeams) {
            return res.status(400).json({ 
                message: `Supervisor has reached maximum teams (${maxTeams})` 
            });
        }
        
        team.supervisorId = supervisorId;
        team.supervisorStatus = 'accepted';
        await team.save();
        
        // Log action
        await logAdminAction(req.user.userId, 'assign_supervisor', 'team', teamId, { supervisorId });
        
        res.json({ 
            message: 'Supervisor assigned successfully',
            team 
        });
    } catch (error) {
        console.error('Assign supervisor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get supervisor workload
router.get('/supervisors/workload', auth, isAdmin, async (req, res) => {
    try {
        const supervisors = await Supervisor.find()
            .populate('userId', 'name email department')
            .populate('currentTeams');
        
        const workloadData = supervisors.map(sup => ({
            id: sup._id,
            name: sup.userId.name,
            email: sup.userId.email,
            department: sup.userId.department,
            designation: sup.designation,
            researchAreas: sup.researchAreas,
            maxTeams: sup.maxTeams,
            currentTeams: sup.currentTeams.length,
            availableSlots: sup.maxTeams - sup.currentTeams.length,
            teams: sup.currentTeams
        }));
        
        res.json(workloadData);
    } catch (error) {
        console.error('Supervisor workload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Schedule defense
router.post('/defenses/schedule', auth, isAdmin, async (req, res) => {
    try {
        const { teamId, defenseType, scheduledDate, scheduledTime, venue, panelMembers } = req.body;
        
        const defense = new Defense({
            teamId,
            defenseType,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            venue,
            panelMembers,
            status: 'scheduled'
        });
        
        await defense.save();
        
        // Log action
        await logAdminAction(req.user.userId, 'schedule_defense', 'defense', defense._id, {
            teamId, defenseType, scheduledDate
        });
        
        res.json({
            message: 'Defense scheduled successfully',
            defense
        });
    } catch (error) {
        console.error('Schedule defense error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all defenses
router.get('/defenses', auth, isAdmin, async (req, res) => {
    try {
        const defenses = await Defense.find()
            .populate('teamId', 'teamName projectTitle')
            .populate('panelMembers', 'name')
            .populate('supervisorId', 'name')
            .sort({ scheduledDate: 1 });
        
        res.json(defenses);
    } catch (error) {
        console.error('Get defenses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create announcement
router.post('/announcements', auth, isAdmin, async (req, res) => {
    try {
        const { title, content, type, targetGroups, expiryDate, priority } = req.body;
        
        const announcement = new Announcement({
            title,
            content,
            type,
            targetGroups: targetGroups || ['all'],
            publishedBy: req.user.userId,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            priority: priority || 1,
            isActive: true
        });
        
        await announcement.save();
        
        // Log action
        await logAdminAction(req.user.userId, 'create_announcement', 'announcement', announcement._id, { title });
        
        res.json({
            message: 'Announcement published successfully',
            announcement
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all announcements
router.get('/announcements', auth, isAdmin, async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('publishedBy', 'name')
            .sort({ publishDate: -1 });
        
        res.json(announcements);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get system logs
router.get('/logs', auth, isAdmin, async (req, res) => {
    try {
        const { action, targetType, startDate, endDate } = req.query;
        
        let query = {};
        
        if (action) {
            query.action = action;
        }
        
        if (targetType) {
            query.targetType = targetType;
        }
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        const logs = await AdminLog.find(query)
            .populate('adminId', 'name email')
            .sort({ timestamp: -1 })
            .limit(100);
        
        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get system settings
router.get('/settings', auth, isAdmin, async (req, res) => {
    // In a real app, these would come from a database
    const settings = {
        teamSizeLimit: 3,
        supervisorRequestLimit: 3,
        supervisorTeamLimit: 10,
        proposalDeadline: '2024-12-31',
        midtermDeadline: '2024-08-31',
        finalDeadline: '2024-11-30',
        semesterStart: '2024-01-15',
        semesterEnd: '2024-12-15'
    };
    
    res.json(settings);
});

// Update system settings
router.put('/settings', auth, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        
        // In a real app, save to database
        // For now, just return success
        
        // Log action
        await logAdminAction(req.user.userId, 'update_settings', 'system', null, updates);
        
        res.json({
            message: 'Settings updated successfully',
            settings: updates
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;