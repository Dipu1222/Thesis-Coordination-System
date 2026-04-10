const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');

// Student Registration
router.post('/register/student', async (req, res) => {
    try {
        const { name, studentId, email, password, department, semester, cgpa, completedCredits } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ studentId }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User with this ID or email already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            studentId,
            email,
            password: hashedPassword,
            department,
            semester,
            cgpa,
            completedCredits,
            role: 'student'
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                email: user.email,
                department: user.department,
                semester: user.semester,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Student Login
router.post('/login/student', async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // Find user
        const user = await User.findOne({ studentId, role: 'student' });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Get team info if exists
        let teamInfo = null;
        if (user.teamId) {
            const team = await Team.findById(user.teamId)
                .populate('members', 'name studentId')
                .populate('supervisorId', 'name');
            teamInfo = team;
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                email: user.email,
                department: user.department,
                semester: user.semester,
                isTeamLeader: user.isTeamLeader,
                teamId: user.teamId,
                role: user.role
            },
            teamInfo
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
// Add admin login route
// Admin Login with Employee ID
router.post('/login/admin', async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        // Find admin user by employeeId
        const admin = await User.findOne({ 
            employeeId: employeeId,
            role: 'admin' 
        });
        
        if (!admin) {
            return res.status(400).json({ 
                message: 'Invalid employee ID or password' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Invalid employee ID or password' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: admin._id, 
                role: admin.role,
                employeeId: admin.employeeId 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                employeeId: admin.employeeId,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
module.exports = router;