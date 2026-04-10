const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const chatRoutes = require('./routes/chat');
// Add after other route imports
const supervisorRoutes = require('./routes/supervisor');
const adminRoutes = require('./routes/admin');
const path = require('path');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/admin', adminRoutes);


// Serve supervisor frontend static files under /supervisor
const supervisorDist = path.join(__dirname, '..', 'supervisor');
app.use('/supervisor', express.static(supervisorDist));

// Serve admin frontend static files under /admin
const adminDist = path.join(__dirname, '..', 'admin');
app.use('/admin', express.static(adminDist));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/chat', chatRoutes);

// Serve student frontend
const studentDist = path.join(__dirname, '..', 'student');
app.use(express.static(studentDist));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(studentDist, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});