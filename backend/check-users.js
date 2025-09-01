const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management')
  .then(() => {
    console.log('Connected to MongoDB');
    return checkUsers();
  })
  .then(() => {
    console.log('Database connection closed');
    mongoose.connection.close();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.connection.close();
  });

async function checkUsers() {
  try {
    const db = mongoose.connection.db;
    const staffCollection = db.collection('staff');
    
    console.log('👥 Checking staff/user accounts...\n');
    
    // Get all staff/users
    const allStaff = await staffCollection.find({}).toArray();
    console.log(`Total staff/users found: ${allStaff.length}\n`);
    
    if (allStaff.length > 0) {
      console.log('📋 All users:');
      allStaff.forEach((staff, index) => {
        console.log(`${index + 1}. ${staff.firstName} ${staff.lastName}`);
        console.log(`   Email: ${staff.email}`);
        console.log(`   Role: ${staff.role}`);
        console.log(`   Department: ${staff.department}`);
        console.log(`   Status: ${staff.isActive ? 'Active' : 'Inactive'}`);
        console.log(`   Created: ${staff.createdAt}`);
        console.log('');
      });
      
      console.log('🔑 Login Instructions:');
      console.log('You can try logging in with any of the above email addresses.');
      console.log('If you don\'t remember the password, the common default is "admin123"');
      console.log('or the system may have set a default password during setup.');
    } else {
      console.log('No users found in the database. You may need to run the seed script.');
    }
    
  } catch (error) {
    console.error('Error during user check:', error);
  }
}
