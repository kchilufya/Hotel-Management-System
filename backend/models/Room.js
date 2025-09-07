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

// Pre-save middleware to ensure capacity is always a valid number
roomSchema.pre('save', function(next) {
  if (typeof this.capacity === 'object' && this.capacity !== null) {
    if (this.capacity.adults !== undefined) {
      this.capacity = (this.capacity.adults || 0) + (this.capacity.children || 0);
    } else {
      this.capacity = 1;
    }
  } else if (typeof this.capacity === 'string') {
    this.capacity = parseInt(this.capacity) || 1;
  }
  this.capacity = Math.max(1, parseInt(this.capacity) || 1);
  next();
});

module.exports = mongoose.model('Room', roomSchema);
