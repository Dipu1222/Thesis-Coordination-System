const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function addUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thesis_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const existing = await User.findOne({ studentId: '222002120' });
    if (existing) {
      console.log('User with studentId 222002120 already exists:');
      console.log({ name: existing.name, studentId: existing.studentId, email: existing.email, role: existing.role });
      await mongoose.disconnect();
      return;
    }

    const password = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      name: 'Dipu',
      studentId: '222002120',
      email: 'dipu@gmail.com',
      password: hashed,
      department: 'CSE',
      semester: '6',
      cgpa: 3.50,
      completedCredits: 90,
      role: 'student'
    });

    await user.save();
    console.log('Test user created successfully. Login credentials:');
    console.log('  studentId: 222002120');
    console.log('  password: Password123!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error adding user:', err);
    process.exit(1);
  }
}

addUser();
