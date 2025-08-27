const express = require('express');
const { body, validationResult } = require('express-validator');
const Guest = require('../models/Guest');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all guests
router.get('/', authMiddleware, checkPermission('viewGuests'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const guests = await Guest.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Guest.countDocuments(filter);

    res.json({
      success: true,
      data: guests,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get guest by ID
router.get('/:id', authMiddleware, checkPermission('viewGuests'), async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    // Get guest's booking history
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ guest: guest._id })
      .populate('rooms.room', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...guest.toObject(),
        recentBookings: bookings
      }
    });
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new guest
router.post('/', [
  authMiddleware,
  checkPermission('createGuests'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('idType').isIn(['passport', 'driverLicense', 'nationalId']),
  body('idNumber').notEmpty().trim(),
  body('dateOfBirth').isISO8601(),
  body('nationality').notEmpty().trim()
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

    // Check if guest already exists
    const existingGuest = await Guest.findOne({
      $or: [
        { email: req.body.email },
        { idNumber: req.body.idNumber }
      ]
    });

    if (existingGuest) {
      return res.status(400).json({
        success: false,
        message: 'Guest with this email or ID number already exists'
      });
    }

    const guest = new Guest(req.body);
    await guest.save();

    res.status(201).json({
      success: true,
      message: 'Guest created successfully',
      data: guest
    });
  } catch (error) {
    console.error('Create guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update guest
router.put('/:id', [
  authMiddleware,
  checkPermission('editGuests'),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().notEmpty().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('nationality').optional().notEmpty().trim()
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

    // Check if email is being changed and already exists
    if (req.body.email) {
      const existingGuest = await Guest.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });

      if (existingGuest) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    res.json({
      success: true,
      message: 'Guest updated successfully',
      data: guest
    });
  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete guest (soft delete)
router.delete('/:id', authMiddleware, checkPermission('editGuests'), async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Search guests by criteria
router.post('/search', authMiddleware, checkPermission('viewGuests'), async (req, res) => {
  try {
    const { criteria } = req.body;
    const filter = { isActive: true };

    if (criteria.name) {
      filter.$or = [
        { firstName: { $regex: criteria.name, $options: 'i' } },
        { lastName: { $regex: criteria.name, $options: 'i' } }
      ];
    }

    if (criteria.email) {
      filter.email = { $regex: criteria.email, $options: 'i' };
    }

    if (criteria.phone) {
      filter.phone = { $regex: criteria.phone, $options: 'i' };
    }

    if (criteria.idNumber) {
      filter.idNumber = { $regex: criteria.idNumber, $options: 'i' };
    }

    const guests = await Guest.find(filter).limit(20);

    res.json({
      success: true,
      data: guests
    });
  } catch (error) {
    console.error('Search guests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
