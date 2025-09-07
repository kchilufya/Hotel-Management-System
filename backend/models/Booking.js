const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  numberOfNights: { type: Number },
  roomRate: { type: Number, required: true },
  totalAmount: { type: Number },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'refunded'], 
    default: 'pending' 
  },
  bookingStatus: { 
    type: String, 
    enum: ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'], 
    default: 'confirmed' 
  },
  specialRequests: String,
  notes: String,
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use existing model if already compiled
module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
