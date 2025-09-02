const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Staff = require('../models/Staff');

// Dashboard overview
const getDashboardReport = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalGuests = await Guest.countDocuments();
    const totalStaff = await Staff.countDocuments();

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRooms,
        totalGuests,
        totalStaff,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Revenue report
const getRevenueReport = async (req, res) => {
  try {
    const revenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    res.json({
      success: true,
      data: { totalRevenue: revenue[0]?.totalRevenue || 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Occupancy report
const getOccupancyReport = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Booking.countDocuments({
      bookingStatus: { $in: ['confirmed', 'checked-in'] },
    });
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    res.json({
      success: true,
      data: { occupancyRate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Guest demographics report
const getDemographicsReport = async (req, res) => {
  try {
    const demographics = await Guest.aggregate([
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      success: true,
      data: demographics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Room performance report
const getRoomPerformanceReport = async (req, res) => {
  try {
    const performance = await Booking.aggregate([
      { $group: { _id: '$room', bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { bookings: -1 } },
    ]);
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Booking source analysis
const getBookingSourcesReport = async (req, res) => {
  try {
    const sources = await Booking.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

module.exports = {
  getDashboardReport,
  getRevenueReport,
  getOccupancyReport,
  getDemographicsReport,
  getRoomPerformanceReport,
  getBookingSourcesReport,
};