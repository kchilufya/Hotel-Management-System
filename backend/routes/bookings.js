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
      .populate('rooms.room', 'roomNumber type floor pricePerNight capacity')
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
    console.log('🔍 Checkout request for booking ID:', req.params.id);
    
    const booking = await Booking.findById(req.params.id)
      .populate('rooms.room')
      .populate('guest');
    
    console.log('📋 Found booking:', booking ? booking.bookingNumber : 'Not found');
    console.log('📊 Booking status:', booking ? booking.status : 'N/A');
    
    if (!booking) {
      console.log('❌ Booking not found');
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'checkedIn') {
      console.log('❌ Invalid status for checkout. Current status:', booking.status);
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

// Update booking
router.put('/:id', [
  authMiddleware,
  checkPermission('editBookings'),
  body('guest').optional().isMongoId(),
  body('rooms').optional().isArray(),
  body('rooms.*.room').optional().isMongoId(),
  body('rooms.*.quantity').optional().isInt({ min: 1 }),
  body('checkInDate').optional().isISO8601(),
  body('checkOutDate').optional().isISO8601(),
  body('numberOfGuests').optional().isInt({ min: 1 }),
  body('numberOfNights').optional().isInt({ min: 1 }),
  body('roomRate').optional().isFloat({ min: 0 }),
  body('totalAmount').optional().isFloat({ min: 0 }),
  body('paidAmount').optional().isFloat({ min: 0 }),
  body('paymentStatus').optional().isIn(['pending', 'partial', 'paid', 'refunded']),
  body('bookingStatus').optional().isIn(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']),
  body('specialRequests').optional().trim(),
  body('notes').optional().trim()
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

    const { id } = req.params;
    const updateData = req.body;

    // Transform frontend field names to backend field names
    if (updateData.guestId) {
      updateData.guest = updateData.guestId;
      delete updateData.guestId;
    }
    
    if (updateData.roomId) {
      // Create rooms array structure that matches the current model
      updateData.rooms = [{
        room: updateData.roomId,
        guests: {
          adults: updateData.numberOfGuests || 1, // Use numberOfGuests or default to 1
          children: 0 // Default to 0 children
        }
      }];
      delete updateData.roomId;
    }

    // Handle adults/children data if provided separately
    if (updateData.adults || updateData.children) {
      if (updateData.rooms && updateData.rooms.length > 0) {
        updateData.rooms[0].guests = {
          adults: updateData.adults || updateData.numberOfGuests || 1,
          children: updateData.children || 0
        };
      }
      delete updateData.adults;
      delete updateData.children;
    }

    // Find the existing booking
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be modified
    if (existingBooking.bookingStatus === 'checked-out' || existingBooking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a booking that is checked-out or cancelled'
      });
    }

    // If updating dates, check for conflicts
    if (updateData.checkInDate || updateData.checkOutDate) {
      const checkInDate = new Date(updateData.checkInDate || existingBooking.checkInDate);
      const checkOutDate = new Date(updateData.checkOutDate || existingBooking.checkOutDate);
      
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }

      // Check room availability for new dates (excluding current booking)
      let roomIds = [];
      
      if (updateData.room) {
        // Single room (legacy or updated)
        roomIds = [updateData.room];
      } else if (updateData.rooms && updateData.rooms.length > 0) {
        // Multiple rooms array
        roomIds = updateData.rooms.map(r => r.room);
      } else if (existingBooking.room) {
        // Use existing single room
        roomIds = [existingBooking.room];
      } else if (existingBooking.rooms && existingBooking.rooms.length > 0) {
        // Use existing rooms array
        roomIds = existingBooking.rooms.map(r => r.room);
      }

      if (roomIds.length > 0) {
        const conflictingBooking = await Booking.findOne({
          _id: { $ne: id }, // Exclude current booking
          $or: [
            { room: { $in: roomIds } }, // Legacy single room structure
            { rooms: { $elemMatch: { room: { $in: roomIds } } } } // New rooms array structure
          ],
          bookingStatus: { $in: ['confirmed', 'checked-in'] },
          $and: [
            {
              checkInDate: { $lt: checkOutDate },
              checkOutDate: { $gt: checkInDate }
            }
          ]
        });

        if (conflictingBooking) {
          return res.status(400).json({
            success: false,
            message: 'Room is not available for the selected dates'
          });
        }
      }
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    // Populate the updated booking
    const populatedBooking = await Booking.findById(updatedBooking._id)
      .populate('guest', 'firstName lastName email phone')
      .populate('rooms.room', 'roomNumber type floor pricePerNight capacity')
      .populate('checkedInBy', 'firstName lastName')
      .populate('checkedOutBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    console.log('✅ Booking updated:', populatedBooking.bookingNumber);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
