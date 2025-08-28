const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('staffs');
    
    // Drop the problematic index
    try {
      await collection.dropIndex('employeeId_1');
      console.log('Dropped employeeId index');
    } catch (error) {
      console.log('Index may not exist:', error.message);
    }
    
    // Remove all documents with null employeeId
    const result = await collection.deleteMany({ employeeId: null });
    console.log(`Deleted ${result.deletedCount} documents with null employeeId`);
    
    // Ensure all existing documents have unique employeeIds
    const existingDocs = await collection.find({}).toArray();
    console.log(`Found ${existingDocs.length} existing documents`);
    
    for (let i = 0; i < existingDocs.length; i++) {
      const doc = existingDocs[i];
      if (!doc.employeeId) {
        const newId = `EMP${String(i + 1).padStart(4, '0')}`;
        await collection.updateOne(
          { _id: doc._id },
          { $set: { employeeId: newId } }
        );
        console.log(`Updated document ${doc._id} with employeeId ${newId}`);
      }
    }
    
    // Recreate the unique index
    await collection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
    console.log('Recreated employeeId unique index');
    
    console.log('Index fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Index fix error:', error);
    process.exit(1);
  }
}

fixIndexes();
