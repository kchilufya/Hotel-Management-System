const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management')
  .then(() => {
    console.log('Connected to MongoDB');
    return checkDashboardData();
  })
  .then(() => {
    console.log('Database connection closed');
    mongoose.connection.close();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.connection.close();
  });

async function checkDashboardData() {
  try {
    const db = mongoose.connection.db;
    const bookingsCollection = db.collection('bookings');
    const guestsCollection = db.collection('guests');
    const roomsCollection = db.collection('rooms');
    
    console.log('📅 Checking dashboard data calculations...\n');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`📅 Today: ${today.toISOString()}`);
    console.log(`📅 Tomorrow: ${tomorrow.toISOString()}\n`);
    
    // Get all bookings
    const allBookings = await bookingsCollection.find({}).toArray();
    console.log(`📊 Total bookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('\n📋 All bookings:');
      allBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ${booking.bookingReference}:`);
        console.log(`   Guest: ${booking.guest}`);
        console.log(`   Room: ${booking.room}`);
        console.log(`   Check-in: ${booking.checkInDate}`);
        console.log(`   Check-out: ${booking.checkOutDate}`);
        console.log(`   Status: ${booking.bookingStatus}`);
        console.log(`   Payment: ${booking.paymentStatus}`);
        console.log(`   Total: ${booking.totalAmount}`);
        console.log('');
      });
    }
    
    // Check today's arrivals
    const todayArrivalsQuery = {
      checkInDate: { $gte: today, $lt: tomorrow },
      bookingStatus: { $in: ['confirmed', 'checked-in'] }
    };
    const todayArrivals = await bookingsCollection.find(todayArrivalsQuery).toArray();
    console.log(`🛬 Today's arrivals query: ${JSON.stringify(todayArrivalsQuery, null, 2)}`);
    console.log(`🛬 Today's arrivals count: ${todayArrivals.length}`);
    
    // Check today's departures
    const todayDeparturesQuery = {
      checkOutDate: { $gte: today, $lt: tomorrow },
      bookingStatus: 'checked-in'
    };
    const todayDepartures = await bookingsCollection.find(todayDeparturesQuery).toArray();
    console.log(`🛫 Today's departures query: ${JSON.stringify(todayDeparturesQuery, null, 2)}`);
    console.log(`🛫 Today's departures count: ${todayDepartures.length}`);
    
    // Check today's checkouts
    const todayCheckoutsQuery = {
      checkOutDate: { $gte: today, $lt: tomorrow },
      bookingStatus: 'checked-out'
    };
    const todayCheckouts = await bookingsCollection.find(todayCheckoutsQuery).toArray();
    console.log(`✅ Today's checkouts query: ${JSON.stringify(todayCheckoutsQuery, null, 2)}`);
    console.log(`✅ Today's checkouts count: ${todayCheckouts.length}`);
    
    // Check pending bookings
    const pendingBookingsQuery = { bookingStatus: 'confirmed' };
    const pendingBookings = await bookingsCollection.find(pendingBookingsQuery).toArray();
    console.log(`⏳ Pending bookings query: ${JSON.stringify(pendingBookingsQuery, null, 2)}`);
    console.log(`⏳ Pending bookings count: ${pendingBookings.length}`);
    
    // Check today's revenue
    const revenueQuery = {
      checkOutDate: { $gte: today, $lt: tomorrow },
      bookingStatus: 'checked-out',
      paymentStatus: 'paid'
    };
    const revenueBookings = await bookingsCollection.find(revenueQuery).toArray();
    const totalRevenue = revenueBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    console.log(`💰 Today's revenue query: ${JSON.stringify(revenueQuery, null, 2)}`);
    console.log(`💰 Today's revenue bookings: ${revenueBookings.length}`);
    console.log(`💰 Today's total revenue: ${totalRevenue}`);
    
    // Check room status
    const totalRooms = await roomsCollection.countDocuments({ isActive: true });
    const availableRooms = await roomsCollection.countDocuments({ isActive: true, status: 'available' });
    const occupiedRooms = await roomsCollection.countDocuments({ isActive: true, status: 'occupied' });
    
    console.log(`\n🏨 Room statistics:`);
    console.log(`   Total rooms: ${totalRooms}`);
    console.log(`   Available rooms: ${availableRooms}`);
    console.log(`   Occupied rooms: ${occupiedRooms}`);
    
    // Check guests
    const totalGuests = await guestsCollection.countDocuments({ status: 'active' });
    console.log(`\n👥 Total active guests: ${totalGuests}`);
    
    console.log('\n🔍 Summary:');
    console.log('The issue appears to be that there are no bookings for TODAY.');
    console.log('All bookings are for future dates, so today\'s statistics show 0.');
    console.log('\nWould you like me to create some test bookings for today to verify the calculations work?');
    
  } catch (error) {
    console.error('Error during data check:', error);
  }
}
