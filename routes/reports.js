const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Staff = require('../models/Staff');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get basic statistics
    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalGuests,
      totalStaff,
      todayArrivals,
      todayDepartures,
      pendingBookings,
      revenueToday
    ] = await Promise.all([
      Room.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: true, status: 'available' }),
      Room.countDocuments({ isActive: true, status: 'occupied' }),
      Guest.countDocuments({ isActive: true }),
      Staff.countDocuments({ isActive: true }),
      Booking.countDocuments({
        checkInDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'checkedIn'] }
      }),
      Booking.countDocuments({
        checkOutDate: { $gte: today, $lt: tomorrow },
        status: 'checkedIn'
      }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.aggregate([
        {
          $match: {
            actualCheckOutDate: { $gte: today, $lt: tomorrow },
            status: 'checkedOut'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    // Get occupancy rate
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('guest', 'firstName lastName')
      .populate('rooms.room', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        statistics: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate: parseFloat(occupancyRate),
          totalGuests,
          totalStaff,
          todayArrivals,
          todayDepartures,
          pendingBookings,
          revenueToday: revenueToday[0]?.total || 0
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Revenue report
router.get('/revenue', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    let groupFormat;
    switch (groupBy) {
      case 'month':
        groupFormat = '%Y-%m';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const revenue = await Booking.aggregate([
      {
        $match: {
          actualCheckOutDate: { $gte: start, $lte: end },
          status: 'checkedOut'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$actualCheckOutDate'
            }
          },
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate total revenue
    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalBookings = revenue.reduce((sum, item) => sum + item.bookingCount, 0);

    res.json({
      success: true,
      data: {
        revenue,
        summary: {
          totalRevenue,
          totalBookings,
          averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
        }
      }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Occupancy report
router.get('/occupancy', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const totalRooms = await Room.countDocuments({ isActive: true });

    const occupancy = await Booking.aggregate([
      {
        $match: {
          $or: [
            {
              checkInDate: { $lte: end },
              checkOutDate: { $gte: start }
            }
          ],
          status: { $in: ['confirmed', 'checkedIn', 'checkedOut'] }
        }
      },
      {
        $unwind: '$rooms'
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$checkInDate'
            }
          },
          occupiedRooms: { $sum: 1 }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedRooms', totalRooms] },
              100
            ]
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        occupancy,
        totalRooms
      }
    });
  } catch (error) {
    console.error('Occupancy report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Guest demographics report
router.get('/demographics', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const [nationalityStats, ageStats, vipStats] = await Promise.all([
      // Nationality distribution
      Guest.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$nationality',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Age distribution
      Guest.aggregate([
        { $match: { isActive: true } },
        {
          $addFields: {
            age: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365 * 24 * 60 * 60 * 1000
              ]
            }
          }
        },
        {
          $bucket: {
            groupBy: '$age',
            boundaries: [0, 25, 35, 45, 55, 65, 100],
            default: 'Other',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),
      
      // VIP status
      Guest.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$vipStatus',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        nationality: nationalityStats,
        ageGroups: ageStats,
        vipStatus: vipStats
      }
    });
  } catch (error) {
    console.error('Demographics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Room performance report
router.get('/room-performance', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const roomPerformance = await Booking.aggregate([
      {
        $match: {
          actualCheckOutDate: { $gte: start, $lte: end },
          status: 'checkedOut'
        }
      },
      {
        $unwind: '$rooms'
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'rooms.room',
          foreignField: '_id',
          as: 'roomDetails'
        }
      },
      {
        $unwind: '$roomDetails'
      },
      {
        $group: {
          _id: {
            roomId: '$roomDetails._id',
            roomNumber: '$roomDetails.roomNumber',
            type: '$roomDetails.type',
            floor: '$roomDetails.floor'
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageRevenue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.json({
      success: true,
      data: roomPerformance
    });
  } catch (error) {
    console.error('Room performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Booking source analysis
router.get('/booking-sources', authMiddleware, checkPermission('viewReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const bookingSources = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: bookingSources
    });
  } catch (error) {
    console.error('Booking sources report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
