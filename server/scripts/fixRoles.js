const mongoose = require('mongoose');
const User = require('../models/User');

async function fixRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thesis_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const res = await User.updateMany({ $or: [{ role: { $exists: false } }, { role: null }] }, { $set: { role: 'student' } });
    console.log('Updated documents:', res.modifiedCount);

    // Show updated sample
    const users = await User.find({}, 'studentId role').lean();
    users.forEach(u => console.log(`${u.studentId} -> ${u.role}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error fixing roles:', err);
    process.exit(1);
  }
}

fixRoles();
