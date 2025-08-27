const mongoose = require('mongoose');
require('dotenv').config();

const Staff = require('./models/Staff');

async function cleanupAndReseed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('Connected to MongoDB');
    
    // Remove all staff with null employeeId
    const deleted = await Staff.deleteMany({ employeeId: null });
    console.log(`Deleted ${deleted.deletedCount} staff members with null employeeId`);
    
    // Update existing staff with unique employeeIds
    const existingStaff = await Staff.find({});
    for (let i = 0; i < existingStaff.length; i++) {
      if (!existingStaff[i].employeeId) {
        existingStaff[i].employeeId = `EMP${String(i + 1).padStart(4, '0')}`;
        await existingStaff[i].save();
      }
    }
    
    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

cleanupAndReseed();
