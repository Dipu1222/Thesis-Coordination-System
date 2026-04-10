const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thesis_system', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const createAdmin = async () => {
    await connectDB();
    
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ employeeId: 'ADMIN001' });
        
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Create admin user
        const admin = new Admin({
            name: 'System Administrator',
            employeeId: 'ADMIN001',
            email: 'admin@thesiscoord.edu',
            password: hashedPassword,
            role: 'admin',
            department: 'Administration',
            status: 'active'
        });
        
        await admin.save();
        
        console.log('========================================');
        console.log('✅ Admin User Created Successfully!');
        console.log('========================================');
        console.log('Employee ID: ADMIN001');
        console.log('Password: admin123');
        console.log('Email: admin@thesiscoord.edu');
        console.log('========================================');
        console.log('⚠️  Please change the password after first login!');
        console.log('========================================');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();