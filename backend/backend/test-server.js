const express = require('express');
const app = express();

console.log('Starting route registration...');

try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  
  console.log('Loading room routes...');
  const roomRoutes = require('./routes/rooms');
  app.use('/api/rooms', roomRoutes);
  
  console.log('Loading guest routes...');
  const guestRoutes = require('./routes/guests');
  app.use('/api/guests', guestRoutes);
  
  console.log('Loading booking routes...');
  const bookingRoutes = require('./routes/bookings');
  app.use('/api/bookings', bookingRoutes);
  
  console.log('Loading staff routes...');
  const staffRoutes = require('./routes/staff');
  app.use('/api/staff', staffRoutes);
  
  console.log('Loading report routes...');
  const reportRoutes = require('./routes/reports');
  app.use('/api/reports', reportRoutes);
  
  console.log('All routes loaded successfully!');
  
} catch (error) {
  console.error('Error loading routes:', error);
}
