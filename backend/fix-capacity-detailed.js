const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management')
  .then(() => {
    console.log('Connected to MongoDB');
    return fixCapacityIssues();
  })
  .then(() => {
    console.log('Database connection closed');
    mongoose.connection.close();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.connection.close();
  });

async function fixCapacityIssues() {
  try {
    // Get the rooms collection directly
    const db = mongoose.connection.db;
    const roomsCollection = db.collection('rooms');
    
    console.log('Searching for all rooms...');
    
    // Find all rooms
    const allRooms = await roomsCollection.find({}).toArray();
    console.log(`Total rooms found: ${allRooms.length}`);
    
    // Check each room for capacity issues
    let fixedCount = 0;
    let problemCount = 0;
    
    for (const room of allRooms) {
      console.log(`\nRoom ${room.roomNumber}:`);
      console.log(`  ID: ${room._id}`);
      console.log(`  Capacity: ${JSON.stringify(room.capacity)} (type: ${typeof room.capacity})`);
      
      if (room.capacity && typeof room.capacity === 'object' && !Array.isArray(room.capacity)) {
        console.log(`  ❌ PROBLEM: Capacity is an object - ${JSON.stringify(room.capacity)}`);
        problemCount++;
        
        // Try to fix by setting a reasonable default capacity
        let newCapacity = 2; // Default capacity
        
        // Try to extract a number from the object
        if (room.capacity.adults || room.capacity.total) {
          newCapacity = (room.capacity.adults || 0) + (room.capacity.children || 0) || room.capacity.total || 2;
        }
        
        console.log(`  🔧 Fixing capacity to: ${newCapacity}`);
        
        // Update the room
        const result = await roomsCollection.updateOne(
          { _id: room._id },
          { $set: { capacity: newCapacity } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Fixed room ${room.roomNumber}`);
          fixedCount++;
        } else {
          console.log(`  ❌ Failed to fix room ${room.roomNumber}`);
        }
      } else if (room.capacity === undefined || room.capacity === null) {
        console.log(`  ⚠️  No capacity field - setting default`);
        
        // Set default capacity based on bed configuration
        let defaultCapacity = 2;
        if (room.bedConfiguration === 'singleBed') defaultCapacity = 1;
        else if (room.bedConfiguration === 'doubleBed') defaultCapacity = 2;
        else if (room.bedConfiguration === 'twinBeds') defaultCapacity = 2;
        else if (room.bedConfiguration === 'kingSizeBed') defaultCapacity = 2;
        
        const result = await roomsCollection.updateOne(
          { _id: room._id },
          { $set: { capacity: defaultCapacity } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Set default capacity ${defaultCapacity} for room ${room.roomNumber}`);
          fixedCount++;
        }
      } else {
        console.log(`  ✅ Capacity is valid: ${room.capacity}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total rooms processed: ${allRooms.length}`);
    console.log(`Rooms with problems: ${problemCount}`);
    console.log(`Rooms fixed: ${fixedCount}`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const remainingProblems = await roomsCollection.find({
      capacity: { $type: 'object' }
    }).toArray();
    
    console.log(`Remaining problematic rooms: ${remainingProblems.length}`);
    
    if (remainingProblems.length > 0) {
      console.log('Remaining problems:');
      remainingProblems.forEach(room => {
        console.log(`  Room ${room.roomNumber}: capacity = ${JSON.stringify(room.capacity)}`);
      });
    }
    
  } catch (error) {
    console.error('Error during capacity fix:', error);
  }
}
