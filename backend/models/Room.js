const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'double', 'triple', 'suite', 'deluxe', 'presidential']
  },
  category: {
    type: String,
    required: true,
    enum: ['economy', 'standard', 'premium', 'luxury']
  },
  capacity: {
    adults: {
      type: Number,
      required: true,
      min: 1
    },
    children: {
      type: Number,
      default: 0
    }
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'tv', 'airConditioning', 'minibar', 'balcony', 
      'oceanView', 'cityView', 'bathtub', 'shower', 'refrigerator',
      'safe', 'workspace', 'kitchenette', 'fireplace'
    ]
  }],
  bedConfiguration: {
    type: String,
    required: true,
    enum: ['singleBed', 'doubleBed', 'twinBeds', 'kingBed', 'queenBed', 'sofaBed']
  },
  size: {
    type: Number, // in square meters
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'occupied', 'maintenance', 'cleaning', 'outOfOrder'],
    default: 'available'
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    caption: String
  }],
  housekeepingNotes: {
    type: String,
    trim: true
  },
  lastCleaned: {
    type: Date
  },
  maintenanceSchedule: [{
    type: {
      type: String,
      enum: ['routine', 'repair', 'deep-clean', 'inspection']
    },
    scheduledDate: Date,
    description: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    assignedTo: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ pricePerNight: 1 });

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
