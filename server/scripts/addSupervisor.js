const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function addSupervisor() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thesis_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if supervisor already exists
    const existing = await User.findOne({ facultyId: 'FAC-001' });
    if (existing) {
      console.log('Supervisor with facultyId FAC-001 already exists:');
      console.log({ name: existing.name, facultyId: existing.facultyId, email: existing.email, role: existing.role });
      await mongoose.disconnect();
      return;
    }

    const password = 'SupervisorPass123!';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const supervisor = new User({
      name: 'Dr. Ahmed Khan',
      facultyId: 'FAC-001',
      email: 'ahmed.khan@university.edu',
      password: hashed,
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      researchAreas: ['Machine Learning', 'Artificial Intelligence', 'Deep Learning'],
      role: 'supervisor',
      availability: true,
      maxTeams: 10,
      currentTeams: []
    });

    await supervisor.save();
    console.log('Test supervisor created successfully. Login credentials:');
    console.log('  facultyId: FAC-001');
    console.log('  password: SupervisorPass123!');

    // Add a few more supervisors
    const supervisors = [
      {
        name: 'Dr. Sarah Johnson',
        facultyId: 'FAC-002',
        email: 'sarah.johnson@university.edu',
        designation: 'Associate Professor',
        researchAreas: ['Web Development', 'Cloud Computing', 'DevOps'],
        currentTeams: 0
      },
      {
        name: 'Dr. Amit Patel',
        facultyId: 'FAC-003',
        email: 'amit.patel@university.edu',
        designation: 'Assistant Professor',
        researchAreas: ['Data Science', 'Big Data', 'Analytics'],
        currentTeams: 0
      },
      {
        name: 'Dr. Fatima Al-Rashid',
        facultyId: 'FAC-004',
        email: 'fatima.rashid@university.edu',
        designation: 'Lecturer',
        researchAreas: ['Cybersecurity', 'Network Security', 'Blockchain'],
        currentTeams: 0
      }
    ];

    for (const sup of supervisors) {
      const exists = await User.findOne({ facultyId: sup.facultyId });
      if (!exists) {
        const supervisorDoc = new User({
          name: sup.name,
          facultyId: sup.facultyId,
          email: sup.email,
          password: hashed,
          department: 'Computer Science & Engineering',
          designation: sup.designation,
          researchAreas: sup.researchAreas,
          role: 'supervisor',
          availability: true,
          maxTeams: 10,
          currentTeams: []
        });
        await supervisorDoc.save();
        console.log(`Added supervisor: ${sup.name}`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error adding supervisor:', err);
    process.exit(1);
  }
}

addSupervisor();
