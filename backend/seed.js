const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Staff = require('./models/Staff');
const Room = require('./models/Room');
const Guest = require('./models/Guest');

const connectDB = async () => {
  try {
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Staff.deleteMany({});
    await Room.deleteMany({});
    await Guest.deleteMany({});
    
    console.log('🧹 Cleared existing data');

    // Create admin staff
    const adminStaff = new Staff({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hotel.com',
      phone: '+1234567890',
      password: 'admin123',
      role: 'admin',
      department: 'management',
      hireDate: new Date(),
      salary: 50000,
      shift: 'morning'
    });

    // Create manager staff
    const managerStaff = new Staff({
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@hotel.com',
      phone: '+1234567891',
      password: 'manager123',
      role: 'manager',
      department: 'management',
      hireDate: new Date(),
      salary: 40000,
      shift: 'morning'
    });

    // Create receptionist staff
    const receptionistStaff = new Staff({
      firstName: 'Jane',
      lastName: 'Receptionist',
      email: 'receptionist@hotel.com',
      phone: '+1234567892',
      password: 'receptionist123',
      role: 'receptionist',
      department: 'frontDesk',
      hireDate: new Date(),
      salary: 30000,
      shift: 'morning'
    });

    await adminStaff.save();
    await managerStaff.save();
    await receptionistStaff.save();
    console.log('👥 Created staff members');

    // Create rooms
    const rooms = [];
    
    // Floor 1 - Economy rooms
    for (let i = 101; i <= 110; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 1,
        type: 'single',
        category: 'economy',
        capacity: { adults: 1, children: 1 },
        pricePerNight: 80,
        amenities: ['wifi', 'tv', 'airConditioning'],
        bedConfiguration: 'singleBed',
        size: 20,
        status: 'available',
        description: 'Comfortable economy single room'
      });
    }

    // Floor 2 - Standard rooms
    for (let i = 201; i <= 215; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 2,
        type: 'double',
        category: 'standard',
        capacity: { adults: 2, children: 1 },
        pricePerNight: 120,
        amenities: ['wifi', 'tv', 'airConditioning', 'minibar'],
        bedConfiguration: 'doubleBed',
        size: 30,
        status: 'available',
        description: 'Standard double room with modern amenities'
      });
    }

    // Floor 3 - Premium rooms
    for (let i = 301; i <= 310; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 3,
        type: 'suite',
        category: 'premium',
        capacity: { adults: 3, children: 2 },
        pricePerNight: 200,
        amenities: ['wifi', 'tv', 'airConditioning', 'minibar', 'balcony', 'cityView'],
        bedConfiguration: 'kingBed',
        size: 50,
        status: 'available',
        description: 'Premium suite with city view and balcony'
      });
    }

    // Floor 4 - Luxury rooms
    for (let i = 401; i <= 405; i++) {
      rooms.push({
        roomNumber: i.toString(),
        floor: 4,
        type: 'deluxe',
        category: 'luxury',
        capacity: { adults: 4, children: 2 },
        pricePerNight: 350,
        amenities: ['wifi', 'tv', 'airConditioning', 'minibar', 'balcony', 'oceanView', 'bathtub', 'safe'],
        bedConfiguration: 'kingBed',
        size: 80,
        status: 'available',
        description: 'Luxury deluxe room with ocean view and premium amenities'
      });
    }

    // Presidential suite
    rooms.push({
      roomNumber: '501',
      floor: 5,
      type: 'presidential',
      category: 'luxury',
      capacity: { adults: 6, children: 3 },
      pricePerNight: 800,
      amenities: ['wifi', 'tv', 'airConditioning', 'minibar', 'balcony', 'oceanView', 'bathtub', 'safe', 'kitchenette', 'fireplace'],
      bedConfiguration: 'kingBed',
      size: 150,
      status: 'available',
      description: 'Presidential suite with panoramic ocean view and luxury amenities'
    });

    await Room.insertMany(rooms);
    console.log('🏨 Created rooms');

    // Create sample guests
    const guests = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@email.com',
        phone: '+1555001234',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        idType: 'passport',
        idNumber: 'AB123456',
        dateOfBirth: new Date('1985-05-15'),
        nationality: 'American',
        preferences: {
          roomType: 'suite',
          specialRequests: ['quiet room', 'high floor'],
          dietaryRestrictions: ['vegetarian']
        },
        vipStatus: true
      },
      {
        firstName: 'Robert',
        lastName: 'Smith',
        email: 'robert.smith@email.com',
        phone: '+1555001235',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          zipCode: '90210'
        },
        idType: 'driverLicense',
        idNumber: 'DL987654',
        dateOfBirth: new Date('1978-12-03'),
        nationality: 'American',
        preferences: {
          roomType: 'double',
          specialRequests: ['ocean view'],
          dietaryRestrictions: []
        },
        vipStatus: false
      },
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@email.com',
        phone: '+1555001236',
        address: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          zipCode: '60601'
        },
        idType: 'passport',
        idNumber: 'CD789012',
        dateOfBirth: new Date('1992-08-20'),
        nationality: 'Canadian',
        preferences: {
          roomType: 'single',
          specialRequests: ['early check-in'],
          dietaryRestrictions: ['gluten-free']
        },
        vipStatus: false
      }
    ];

    await Guest.insertMany(guests);
    console.log('👤 Created sample guests');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@hotel.com / admin123');
    console.log('Manager: manager@hotel.com / manager123');
    console.log('Receptionist: receptionist@hotel.com / receptionist123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
const main = async () => {
  await connectDB();
  await seedData();
};

main();
