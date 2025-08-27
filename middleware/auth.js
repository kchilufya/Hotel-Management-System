const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const staff = await Staff.findById(decoded.id).select('-password');
    
    if (!staff || !staff.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or staff member not found.'
      });
    }

    req.staff = staff;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.staff.permissions.includes(permission) && req.staff.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  checkPermission
};
