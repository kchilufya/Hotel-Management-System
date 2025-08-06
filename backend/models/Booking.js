const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  rooms: [{
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: 1
      },
      children: {
        type: Number,
        default: 0
      }
    }
  }],
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  actualCheckInDate: {
    type: Date
  },
  actualCheckOutDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'checkedIn', 'checkedOut', 'cancelled', 'noShow'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'creditCard', 'debitCard', 'bankTransfer', 'onlinePayment']
  },
  specialRequests: [{
    type: String
  }],
  source: {
    type: String,
    enum: ['direct', 'booking.com', 'expedia', 'airbnb', 'walk-in', 'phone', 'email'],
    default: 'direct'
  },
  cancellationReason: {
    type: String
  },
  cancellationDate: {
    type: Date
  },
  discounts: [{
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: Number,
    reason: String
  }],
  taxes: [{
    name: String,
    percentage: Number,
    amount: Number
  }],
  additionalCharges: [{
    description: String,
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }
}, {
  timestamps: true
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Validate check-in and check-out dates
bookingSchema.pre('save', function(next) {
  if (this.checkInDate >= this.checkOutDate) {
    next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

// Index for faster searches
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
