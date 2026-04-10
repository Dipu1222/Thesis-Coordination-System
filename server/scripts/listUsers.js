const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thesis_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const users = await User.find({}, 'name studentId email role password').lean();
    console.log('Users:');
    users.forEach(u => {
      console.log(`- ${u.name} | studentId: ${u.studentId} | email: ${u.email} | role: ${u.role} | password: ${u.password}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error listing users:', err);
    process.exit(1);
  }
}

listUsers();
