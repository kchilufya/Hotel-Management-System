const express = require('express');
const { body, validationResult } = require('express-validator');
const Staff = require('../models/Staff');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all staff
router.get('/', authMiddleware, checkPermission('viewStaff'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, isActive = true } = req.query;
    
    const filter = { isActive: isActive === 'true' };
    if (role) filter.role = role;
    if (department) filter.department = department;

    const staff = await Staff.find(filter)
      .select('-password')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Staff.countDocuments(filter);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get staff by role
router.get('/role/:role', authMiddleware, checkPermission('viewStaff'), async (req, res) => {
  try {
    const { role } = req.params;
    const staff = await Staff.find({ role, isActive: true })
      .select('-password')
      .sort({ lastName: 1, firstName: 1 });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get staff by ID
router.get('/:staffId', authMiddleware, checkPermission('viewStaff'), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId).select('-password');
    
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
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new staff member
router.post('/', [
  authMiddleware,
  checkPermission('createStaff'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().trim().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security', 'concierge'])
    .withMessage('Invalid role'),
  body('department').isIn(['management', 'frontDesk', 'housekeeping', 'maintenance', 'security', 'concierge', 'admin'])
    .withMessage('Invalid department'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('shift').isIn(['morning', 'afternoon', 'evening', 'night']).withMessage('Invalid shift')
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

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email: req.body.email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const staff = new Staff(req.body);
    await staff.save();

    // Return staff without password
    const { password, ...staffData } = staff.toObject();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staffData
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
});

// Update staff member
router.put('/:staffId', [
  authMiddleware,
  checkPermission('editStaff'),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().notEmpty().trim(),
  body('role').optional().isIn(['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security', 'concierge']),
  body('department').optional().isIn(['management', 'frontDesk', 'housekeeping', 'maintenance', 'security', 'concierge', 'admin']),
  body('salary').optional().isFloat({ min: 0 }),
  body('shift').optional().isIn(['morning', 'afternoon', 'evening', 'night'])
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
      const existingStaff = await Staff.findOne({
        email: req.body.email,
        _id: { $ne: req.params.staffId }
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Don't allow password updates through this route
    delete req.body.password;

    const staff = await Staff.findByIdAndUpdate(
      req.params.staffId,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Deactivate staff member
router.delete('/:staffId', authMiddleware, checkPermission('editStaff'), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.staffId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reset staff password
router.post('/:id/reset-password', [
  authMiddleware,
  checkPermission('editStaff'),
  body('newPassword').isLength({ min: 6 })
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

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.password = req.body.newPassword;
    await staff.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
