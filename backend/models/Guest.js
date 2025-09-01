const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  idType: {
    type: String,
    enum: ['passport', 'driverLicense', 'nationalId'],
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  preferences: {
    roomType: String,
    specialRequests: [String],
    dietaryRestrictions: [String]
  },
  vipStatus: {
    type: Boolean,
    default: false
  },
  totalStays: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
guestSchema.index({ email: 1 });
guestSchema.index({ phone: 1 });
guestSchema.index({ idNumber: 1 });

module.exports = mongoose.models.Guest || mongoose.model('Guest', guestSchema);
