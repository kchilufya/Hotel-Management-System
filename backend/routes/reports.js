const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Staff = require('../models/Staff');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', getDashboardReport); // valid

// Revenue report
router.get('/revenue', getRevenueReport);     // valid

// Occupancy report
router.get('/occupancy', getOccupancyReport); // valid

// Guest demographics report
router.get('/demographics', getDemographicsReport); // valid

// Room performance report
router.get('/room-performance', getRoomPerformanceReport); // valid

// Booking source analysis
router.get('/booking-sources', getBookingSourcesReport); // valid

module.exports = router;
