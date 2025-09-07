const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  documentType: { type: String, enum: ['passport', 'nationalId', 'drivingLicense'], required: true },
  idNumber: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  nationality: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  preferences: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  totalStays: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use existing model if already compiled
module.exports = mongoose.models.Guest || mongoose.model('Guest', guestSchema);
