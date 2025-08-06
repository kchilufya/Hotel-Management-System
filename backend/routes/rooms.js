const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all rooms
router.get('/', authMiddleware, checkPermission('viewRooms'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, floor } = req.query;
    
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (floor) filter.floor = parseInt(floor);

    const rooms = await Room.find(filter)
      .sort({ roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(filter);

    res.json({
      success: true,
      data: rooms,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get available rooms for date range
router.get('/available', authMiddleware, checkPermission('viewRooms'), async (req, res) => {
  try {
    const { checkIn, checkOut, type, capacity } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
    }

    const filter = { 
      isActive: true,
      status: 'available'
    };
    
    if (type) filter.type = type;
    if (capacity) filter['capacity.adults'] = { $gte: parseInt(capacity) };

    // Find rooms not booked during the requested period
    const Booking = require('../models/Booking');
    const bookedRooms = await Booking.find({
      $or: [
        {
          checkInDate: { $lt: new Date(checkOut) },
          checkOutDate: { $gt: new Date(checkIn) }
        }
      ],
      status: { $in: ['confirmed', 'checkedIn'] }
    }).distinct('rooms.room');

    filter._id = { $nin: bookedRooms };

    const rooms = await Room.find(filter).sort({ pricePerNight: 1 });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get room by ID
router.get('/:id', authMiddleware, checkPermission('viewRooms'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new room
router.post('/', [
  authMiddleware,
  checkPermission('createRooms'),
  body('roomNumber').notEmpty().trim(),
  body('floor').isInt({ min: 0 }),
  body('type').isIn(['single', 'double', 'triple', 'suite', 'deluxe', 'presidential']),
  body('category').isIn(['economy', 'standard', 'premium', 'luxury']),
  body('capacity.adults').isInt({ min: 1 }),
  body('pricePerNight').isFloat({ min: 0 }),
  body('bedConfiguration').isIn(['singleBed', 'doubleBed', 'twinBeds', 'kingBed', 'queenBed', 'sofaBed']),
  body('size').isFloat({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    const room = new Room(req.body);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update room
router.put('/:id', [
  authMiddleware,
  checkPermission('editRooms'),
  body('floor').optional().isInt({ min: 0 }),
  body('type').optional().isIn(['single', 'double', 'triple', 'suite', 'deluxe', 'presidential']),
  body('category').optional().isIn(['economy', 'standard', 'premium', 'luxury']),
  body('capacity.adults').optional().isInt({ min: 1 }),
  body('pricePerNight').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'cleaning', 'outOfOrder']),
  body('size').optional().isFloat({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete room (soft delete)
router.delete('/:id', authMiddleware, checkPermission('editRooms'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
