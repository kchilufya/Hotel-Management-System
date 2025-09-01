const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const bookingRoutes = require('./routes/bookings');
const staffRoutes = require('./routes/staff');
const reportRoutes = require('./routes/reports');

let publicRoutes;
try {
  publicRoutes = require('./routes/public');
  console.log('✅ Public routes module loaded successfully');
} catch (error) {
  console.error('❌ Error loading public routes:', error);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Database connection
const connectDB = async () => {
  try {
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://yourUsername:password@cluster.mongodb.net/hotel_management';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Register routes after DB connection
    console.log('🔗 Registering routes...');
    app.use('/api/auth', authRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/guests', guestRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/staff', staffRoutes);
    app.use('/api/reports', reportRoutes);
    console.log('📢 Registering public routes...');
    if (publicRoutes) {
      app.use('/api/public', publicRoutes);
      console.log('✅ Public routes registered');
    } else {
      console.log('❌ Public routes not available');
    }
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'Hotel Management System API is running',
        timestamp: new Date().toISOString()
      });
    });
    
    // Error handling middleware (must be after routes)
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    // 404 handler (must be last)
    app.use((req, res) => {
      console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });
    
    console.log('✅ Routes registered successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
