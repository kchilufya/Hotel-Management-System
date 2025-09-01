const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true
  },
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
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security', 'concierge']
  },
  department: {
    type: String,
    required: true,
    enum: ['management', 'frontDesk', 'housekeeping', 'maintenance', 'security', 'concierge', 'admin']
  },
  permissions: [{
    type: String,
    enum: [
      'viewBookings', 'createBookings', 'editBookings', 'cancelBookings',
      'viewGuests', 'createGuests', 'editGuests',
      'viewRooms', 'createRooms', 'editRooms',
      'viewStaff', 'createStaff', 'editStaff',
      'viewReports', 'managePayments',
      'checkIn', 'checkOut',
      'viewSettings', 'editSettings'
    ]
  }],
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  hireDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  }
}, {
  timestamps: true
});

// Generate employee ID before saving
staffSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered for:', this.firstName, this.lastName);
  console.log('Current employeeId:', this.employeeId);
  
  if (!this.employeeId) {
    console.log('Generating new employeeId...');
    try {
      let employeeId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const count = await mongoose.model('Staff').countDocuments();
        employeeId = `EMP${String(count + 1 + attempts).padStart(4, '0')}`;
        console.log(`Attempt ${attempts + 1}: Generated employeeId ${employeeId}`);
        
        // Check if this employeeId already exists
        const existing = await mongoose.model('Staff').findOne({ employeeId });
        if (!existing) {
          isUnique = true;
          console.log(`EmployeeId ${employeeId} is unique`);
        } else {
          attempts++;
          console.log(`EmployeeId ${employeeId} already exists, trying again`);
        }
      }

      if (!isUnique) {
        // Fallback to timestamp-based ID
        employeeId = `EMP${Date.now().toString().slice(-4)}`;
        console.log(`Fallback employeeId: ${employeeId}`);
      }

      this.employeeId = employeeId;
      console.log('Final employeeId set to:', this.employeeId);
    } catch (error) {
      console.error('Error generating employeeId:', error);
      return next(error);
    }
  } else {
    console.log('EmployeeId already exists:', this.employeeId);
  }
  next();
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
  console.log('Password pre-save hook triggered');
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  console.log('Hashing password...');
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Compare password method
staffSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
staffSchema.pre('save', function(next) {
  console.log('Permissions pre-save hook triggered, role:', this.role);
  if (this.isModified('role') && this.permissions.length === 0) {
    console.log('Setting default permissions for role:', this.role);
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'viewBookings', 'createBookings', 'editBookings', 'cancelBookings',
          'viewGuests', 'createGuests', 'editGuests',
          'viewRooms', 'createRooms', 'editRooms',
          'viewStaff', 'createStaff', 'editStaff',
          'viewReports', 'managePayments',
          'checkIn', 'checkOut',
          'viewSettings', 'editSettings'
        ];
        break;
      case 'manager':
        this.permissions = [
          'viewBookings', 'createBookings', 'editBookings', 'cancelBookings',
          'viewGuests', 'createGuests', 'editGuests',
          'viewRooms', 'editRooms',
          'viewStaff', 'viewReports', 'managePayments',
          'checkIn', 'checkOut'
        ];
        break;
      case 'receptionist':
        this.permissions = [
          'viewBookings', 'createBookings', 'editBookings',
          'viewGuests', 'createGuests', 'editGuests',
          'viewRooms', 'checkIn', 'checkOut'
        ];
        break;
      case 'housekeeping':
        this.permissions = ['viewRooms', 'viewBookings'];
        break;
      default:
        this.permissions = ['viewBookings', 'viewRooms'];
    }
  }
  next();
});

// Index for faster searches
staffSchema.index({ employeeId: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ role: 1 });

module.exports = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
