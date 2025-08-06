const mongoose = require('mongoose');
require('dotenv').config();

async function checkEmployeeIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('staffs');
    
    const allStaff = await collection.find({}, { 
      projection: { 
        firstName: 1, 
        lastName: 1, 
        email: 1, 
        employeeId: 1, 
        _id: 1 
      } 
    }).toArray();
    
    console.log('All staff with employeeIds:');
    allStaff.forEach(staff => {
      console.log(`${staff.firstName} ${staff.lastName} (${staff.email}): ${staff.employeeId || 'NO EMPLOYEE ID'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Check error:', error);
    process.exit(1);
  }
}

checkEmployeeIds();
