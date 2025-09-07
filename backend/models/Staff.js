const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security', 'concierge'], required: true },
  department: { type: String, enum: ['management', 'frontDesk', 'housekeeping', 'maintenance', 'security', 'concierge', 'admin'], required: true },
  permissions: [{ type: String }],
  hireDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  shift: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use existing model if already compiled
module.exports = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
