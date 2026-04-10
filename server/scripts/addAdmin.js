const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

async function createAdmin() {
    await connectDB();
    const employeeId = '1234';
    const password = 'admin123';
    const email = 'admin1234@example.com';
    const name = 'Test Admin';
    const department = 'IT';

    // Check if admin already exists
    const exists = await Admin.findOne({ employeeId });
    if (exists) {
        console.log('Admin already exists');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
        name,
        email,
        employeeId,
        password: hashedPassword,
        department,
        role: 'admin',
        status: 'active'
    });
    await admin.save();
    console.log('Test admin created:', admin);
    process.exit(0);
}

createAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
