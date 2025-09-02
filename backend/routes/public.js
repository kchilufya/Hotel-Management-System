const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Import models directly
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Booking = require('../models/Booking');

console.log('🔧 Public routes loaded');

// Debug middleware
router.use((req, res, next) => {
  console.log(`📨 Public route request: ${req.method} ${req.url}`);
  next();
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit!');
  res.json({
    success: true,
    message: 'Public routes are working!'
  });
});

// Get available rooms for public booking (no authentication required)
router.get('/rooms/available', async (req, res) => {
  try {
    const { checkIn, checkOut, guests = 1 } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Find rooms that are available and can accommodate the guests
    const availableRooms = await Room.find({
      status: 'available',
      capacity: { $gte: parseInt(guests) }
    });

    // Filter out rooms that have conflicting bookings
    const roomIds = availableRooms.map(room => room._id);
    
    const conflictingBookings = await Booking.find({
      room: { $in: roomIds },
      bookingStatus: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate }
        }
      ]
    });

    const bookedRoomIds = conflictingBookings.map(booking => booking.room.toString());
    const finalAvailableRooms = availableRooms.filter(room => 
      !bookedRoomIds.includes(room._id.toString())
    );

    // Sort by price
    finalAvailableRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);

    res.json({
      success: true,
      data: finalAvailableRooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a public reservation (no authentication required)
router.post('/reservations', [
  body('guest.firstName').notEmpty().trim().escape(),
  body('guest.lastName').notEmpty().trim().escape(),
  body('guest.email').isEmail().normalizeEmail(),
  body('guest.phone').notEmpty().trim(),
  body('room').isMongoId(),
  body('checkInDate').isISO8601(),
  body('checkOutDate').isISO8601(),
  body('numberOfGuests').isInt({ min: 1 }),
  body('adults').isInt({ min: 1 }),
  body('children').isInt({ min: 0 }),
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

    const {
      guest: guestData,
      room: roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      adults,
      children,
      roomRate,
      totalAmount,
      specialRequests,
      source = 'online'
    } = req.body;

    console.log('📝 Public reservation request:', {
      guestData,
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalAmount
    });

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Room is not available'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      bookingStatus: { $in: ['confirmed', 'checked-in'] },
      $or: [
        {
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Room is not available for the selected dates'
      });
    }

    // Create or find guest
    let guest = await Guest.findOne({ email: guestData.email });
    
    if (!guest) {
      // Create new guest
      guest = new Guest({
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        dateOfBirth: null, // Will be updated later if needed
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        },
        nationality: '',
        identificationNumber: '',
        identificationType: 'passport'
      });
      
      await guest.save();
      console.log('✅ New guest created:', guest._id);
    } else {
      // Update existing guest info if needed
      guest.firstName = guestData.firstName;
      guest.lastName = guestData.lastName;
      guest.phone = guestData.phone;
      await guest.save();
      console.log('✅ Existing guest updated:', guest._id);
    }

    // Calculate number of nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Create booking
    const booking = new Booking({
      guest: guest._id,
      room: roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      numberOfNights,
      roomRate: roomRate || room.pricePerNight,
      totalAmount,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed',
      specialRequests,
      source,
      notes: `Online reservation - Adults: ${adults}, Children: ${children}`,
      createdBy: null // Public booking, no staff member
    });

    await booking.save();

    // Populate the booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type floor');

    console.log('✅ Public reservation created:', booking.bookingNumber);

    // Send confirmation email (implement this later)
    // await sendConfirmationEmail(guest.email, booking);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: populatedBooking
    });

  } catch (error) {
    console.error('❌ Public reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get reservation by booking number (public access)
router.get('/reservations/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    
    const booking = await Booking.findOne({ bookingNumber })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber type floor amenities');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel reservation (public access with email verification)
router.post('/reservations/:bookingNumber/cancel', [
  body('email').isEmail().normalizeEmail(),
  body('reason').optional().trim()
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

    const { bookingNumber } = req.params;
    const { email, reason = 'Guest cancellation' } = req.body;
    
    const booking = await Booking.findOne({ bookingNumber })
      .populate('guest', 'email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Verify email matches
    if (booking.guest.email !== email) {
      return res.status(403).json({
        success: false,
        message: 'Email does not match reservation'
      });
    }

    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'checked-out') {
      return res.status(400).json({
        success: false,
        message: 'Reservation cannot be cancelled'
      });
    }

    // Check cancellation policy (24 hours before check-in)
    const checkInDate = new Date(booking.checkInDate);
    const now = new Date();
    const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);

    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Reservations cannot be cancelled less than 24 hours before check-in'
      });
    }

    // Cancel the booking
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancellationDate = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Example dynamic routes (ensure all are named)
router.get('/rooms/:id', getRoomById);
router.post('/guests/:guestId/bookings', createBooking);
router.put('/bookings/:bookingNumber', updateBooking);
router.delete('/staff/:staffId', deleteStaff);

module.exports = router;
