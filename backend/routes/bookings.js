const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all bookings
router.get('/', authMiddleware, checkPermission('viewBookings'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, checkInDate, checkOutDate } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (checkInDate && checkOutDate) {
      filter.checkInDate = { $gte: new Date(checkInDate) };
      filter.checkOutDate = { $lte: new Date(checkOutDate) };
    }

    const bookings = await Booking.find(filter)
      .populate('guest', 'firstName lastName email phone')
      .populate('rooms.room', 'roomNumber type floor')
      .populate('checkedInBy', 'firstName lastName')
      .populate('checkedOutBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get today's arrivals
router.get('/arrivals/today', authMiddleware, checkPermission('viewBookings'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const arrivals = await Booking.find({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'checkedIn'] }
    })
    .populate('guest', 'firstName lastName email phone')
    .populate('rooms.room', 'roomNumber type')
    .sort({ checkInDate: 1 });

    res.json({
      success: true,
      data: arrivals
    });
  } catch (error) {
    console.error('Get arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get today's departures
router.get('/departures/today', authMiddleware, checkPermission('viewBookings'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const departures = await Booking.find({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: 'checkedIn'
    })
    .populate('guest', 'firstName lastName email phone')
    .populate('rooms.room', 'roomNumber type')
    .sort({ checkOutDate: 1 });

    res.json({
      success: true,
      data: departures
    });
  } catch (error) {
    console.error('Get departures error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, checkPermission('viewBookings'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('guest')
      .populate('rooms.room')
      .populate('checkedInBy', 'firstName lastName')
      .populate('checkedOutBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new booking
router.post('/', [
  authMiddleware,
  checkPermission('createBookings'),
  body('guest').isMongoId(),
  body('rooms').isArray({ min: 1 }),
  body('rooms.*.room').isMongoId(),
  body('rooms.*.guests.adults').isInt({ min: 1 }),
  body('checkInDate').isISO8601(),
  body('checkOutDate').isISO8601(),
  body('totalAmount').isFloat({ min: 0 })
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

    const { guest, rooms, checkInDate, checkOutDate, totalAmount } = req.body;

    // Validate dates
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Check if guest exists
    const guestExists = await Guest.findById(guest);
    if (!guestExists) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    // Check room availability
    const roomIds = rooms.map(r => r.room);
    const conflictingBookings = await Booking.find({
      'rooms.room': { $in: roomIds },
      status: { $in: ['confirmed', 'checkedIn'] },
      $or: [
        {
          checkInDate: { $lt: new Date(checkOutDate) },
          checkOutDate: { $gt: new Date(checkInDate) }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more rooms are not available for the selected dates'
      });
    }

    // Check if rooms exist and are available
    const roomDocs = await Room.find({ _id: { $in: roomIds }, status: 'available' });
    if (roomDocs.length !== roomIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more rooms are not available'
      });
    }

    // Create booking
    const booking = new Booking({
      ...req.body,
      createdBy: req.staff._id
    });

    await booking.save();

    // Update room status to occupied if check-in is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);

    if (checkIn.getTime() === today.getTime()) {
      await Room.updateMany(
        { _id: { $in: roomIds } },
        { status: 'occupied' }
      );
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('guest', 'firstName lastName email phone')
      .populate('rooms.room', 'roomNumber type floor');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check-in guest
router.post('/:id/checkin', authMiddleware, checkPermission('checkIn'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('rooms.room');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed before check-in'
      });
    }

    // Update booking status
    booking.status = 'checkedIn';
    booking.actualCheckInDate = new Date();
    booking.checkedInBy = req.staff._id;
    await booking.save();

    // Update room status
    const roomIds = booking.rooms.map(r => r.room._id);
    await Room.updateMany(
      { _id: { $in: roomIds } },
      { status: 'occupied' }
    );

    // Update guest stats
    await Guest.findByIdAndUpdate(booking.guest, {
      $inc: { totalStays: 1 }
    });

    res.json({
      success: true,
      message: 'Guest checked in successfully',
      data: booking
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check-out guest
router.post('/:id/checkout', authMiddleware, checkPermission('checkOut'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('rooms.room')
      .populate('guest');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'checkedIn') {
      return res.status(400).json({
        success: false,
        message: 'Guest must be checked in before check-out'
      });
    }

    // Calculate any additional charges or fees
    const { additionalCharges = [] } = req.body;
    let totalAdditionalCharges = 0;
    
    if (additionalCharges.length > 0) {
      totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      booking.additionalCharges.push(...additionalCharges);
      booking.totalAmount += totalAdditionalCharges;
    }

    // Update booking status
    booking.status = 'checkedOut';
    booking.actualCheckOutDate = new Date();
    booking.checkedOutBy = req.staff._id;
    await booking.save();

    // Update room status
    const roomIds = booking.rooms.map(r => r.room._id);
    await Room.updateMany(
      { _id: { $in: roomIds } },
      { status: 'cleaning' }
    );

    // Update guest stats
    await Guest.findByIdAndUpdate(booking.guest._id, {
      $inc: { totalSpent: booking.totalAmount }
    });

    res.json({
      success: true,
      message: 'Guest checked out successfully',
      data: booking,
      additionalCharges: totalAdditionalCharges
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel booking
router.post('/:id/cancel', [
  authMiddleware,
  checkPermission('cancelBookings'),
  body('reason').notEmpty().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'checkedOut') {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationDate = new Date();
    await booking.save();

    // Update room status back to available if necessary
    if (booking.status === 'checkedIn') {
      const roomIds = booking.rooms.map(r => r.room);
      await Room.updateMany(
        { _id: { $in: roomIds } },
        { status: 'available' }
      );
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
