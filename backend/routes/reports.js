const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Staff = require('../models/Staff');
const { authMiddleware, checkPermission } = require('../middleware/auth');

// Import report handlers from the controller
const {
  getDashboardReport,
  getRevenueReport,
  getOccupancyReport,
  getDemographicsReport,
  getRoomPerformanceReport,
  getBookingSourcesReport
} = require('../controllers/reportsController');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', getDashboardReport);

// Revenue report
router.get('/revenue', getRevenueReport);

// Occupancy report
router.get('/occupancy', getOccupancyReport);

// Guest demographics report
router.get('/demographics', getDemographicsReport);

// Room performance report
router.get('/room-performance', getRoomPerformanceReport);

// Booking source analysis
router.get('/booking-sources', getBookingSourcesReport);

module.exports = router;
