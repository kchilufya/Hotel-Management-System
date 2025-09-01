require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple Staff schema for testing
const staffSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  department: String,
  employeeId: String,
  isActive: { type: Boolean, default: true }
});

// Room schema
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, required: true, enum: ['single', 'double', 'suite', 'deluxe'] },
  category: { type: String, required: true, enum: ['economy', 'standard', 'premium', 'luxury'] },
  capacity: {
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 }
  },
  pricePerNight: { type: Number, required: true },
  amenities: [String],
  bedConfiguration: { type: String, required: true },
  size: { type: Number, required: true }, // in square meters
  status: { 
    type: String, 
    required: true, 
    enum: ['available', 'occupied', 'maintenance', 'out-of-order'],
    default: 'available'
  },
  description: String,
  images: [String],
  lastCleaned: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Staff = mongoose.model('Staff', staffSchema);
const Room = mongoose.model('Room', roomSchema);

// Simple login route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    // Find staff member
    const staff = await Staff.findOne({ email, isActive: true });
    console.log('Found staff:', staff ? 'Yes' : 'No');
    
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - user not found'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, staff.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - wrong password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: staff._id, email: staff.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        staff: {
          id: staff._id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          role: staff.role,
          department: staff.department
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Get current user (for auth check)
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const staff = await Staff.findById(decoded.id);
    
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    res.json({
      success: true,
      data: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        department: staff.department
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ROOM MANAGEMENT ENDPOINTS

// Get all rooms with filtering and pagination
app.get('/api/rooms', async (req, res) => {
  console.log('🏨 GET /api/rooms endpoint hit');
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      category, 
      floor,
      search 
    } = req.query;

    console.log('Query params:', req.query);

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (floor) filter.floor = parseInt(floor);
    if (search) {
      filter.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Filter:', filter);

    const rooms = await Room.find(filter)
      .sort({ roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(filter);

    console.log(`Found ${rooms.length} rooms out of ${total} total`);

    res.json({
      success: true,
      data: {
        rooms,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalRooms: total
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single room by ID
app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new room
app.post('/api/rooms', async (req, res) => {
  try {
    const {
      roomNumber,
      floor,
      type,
      category,
      capacity,
      pricePerNight,
      amenities,
      bedConfiguration,
      size,
      description,
      status = 'available'
    } = req.body;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    const room = new Room({
      roomNumber,
      floor,
      type,
      category,
      capacity,
      pricePerNight,
      amenities,
      bedConfiguration,
      size,
      description,
      status
    });

    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update room
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if room number is being changed and if it already exists
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists'
        });
      }
    }

    Object.assign(room, req.body);
    room.updatedAt = new Date();
    await room.save();

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete room
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get room statistics
app.get('/api/rooms/stats/overview', async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    const outOfOrderRooms = await Room.countDocuments({ status: 'out-of-order' });

    const roomsByType = await Room.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const roomsByFloor = await Room.aggregate([
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        outOfOrderRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        roomsByType,
        roomsByFloor
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List all users (for debugging)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await Staff.find({}, 'firstName lastName email role').limit(10);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('🧪 Test route hit');
  res.json({ message: 'Test route working' });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management');
    console.log('✅ MongoDB connected');
    
    // Create admin user if it doesn't exist
    const adminExists = await Staff.findOne({ email: 'admin@hotel.com' });
    if (!adminExists) {
      const adminUser = new Staff({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hotel.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        department: 'management',
        isActive: true
      });
      await adminUser.save();
      console.log('👤 Admin user created');
    }

    // Create sample rooms if they don't exist
    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      const sampleRooms = [
        {
          roomNumber: '101',
          floor: 1,
          type: 'standard',
          category: 'deluxe',
          capacity: 2,
          pricePerNight: 150,
          amenities: ['WiFi', 'Air Conditioning', 'Mini Bar', 'TV'],
          bedConfiguration: '1 King Bed',
          size: 30,
          description: 'Comfortable deluxe room with city view',
          status: 'available'
        },
        {
          roomNumber: '102',
          floor: 1,
          type: 'standard',
          category: 'standard',
          capacity: 2,
          pricePerNight: 120,
          amenities: ['WiFi', 'Air Conditioning', 'TV'],
          bedConfiguration: '2 Twin Beds',
          size: 25,
          description: 'Standard room with garden view',
          status: 'available'
        },
        {
          roomNumber: '201',
          floor: 2,
          type: 'suite',
          category: 'suite',
          capacity: 4,
          pricePerNight: 300,
          amenities: ['WiFi', 'Air Conditioning', 'Mini Bar', 'TV', 'Kitchenette', 'Balcony'],
          bedConfiguration: '1 King Bed + Sofa Bed',
          size: 60,
          description: 'Luxury suite with panoramic city view',
          status: 'occupied'
        },
        {
          roomNumber: '202',
          floor: 2,
          type: 'standard',
          category: 'deluxe',
          capacity: 3,
          pricePerNight: 180,
          amenities: ['WiFi', 'Air Conditioning', 'Mini Bar', 'TV', 'Balcony'],
          bedConfiguration: '1 King Bed + 1 Single Bed',
          size: 35,
          description: 'Deluxe room perfect for families',
          status: 'available'
        },
        {
          roomNumber: '301',
          floor: 3,
          type: 'standard',
          category: 'standard',
          capacity: 2,
          pricePerNight: 130,
          amenities: ['WiFi', 'Air Conditioning', 'TV'],
          bedConfiguration: '1 Queen Bed',
          size: 28,
          description: 'Cozy standard room with mountain view',
          status: 'maintenance'
        }
      ];

      await Room.insertMany(sampleRooms);
      console.log('🏨 Sample rooms created');
    }

    // Start server
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`🚀 Simple server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

startServer();
