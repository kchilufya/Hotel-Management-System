const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-management');
    console.log('Connected to MongoDB');
    
    const Room = mongoose.model('Room', new mongoose.Schema({
      roomNumber: String,
      floor: Number,
      type: String,
      category: String,
      capacity: mongoose.Schema.Types.Mixed,
      pricePerNight: Number,
      amenities: [String],
      bedConfiguration: String,
      size: Number,
      description: String,
      status: String,
      createdAt: Date,
      updatedAt: Date
    }));
    
    // Find all rooms with object capacity
    const rooms = await Room.find({});
    console.log('Total rooms found:', rooms.length);
    
    let fixedCount = 0;
    for (const room of rooms) {
      let needsUpdate = false;
      let newCapacity = room.capacity;
      
      // Check if capacity is an object
      if (typeof room.capacity === 'object' && room.capacity !== null) {
        console.log('Found room with object capacity:', room.roomNumber, JSON.stringify(room.capacity));
        if (room.capacity.adults !== undefined) {
          newCapacity = (room.capacity.adults || 0) + (room.capacity.children || 0);
        } else {
          newCapacity = 2; // Default capacity
        }
        needsUpdate = true;
      }
      // Check if capacity is a string
      else if (typeof room.capacity === 'string') {
        console.log('Found room with string capacity:', room.roomNumber, room.capacity);
        newCapacity = parseInt(room.capacity) || 2;
        needsUpdate = true;
      }
      // Ensure capacity is at least 1
      else if (typeof room.capacity === 'number' && room.capacity < 1) {
        console.log('Found room with invalid capacity:', room.roomNumber, room.capacity);
        newCapacity = 2;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Room.updateOne(
          { _id: room._id },
          { $set: { capacity: newCapacity } }
        );
        console.log('Fixed room', room.roomNumber, 'capacity from', JSON.stringify(room.capacity), 'to', newCapacity);
        fixedCount++;
      }
    }
    
    console.log('Fixed', fixedCount, 'rooms with capacity issues');
    
    // Verify the fix
    const problematicRooms = await Room.find({
      $or: [
        { capacity: { $type: 'object' } },
        { capacity: { $type: 'string' } },
        { capacity: { $lt: 1 } }
      ]
    });
    
    console.log('Remaining problematic rooms:', problematicRooms.length);
    if (problematicRooms.length > 0) {
      console.log('Problematic rooms:', problematicRooms.map(r => ({ roomNumber: r.roomNumber, capacity: r.capacity })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

fixDatabase();
