const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['standard', 'deluxe', 'suite', 'executive'], required: true },
  category: { type: String, enum: ['standard', 'deluxe', 'suite', 'executive'], required: true },
  capacity: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  amenities: [String],
  bedConfiguration: { type: String, required: true },
  size: { type: Number, required: true },
  description: String,
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'out-of-order'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use existing model if already compiled
module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
