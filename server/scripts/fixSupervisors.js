const mongoose = require('mongoose');
const User = require('../models/User');

async function fixSupervisors() {
  try {
    await mongoose.connect('mongodb://localhost:27017/thesis_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Update all supervisors to be available and set defaults
    const result = await User.updateMany(
      { role: 'supervisor' },
      {
        $set: {
          availability: true,
          maxTeams: 10
        },
        $setOnInsert: {
          currentTeams: []
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} supervisors`);

    // Fetch and display updated supervisors
    const supervisors = await User.find({ role: 'supervisor' });
    console.log('\nUpdated Supervisors:');
    supervisors.forEach(sup => {
      console.log(`- ${sup.name} (${sup.facultyId}): availability=${sup.availability}, currentTeams=${sup.currentTeams.length}, maxTeams=${sup.maxTeams}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error fixing supervisors:', err);
    process.exit(1);
  }
}

fixSupervisors();
