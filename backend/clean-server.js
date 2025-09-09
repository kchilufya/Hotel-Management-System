const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- SCHEMA DEFINITIONS ---

// Staff Schema
const staffSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security', 'concierge'], required: true },
  department: { type: String, enum: ['management', 'frontDesk', 'housekeeping', 'maintenance', 'security', 'concierge', 'admin'], required: true },
  permissions: [{ type: String }],
  hireDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  shift: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate employee ID before saving
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      let employeeId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const count = await this.constructor.countDocuments();
        employeeId = `EMP${String(count + 1 + attempts).padStart(4, '0')}`;
        const existing = await this.constructor.findOne({ employeeId });
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique) {
        employeeId = `EMP${Date.now().toString().slice(-4)}`;
      }

      this.employeeId = employeeId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Staff = mongoose.model('Staff', staffSchema);

// Room Schema
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['standard', 'deluxe', 'suite', 'executive'], required: true },
  category: { type: String, enum: ['standard', 'deluxe', 'suite', 'executive'], required: true },
  capacity: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  amenities: [String],
  bedConfiguration: { type: String, required: true },
  size: { type: Number, required: true },
  description: String,
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'out-of-order'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to ensure capacity is always a valid number
roomSchema.pre('save', function(next) {
  if (typeof this.capacity === 'object' && this.capacity !== null) {
    if (this.capacity.adults !== undefined) {
      this.capacity = (this.capacity.adults || 0) + (this.capacity.children || 0);
    } else {
      this.capacity = 1;
    }
  } else if (typeof this.capacity === 'string') {
    this.capacity = parseInt(this.capacity) || 1;
  }
  this.capacity = Math.max(1, parseInt(this.capacity) || 1);
  next();
});

const Room = mongoose.model('Room', roomSchema);

// Guest Schema
const guestSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  documentType: { type: String, enum: ['passport', 'nationalId', 'drivingLicense'], required: true },
  documentNumber: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  nationality: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  preferences: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  totalStays: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Guest = mongoose.model('Guest', guestSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  numberOfNights: { type: Number },
  roomRate: { type: Number, required: true },
  totalAmount: { type: Number },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
  bookingStatus: { type: String, enum: ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'], default: 'confirmed' },
  specialRequests: String,
  notes: String,
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `BK${year}${String(count + 1).padStart(4, '0')}`;
  }
  const timeDiff = this.checkOutDate.getTime() - this.checkInDate.getTime();
  this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  this.totalAmount = (this.roomRate * this.numberOfNights) + this.taxAmount - this.discountAmount;
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

// --- ROUTES ---

// Health check and root route
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Hotel Management API is running.' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Import and use public routes
const publicRoutes = require('./routes/public');
app.use('/api/public', publicRoutes);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const staff = await Staff.findById(decoded.id);
    
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user not active.' });
    }

    req.user = staff;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based permission middleware
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user;
    
    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }
    
    // Check if user has the specific permission
    if (user.permissions && user.permissions.includes(requiredPermission)) {
      return next();
    }
    
    // Check role-based permissions
    const rolePermissions = {
      'manager': [
        'read_staff', 'write_staff', 'read_rooms', 'write_rooms', 
        'read_bookings', 'write_bookings', 'read_guests', 'write_guests', 'read_reports'
      ],
      'receptionist': [
        'read_rooms', 'read_bookings', 'write_bookings', 'read_guests', 'write_guests'
      ],
      'housekeeping': [
        'read_rooms', 'read_bookings'
      ],
      'maintenance': [
        'read_rooms', 'write_rooms'
      ],
      'security': [
        'read_rooms', 'read_bookings', 'read_guests'
      ],
      'concierge': [
        'read_rooms', 'read_bookings', 'read_guests', 'write_guests'
      ]
    };
    
    const userRolePermissions = rolePermissions[user.role] || [];
    
    if (userRolePermissions.includes(requiredPermission)) {
      return next();
    }
    
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient permissions.',
      required: requiredPermission,
      userRole: user.role,
      userPermissions: user.permissions || []
    });
  };
};

// Role checking middleware (stricter role-based access)
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (allowedRoles.includes(user.role)) {
      return next();
    }
    
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient role privileges.',
      required: allowedRoles,
      userRole: user.role
    });
  };
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const staff = await Staff.findOne({ email });
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: staff._id, role: staff.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
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
          department: staff.department,
          permissions: staff.permissions || []
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
        department: staff.department,
        permissions: staff.permissions || []
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Room endpoints
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

app.post('/api/rooms', async (req, res) => {
  try {
    const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    const room = new Room(req.body);
    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Updating room with ID:', req.params.id);
    console.log('Update data received:', req.body);
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log('Room not found with ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    console.log('Current room data:', room.toObject());
    console.log('Current room capacity:', JSON.stringify(room.capacity), 'Type:', typeof room.capacity);

    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (existingRoom) {
        console.log('Room number already exists:', req.body.roomNumber);
        return res.status(400).json({
          success: false,
          message: 'Room number already exists'
        });
      }
    }

    // Handle special fields that need validation/conversion
    const updateData = { ...req.body };
    console.log('Update data before processing:', JSON.stringify(updateData, null, 2));
    
    // Convert capacity to number if it's an object or string
    if (updateData.capacity !== undefined) {
      console.log('Processing capacity from updateData:', JSON.stringify(updateData.capacity), 'Type:', typeof updateData.capacity);
      if (typeof updateData.capacity === 'object' && updateData.capacity !== null) {
        // If capacity is an object like { adults: 1, children: 1 }, convert to total
        if (updateData.capacity.adults !== undefined) {
          updateData.capacity = (updateData.capacity.adults || 0) + (updateData.capacity.children || 0);
        } else {
          updateData.capacity = 1; // Default fallback
        }
      } else if (typeof updateData.capacity === 'string') {
        updateData.capacity = parseInt(updateData.capacity) || 1;
      }
      // Ensure it's a positive number
      updateData.capacity = Math.max(1, parseInt(updateData.capacity) || 1);
      console.log('Processed capacity:', updateData.capacity);
    } else {
      console.log('No capacity field in updateData - checking existing room capacity');
      if (typeof room.capacity === 'object' && room.capacity !== null) {
        console.log('Found object capacity in existing room, converting...');
        if (room.capacity.adults !== undefined) {
          room.capacity = (room.capacity.adults || 0) + (room.capacity.children || 0);
        } else {
          room.capacity = 1;
        }
        console.log('Converted existing room capacity to:', room.capacity);
      }
    }

    console.log('Final updateData:', JSON.stringify(updateData, null, 2));

    Object.assign(room, updateData);
    room.updatedAt = new Date();
    await room.save();

    console.log('Room updated successfully:', room.toObject());
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

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

// Guest Routes
// Get all guests with pagination and filtering
app.get('/api/guests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    if (req.query.vipStatus) {
      filter.vipStatus = req.query.vipStatus;
    }
    if (req.query.nationality) {
      filter.nationality = new RegExp(req.query.nationality, 'i');
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const guests = await Guest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalGuests = await Guest.countDocuments(filter);
    const totalPages = Math.ceil(totalGuests / limit);

    res.json({
      success: true,
      data: {
        guests,
        totalPages,
        currentPage: page,
        totalGuests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get guest by ID
app.get('/api/guests/:id', async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new guest
app.post('/api/guests', async (req, res) => {
  try {
    console.log('📝 Guest creation request received:', JSON.stringify(req.body, null, 2));
    
    const guestData = {
      ...req.body,
      updatedAt: new Date()
    };

    const guest = new Guest(guestData);
    await guest.save();

    console.log('✅ Guest created successfully:', guest.firstName, guest.lastName);
    res.status(201).json({
      success: true,
      message: 'Guest created successfully',
      data: guest
    });
  } catch (error) {
    console.error('❌ Guest creation error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: `Validation error: ${error.message}`
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update guest
app.put('/api/guests/:id', async (req, res) => {
  try {
    const guestData = {
      ...req.body,
      updatedAt: new Date()
    };

    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      guestData,
      { new: true, runValidators: true }
    );

    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    res.json({
      success: true,
      message: 'Guest updated successfully',
      data: guest
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete guest
app.delete('/api/guests/:id', async (req, res) => {
  try {
    const guest = await Guest.findByIdAndDelete(req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Temporary reset endpoint to recreate sample data
app.post('/api/guests/reset', async (req, res) => {
  try {
    // Drop all guests
    await Guest.deleteMany({});
    
    // Recreate sample data
    const sampleGuests = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0101',
        address: '123 Main St, New York, NY 10001, USA',
        documentType: 'passport',
        documentNumber: 'US123456789',
        dateOfBirth: new Date('1985-06-15'),
        nationality: 'American',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'spouse',
          phone: '+1-555-0102'
        },
        preferences: ['non-smoking', 'late checkout', 'high floor'],
        status: 'active',
        totalStays: 15,
        totalSpent: 8500,
        notes: 'Preferred guest, likes room service'
      },
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@email.com',
        phone: '+44-20-7946-0958',
        address: '45 Baker Street, London, England NW1 6XE, UK',
        documentType: 'passport',
        documentNumber: 'GB987654321',
        dateOfBirth: new Date('1990-03-22'),
        nationality: 'British',
        emergencyContact: {
          name: 'Robert Wilson',
          relationship: 'father',
          phone: '+44-20-7946-0959'
        },
        preferences: ['non-smoking', 'quiet room', 'extra pillows'],
        status: 'active',
        totalStays: 8,
        totalSpent: 3200,
        notes: 'Business traveler, prefers early check-in'
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+34-91-123-4567',
        address: 'Calle Mayor 100, Madrid 28013, Spain',
        documentType: 'nationalId',
        documentNumber: 'ES12345678Z',
        dateOfBirth: new Date('1982-11-08'),
        nationality: 'Spanish',
        emergencyContact: {
          name: 'Maria Rodriguez',
          relationship: 'wife',
          phone: '+34-91-123-4568'
        },
        preferences: ['non-smoking', 'city view'],
        status: 'active',
        totalStays: 3,
        totalSpent: 890,
        notes: 'Vacationing with family'
      }
    ];

    await Guest.insertMany(sampleGuests);
    res.json({ success: true, message: 'Sample guest data recreated successfully' });
  } catch (error) {
    console.error('Error resetting guest data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get guest statistics
app.get('/api/guests/stats/overview', async (req, res) => {
  try {
    const totalGuests = await Guest.countDocuments();
    const activeGuests = await Guest.countDocuments({ isActive: true });
    const vipGuests = await Guest.countDocuments({ vipStatus: { $ne: 'regular' } });

    const guestsByVipStatus = await Guest.aggregate([
      { $group: { _id: '$vipStatus', count: { $sum: 1 } } }
    ]);

    const guestsByNationality = await Guest.aggregate([
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalRevenue = await Guest.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalGuests,
        activeGuests,
        vipGuests,
        guestsByVipStatus,
        guestsByNationality,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Booking Endpoints

// Get all bookings with pagination and filtering
app.get('/api/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, guest, room, checkIn, checkOut } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    if (status) filter.bookingStatus = status;
    if (guest) filter.guest = guest;
    if (room) filter.room = room;
    if (checkIn || checkOut) {
      filter.checkInDate = {};
      if (checkIn) filter.checkInDate.$gte = new Date(checkIn);
      if (checkOut) filter.checkInDate.$lte = new Date(checkOut);
    }

    const bookings = await Booking.find(filter)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type status')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings,
        totalPages,
        currentPage: parseInt(page),
        totalBookings
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('guest')
      .populate('room')
      .populate('createdBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('📝 Booking creation request received:', JSON.stringify(req.body, null, 2));
    
    const {
      guest,
      room,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      roomRate,
      specialRequests,
      notes,
      discountAmount = 0,
      taxAmount = 0
    } = req.body;

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Validate room rate against actual room price
    const selectedRoom = await Room.findById(room);
    if (!selectedRoom) {
      return res.status(400).json({
        success: false,
        message: 'Selected room not found'
      });
    }

    // Optional: Validate that the provided room rate matches the room's current rate
    // This ensures data consistency
    if (Math.abs(roomRate - selectedRoom.pricePerNight) > 0.01) {
      console.log(`Room rate mismatch: provided ${roomRate}, actual ${selectedRoom.pricePerNight}`);
      // You can either reject the booking or use the actual room rate
      // For now, let's use the actual room rate for consistency
    }

    // Use the actual room rate from the database for consistency
    const actualRoomRate = selectedRoom.pricePerNight;

    // Check room availability
    const existingBooking = await Booking.findOne({
      room,
      bookingStatus: { $nin: ['cancelled', 'checked-out'] },
      $or: [
        {
          checkInDate: { $lte: checkIn },
          checkOutDate: { $gt: checkIn }
        },
        {
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gte: checkOut }
        },
        {
          checkInDate: { $gte: checkIn },
          checkOutDate: { $lte: checkOut }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Room is not available for the selected dates'
      });
    }

    // Get user ID from JWT token (assuming you have auth middleware)
    const createdBy = req.user?.id || '689265c3b219b4dd42b58758'; // Fallback to admin ID

    const bookingData = {
      guest,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      roomRate: actualRoomRate, // Use the actual room rate from database
      specialRequests,
      notes,
      discountAmount,
      taxAmount,
      createdBy
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Update room status to occupied if check-in is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn.getTime() === today.getTime()) {
      await Room.findByIdAndUpdate(room, { status: 'occupied' });
    }

    // Populate the saved booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type')
      .populate('createdBy', 'firstName lastName');

    console.log('✅ Booking created successfully:', booking.bookingNumber);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error('❌ Booking creation error:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: `Validation error: ${error.message}`
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // If room is being updated, validate the room rate
    let updateData = { ...req.body, updatedAt: new Date() };
    
    if (req.body.room && req.body.roomRate !== undefined) {
      const selectedRoom = await Room.findById(req.body.room);
      if (selectedRoom) {
        // Use the actual room rate from the database for consistency
        updateData.roomRate = selectedRoom.pricePerNight;
        console.log(`Updated room rate from ${req.body.roomRate} to ${selectedRoom.pricePerNight} based on room selection`);
      }
    }
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('guest', 'firstName lastName email phone')
    .populate('room', 'roomNumber type')
    .populate('createdBy', 'firstName lastName');

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cancel booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update room status back to available
    await Room.findByIdAndUpdate(booking.room, { status: 'available' });

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check-in booking
app.post('/api/bookings/:id/checkin', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: 'checked-in', updatedAt: new Date() },
      { new: true }
    ).populate('guest', 'firstName lastName')
    .populate('room', 'roomNumber type');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update room status to occupied
    await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });

    res.json({
      success: true,
      message: 'Guest checked in successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error checking in guest:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check-out booking
app.post('/api/bookings/:id/checkout', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: 'checked-out', updatedAt: new Date() },
      { new: true }
    ).populate('guest', 'firstName lastName')
    .populate('room', 'roomNumber type');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update room status to maintenance (needs cleaning)
    await Room.findByIdAndUpdate(booking.room._id, { status: 'maintenance' });

    res.json({
      success: true,
      message: 'Guest checked out successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error checking out guest:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get booking statistics
app.get('/api/bookings/stats/overview', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ 
      bookingStatus: { $in: ['confirmed', 'checked-in'] } 
    });
    const checkedInToday = await Booking.countDocuments({
      bookingStatus: 'checked-in',
      checkInDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const checkingOutToday = await Booking.countDocuments({
      bookingStatus: 'checked-in',
      checkOutDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        activeBookings,
        checkedInToday,
        checkingOutToday,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =======================
// STAFF MANAGEMENT ROUTES
// =======================

// Get all staff members
app.get('/api/staff', authenticateToken, checkPermission('read_staff'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search, isActive } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const staff = await Staff.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalStaff = await Staff.countDocuments(filter);
    const totalPages = Math.ceil(totalStaff / limit);

    res.json({
      success: true,
      data: {
        staff,
        currentPage: parseInt(page),
        totalPages,
        totalStaff,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff members',
      error: error.message
    });
  }
});

// Get staff member by ID
app.get('/api/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error: error.message
    });
  }
});

// Create new staff member (Admin and Manager only)
app.post('/api/staff', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      role, 
      department, 
      permissions = [], 
      hireDate, 
      salary, 
      shift 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !role || !department || !hireDate || !salary || !shift) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if staff member already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    // Create new staff member (password will be hashed by pre-save hook)
    const newStaff = new Staff({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      department,
      permissions,
      hireDate: new Date(hireDate),
      salary: parseFloat(salary),
      shift,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedStaff = await newStaff.save();

    // Return staff without password
    const staffResponse = {
      _id: savedStaff._id,
      employeeId: savedStaff.employeeId,
      firstName: savedStaff.firstName,
      lastName: savedStaff.lastName,
      email: savedStaff.email,
      phone: savedStaff.phone,
      role: savedStaff.role,
      department: savedStaff.department,
      permissions: savedStaff.permissions,
      hireDate: savedStaff.hireDate,
      salary: savedStaff.salary,
      shift: savedStaff.shift,
      isActive: savedStaff.isActive,
      createdAt: savedStaff.createdAt,
      updatedAt: savedStaff.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staffResponse
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
});

// Update staff member (Admin and Manager only)
app.put('/api/staff/:id', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { firstName, lastName, email, role, department, isActive } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingStaff = await Staff.findOne({ email, _id: { $ne: req.params.id } });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another staff member'
        });
      }
    }

    const updateData = {
      firstName,
      lastName,
      email,
      role,
      department,
      isActive,
      updatedAt: new Date()
    };

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message
    });
  }
});

// Update staff password (Admin and Manager only)
app.put('/api/staff/:id/password', authenticateToken, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
});

// Delete staff member (soft delete) - Admin only
app.delete('/api/staff/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deactivated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate staff member',
      error: error.message
    });
  }
});

// Get staff statistics
app.get('/api/staff/stats/overview', async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments({});
    const activeStaff = await Staff.countDocuments({ isActive: true });
    const inactiveStaff = await Staff.countDocuments({ isActive: false });

    // Staff by role
    const staffByRole = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Staff by department
    const staffByDepartment = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent staff (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStaff = await Staff.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        inactiveStaff,
        recentStaff,
        staffByRole,
        staffByDepartment
      }
    });
  } catch (error) {
    console.error('Staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff statistics',
      error: error.message
    });
  }
});

// Get staff by role
app.get('/api/staff/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const staff = await Staff.find({ role, isActive: true })
      .select('-password')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff by role',
      error: error.message
    });
  }
});

app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await Staff.find({}, 'firstName lastName email role').limit(10);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// REPORTS ROUTES
// ========================

// Dashboard overview
app.get('/api/reports/dashboard', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    console.log('📊 Dashboard reports endpoint called');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`📅 Date range - Today: ${today.toISOString()}, Tomorrow: ${tomorrow.toISOString()}`);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalGuests,
      totalStaff,
      todayArrivals,
      todayDepartures,
      todayCheckouts,
      pendingBookings,
      revenueToday
    ] = await Promise.all([
      Room.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: true, status: 'available' }),
      Room.countDocuments({ isActive: true, status: 'occupied' }),
      Guest.countDocuments({ status: 'active' }),
      Staff.countDocuments({ isActive: true }),
      Booking.countDocuments({
        checkInDate: { $gte: today, $lt: tomorrow },
        bookingStatus: { $in: ['confirmed', 'checked-in'] }
      }),
      Booking.countDocuments({
        checkOutDate: { $gte: today, $lt: tomorrow },
        bookingStatus: 'checked-in'
      }),
      Booking.countDocuments({
        checkOutDate: { $gte: today, $lt: tomorrow },
        bookingStatus: 'checked-out'
      }),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.aggregate([
        {
          $match: {
            checkOutDate: { $gte: today, $lt: tomorrow },
            bookingStatus: 'checked-out',
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;
    
    console.log('📊 Dashboard statistics calculated:');
    console.log(`   Total Rooms: ${totalRooms}`);
    console.log(`   Available Rooms: ${availableRooms}`);
    console.log(`   Occupied Rooms: ${occupiedRooms}`);
    console.log(`   Occupancy Rate: ${occupancyRate}%`);
    console.log(`   Total Guests: ${totalGuests}`);
    console.log(`   Total Staff: ${totalStaff}`);
    console.log(`   Today's Arrivals: ${todayArrivals}`);
    console.log(`   Today's Departures: ${todayDepartures}`);
    console.log(`   Today's Checkouts: ${todayCheckouts}`);
    console.log(`   Pending Bookings: ${pendingBookings}`);
    console.log(`   Revenue Today: ${revenueToday[0]?.total || 0}`);

    const recentBookings = await Booking.find()
      .populate('guest', 'firstName lastName')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        statistics: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate: parseFloat(occupancyRate),
          totalGuests,
          totalStaff,
          todayArrivals,
          todayDepartures,
          todayCheckouts,
          pendingBookings,
          revenueToday: revenueToday[0]?.total || 0
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Revenue report
app.get('/api/reports/revenue', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    let groupFormat;
    switch (groupBy) {
      case 'month':
        groupFormat = '%Y-%m';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const revenue = await Booking.aggregate([
      {
        $match: {
          checkOutDate: { $gte: start, $lte: end },
          bookingStatus: 'checked-out',
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$checkOutDate'
            }
          },
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalBookings = revenue.reduce((sum, item) => sum + item.bookingCount, 0);

    res.json({
      success: true,
      data: {
        revenue,
        summary: {
          totalRevenue,
          totalBookings,
          averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
        }
      }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Occupancy report
app.get('/api/reports/occupancy', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const totalRooms = await Room.countDocuments({ isActive: true });

    const occupancy = await Booking.aggregate([
      {
        $match: {
          $or: [
            {
              checkInDate: { $lte: end },
              checkOutDate: { $gte: start }
            }
          ],
          bookingStatus: { $in: ['confirmed', 'checked-in', 'checked-out'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$checkInDate'
            }
          },
          occupiedRooms: { $sum: 1 }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedRooms', totalRooms] },
              100
            ]
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        occupancy,
        totalRooms
      }
    });
  } catch (error) {
    console.error('Occupancy report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Guest demographics report
app.get('/api/reports/demographics', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    const [nationalityStats, vipStats, monthlyGuests] = await Promise.all([
      Guest.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$nationality',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Guest.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: { $ifNull: ['$vipStatus', 'regular'] },
            count: { $sum: 1 }
          }
        }
      ]), // <-- REMOVE THE COMMA HERE
      Guest.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        nationalityStats,
        vipStats,
        monthlyGuests
      }
    });
  } catch (error) {
    console.error('Demographics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Room performance report
app.get('/api/reports/room-performance', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const roomPerformance = await Booking.aggregate([
      {
        $match: {
          checkOutDate: { $gte: start, $lte: end },
          bookingStatus: 'checked-out'
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomDetails'
        }
      },
      {
        $unwind: '$roomDetails'
      },
      {
        $group: {
          _id: {
            roomId: '$roomDetails._id',
            roomNumber: '$roomDetails.roomNumber',
            type: '$roomDetails.type',
            floor: '$roomDetails.floor'
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageRevenue: { $avg: '$totalAmount' },
          totalNights: { $sum: '$numberOfNights' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.json({
      success: true,
      data: roomPerformance
    });
  } catch (error) {
    console.error('Room performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Booking source analysis (simplified - assuming all bookings are direct for now)
app.get('/api/reports/booking-sources', authenticateToken, checkPermission('read_reports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const bookingSources = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: 'Direct Booking', // For now, all are direct bookings
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Add other mock sources for demonstration
    const sources = [
      { _id: 'Direct Booking', count: bookingSources[0]?.count || 0, totalRevenue: bookingSources[0]?.totalRevenue || 0 },
      { _id: 'Online Travel Agencies', count: 0, totalRevenue: 0 },
      { _id: 'Walk-in', count: 0, totalRevenue: 0 },
      { _id: 'Corporate', count: 0, totalRevenue: 0 }
    ];

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Booking sources report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get(/^(?!\/api\/).*/, function(req, res) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// --- SERVER STARTUP LOGIC ---

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/hotel_management');
    console.log('✅ MongoDB connected');

    // Admin user creation
    const adminExists = await Staff.findOne({ email: 'admin@hotel.com' });
    if (!adminExists) {
      const adminUser = new Staff({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hotel.com',
        phone: '+1234567890',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        department: 'management',
        hireDate: new Date(),
        salary: 60000,
        shift: 'morning',
        isActive: true
      });
      await adminUser.save();
      console.log('👤 Admin user created');
    }

    // Create sample staff members if they don't exist
    const staffCount = await Staff.countDocuments({ email: { $ne: 'admin@hotel.com' } });
    if (staffCount === 0) {
      const sampleStaff = [
        {
          firstName: 'John',
          lastName: 'Manager',
          email: 'john.manager@hotel.com',
          phone: '+1234567890',
          password: await bcrypt.hash('password123', 12),
          role: 'manager',
          department: 'management',
          hireDate: new Date('2025-08-01'),
          salary: 50000,
          shift: 'morning',
          isActive: true
        },
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@hotel.com',
          phone: '+1234567891',
          password: await bcrypt.hash('password123', 12),
          role: 'receptionist',
          department: 'frontDesk',
          hireDate: new Date('2025-08-02'),
          salary: 35000,
          shift: 'afternoon',
          isActive: true
        },
        {
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@hotel.com',
          phone: '+1234567892',
          password: await bcrypt.hash('password123', 12),
          role: 'receptionist',
          department: 'frontDesk',
          hireDate: new Date('2025-08-03'),
          salary: 34000,
          shift: 'evening',
          isActive: true
        },
        {
          firstName: 'Maria',
          lastName: 'Rodriguez',
          email: 'maria.rodriguez@hotel.com',
          phone: '+1234567893',
          password: await bcrypt.hash('password123', 12),
          role: 'housekeeping',
          department: 'housekeeping',
          hireDate: new Date('2025-08-04'),
          salary: 32000,
          shift: 'morning',
          isActive: true
        },
        {
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@hotel.com',
          phone: '+1234567894',
          password: await bcrypt.hash('password123', 12),
          role: 'housekeeping',
          department: 'housekeeping',
          hireDate: new Date('2025-08-05'),
          salary: 32000,
          shift: 'afternoon',
          isActive: true
        },
        {
          firstName: 'Lisa',
          lastName: 'Chen',
          email: 'lisa.chen@hotel.com',
          phone: '+1234567895',
          password: await bcrypt.hash('password123', 12),
          role: 'manager',
          department: 'management',
          hireDate: new Date('2025-08-06'),
          salary: 48000,
          shift: 'morning',
          isActive: true
        },
        {
          firstName: 'Robert',
          lastName: 'Taylor',
          email: 'robert.taylor@hotel.com',
          phone: '+1234567896',
          password: await bcrypt.hash('password123', 12),
          role: 'receptionist',
          department: 'frontDesk',
          hireDate: new Date('2025-08-07'),
          salary: 33000,
          shift: 'night',
          isActive: false
        }
      ];

      await Staff.insertMany(sampleStaff);
      console.log('👥 Sample staff created');
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

    // Clean up old Guest indexes to avoid conflicts
    try {
      await Guest.collection.dropIndexes();
      console.log('🧹 Old guest indexes dropped');
    } catch (error) {
      console.log('ℹ️ No guest indexes to drop (collection might be new)');
    }

    // Create sample guests if they don't exist
    const guestCount = await Guest.countDocuments();
    if ( guestCount === 0) {
      const sampleGuests = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+1-555-0101',
          address: '123 Main St, New York, NY 10001, USA',
          documentType: 'passport',
          documentNumber: 'US123456789',
          dateOfBirth: new Date('1985-06-15'),
          nationality: 'American',
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'spouse',
            phone: '+1-555-0102'
          },
          preferences: ['non-smoking', 'late checkout', 'high floor'],
          status: 'active',
          totalStays: 15,
          totalSpent: 8500,
          notes: 'Preferred guest, likes room service'
        },
        {
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma.wilson@email.com',
          phone: '+44-20-7946-0958',
          address: '45 Baker Street, London, England NW1 6XE, UK',
          documentType: 'passport',
          documentNumber: 'GB987654321',
          dateOfBirth: new Date('1990-03-22'),
          nationality: 'British',
          emergencyContact: {
            name: 'Robert Wilson',
            relationship: 'father',
            phone: '+44-20-7946-0959'
          },
          preferences: ['non-smoking', 'quiet room', 'extra pillows'],
          status: 'active',
          totalStays: 8,
          totalSpent: 3200,
          notes: 'Business traveler, prefers early check-in'
        },
        {
          firstName: 'Carlos',
          lastName: 'Rodriguez',
          email: 'carlos.rodriguez@email.com',
          phone: '+34-91-123-4567',
          address: 'Calle Mayor 100, Madrid 28013, Spain',
          documentType: 'nationalId',
          documentNumber: 'ES12345678Z',
          dateOfBirth: new Date('1982-11-08'),
          nationality: 'Spanish',
          emergencyContact: {
            name: 'Maria Rodriguez',
            relationship: 'wife',
            phone: '+34-91-123-4568'
          },
          preferences: ['non-smoking', 'city view'],
          status: 'active',
          totalStays: 3,
          totalSpent: 890,
          notes: 'Vacationing with family'
        }
      ];

      await Guest.insertMany(sampleGuests);
      console.log('👥 Sample guests created');
    }

    // Create sample bookings if they don't exist
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      // Get some existing guests and rooms for bookings
      const guests = await Guest.find().limit(3);
      const rooms = await Room.find({ status: 'available' }).limit(3);
      const admin = await Staff.findOne({ email: 'admin@hotel.com' });

      if (guests.length > 0 && rooms.length > 0 && admin) {
        const sampleBookings = [
          {
            bookingNumber: 'BK20250001',
            guest: guests[0]._id,
            room: rooms[0]._id,
            checkInDate: new Date('2025-08-10'),
            checkOutDate: new Date('2025-08-15'),
            numberOfGuests: 2,
            numberOfNights: 5,
            roomRate: 150,
            totalAmount: 765, // (150 * 5) + 15 - 0
            specialRequests: 'Late check-in requested',
            notes: 'VIP guest, provide welcome amenities',
            taxAmount: 15,
            discountAmount: 0,
            paymentStatus: 'paid',
            bookingStatus: 'confirmed',
            createdBy: admin._id
          },
          {
            bookingNumber: 'BK20250002',
            guest: guests[1]._id,
            room: rooms[1]._id,
            checkInDate: new Date('2025-08-08'),
            checkOutDate: new Date('2025-08-12'),
            numberOfGuests: 1,
            numberOfNights: 4,
            roomRate: 120,
            totalAmount: 492, // (120 * 4) + 12 - 10
            specialRequests: 'Quiet room preferred',
            notes: 'Business traveler',
            taxAmount: 12,
            discountAmount: 10,
            paymentStatus: 'partial',
            bookingStatus: 'confirmed',
            createdBy: admin._id
          },
          {
            bookingNumber: 'BK20250003',
            guest: guests[2]._id,
            room: rooms[2]._id,
            checkInDate: new Date('2025-08-06'),
            checkOutDate: new Date('2025-08-09'),
            numberOfGuests: 2,
            numberOfNights: 3,
            roomRate: 200,
            totalAmount: 620, // (200 * 3) + 20 - 20
            specialRequests: 'Early check-in if possible',
            notes: 'Honeymoon couple',
            taxAmount: 20,
            discountAmount: 20,
            paymentStatus: 'paid',
            bookingStatus: 'checked-in',
            createdBy: admin._id
          }
        ];

        await Booking.insertMany(sampleBookings);
        console.log('📅 Sample bookings created');
      }
    }

    // Only start server if not running under Passenger
    if (!module.parent) {
      const PORT = process.env.PORT || 5003;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
  }
}

startServer();

module.exports = app;