# Hotel Management System

A comprehensive hotel management system built with Node.js, Express, MongoDB, and React TypeScript. This system provides complete functionality for managing hotel operations including room management, guest registration, bookings, staff management, and reporting.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Room Management** - Complete room inventory with availability tracking, pricing, and maintenance scheduling
- **Guest Management** - Guest registration, profiles, preferences, and booking history
- **Booking System** - Reservation management with real-time availability checking
- **Check-in/Check-out** - Streamlined guest arrival and departure processes
- **Staff Management** - Employee profiles, roles, permissions, and scheduling
- **Billing & Payments** - Invoice generation, payment tracking, and financial reporting
- **Reporting & Analytics** - Comprehensive dashboard with occupancy rates, revenue analytics, and performance metrics

### Advanced Features
- **Real-time Dashboard** - Live statistics and key performance indicators
- **Room Status Tracking** - Available, occupied, maintenance, cleaning status
- **Guest Preferences** - Dietary restrictions, room preferences, special requests
- **VIP Guest Management** - Special handling for premium guests
- **Multi-source Bookings** - Support for direct bookings, walk-ins, and third-party platforms
- **Rate Limiting** - API security with request rate limiting
- **Data Validation** - Comprehensive input validation and error handling

## 🏗️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

### Frontend
- **React 18** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **dayjs** - Date manipulation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (v4.4 or higher)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hotel-management-system
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hotel_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# macOS (using Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod
```

### 5. Seed the Database
Populate the database with initial data:
```bash
npm run seed
```

This will create:
- Admin user: `admin@hotel.com` / `admin123`
- Manager user: `manager@hotel.com` / `manager123`
- Receptionist user: `receptionist@hotel.com` / `receptionist123`
- Sample rooms (41 rooms across 5 floors)
- Sample guests

### 6. Start the Application

#### Development Mode (Both servers)
```bash
npm run dev:full
```
This starts both backend (port 5000) and frontend (port 3000) servers.

#### Individual Servers
```bash
# Backend only
npm run server

# Frontend only
npm run client

# Production backend
npm start
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Staff login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change password

### Room Management
- `GET /api/rooms` - Get all rooms with filtering
- `GET /api/rooms/available` - Get available rooms for date range
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room (soft delete)

### Guest Management
- `GET /api/guests` - Get all guests with search
- `GET /api/guests/:id` - Get guest by ID with booking history
- `POST /api/guests` - Create new guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest (soft delete)
- `POST /api/guests/search` - Advanced guest search

### Booking Management
- `GET /api/bookings` - Get all bookings with filtering
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `POST /api/bookings/:id/checkin` - Check-in guest
- `POST /api/bookings/:id/checkout` - Check-out guest
- `POST /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/arrivals/today` - Today's arrivals
- `GET /api/bookings/departures/today` - Today's departures

### Staff Management
- `GET /api/staff` - Get all staff with filtering
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Deactivate staff member
- `POST /api/staff/:id/reset-password` - Reset staff password

### Reports & Analytics
- `GET /api/reports/dashboard` - Dashboard overview
- `GET /api/reports/revenue` - Revenue reports
- `GET /api/reports/occupancy` - Occupancy reports
- `GET /api/reports/demographics` - Guest demographics
- `GET /api/reports/room-performance` - Room performance
- `GET /api/reports/booking-sources` - Booking source analysis

## 🎯 Usage Guide

### 1. Initial Login
Access the application at `http://localhost:3000` and login with:
- **Admin**: `admin@hotel.com` / `admin123`
- **Manager**: `manager@hotel.com` / `manager123`
- **Receptionist**: `receptionist@hotel.com` / `receptionist123`

### 2. Dashboard Overview
The dashboard provides:
- Real-time occupancy statistics
- Today's arrivals and departures
- Revenue metrics
- Recent booking activity

### 3. Room Management
- View all rooms with status indicators
- Check room availability for specific dates
- Update room status (available, occupied, maintenance, cleaning)
- Manage room pricing and amenities

### 4. Guest Registration
- Register new guests with complete profile information
- Track guest preferences and special requirements
- Maintain guest booking history
- Manage VIP status

### 5. Booking Process
- Search for available rooms by date and criteria
- Create new reservations
- Process check-ins and check-outs
- Handle cancellations and modifications

### 6. Staff Operations
- Manage staff profiles and permissions
- Assign roles (admin, manager, receptionist, housekeeping, etc.)
- Track staff activities and login history

### 7. Reporting
- Generate occupancy reports
- Analyze revenue trends
- Track room performance
- Monitor booking sources

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-based Access Control** - Granular permissions system
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - API endpoint protection
- **Security Headers** - Helmet.js security middleware
- **CORS Configuration** - Cross-origin request control

## 🏗️ Database Schema

### Staff Collection
```javascript
{
  employeeId: String (unique),
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: Enum,
  department: Enum,
  permissions: [String],
  hireDate: Date,
  salary: Number,
  shift: Enum,
  isActive: Boolean
}
```

### Room Collection
```javascript
{
  roomNumber: String (unique),
  floor: Number,
  type: Enum,
  category: Enum,
  capacity: { adults: Number, children: Number },
  pricePerNight: Number,
  amenities: [String],
  bedConfiguration: Enum,
  size: Number,
  status: Enum,
  description: String
}
```

### Guest Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  address: Object,
  idType: Enum,
  idNumber: String (unique),
  dateOfBirth: Date,
  nationality: String,
  preferences: Object,
  vipStatus: Boolean,
  totalStays: Number,
  totalSpent: Number
}
```

### Booking Collection
```javascript
{
  bookingNumber: String (unique),
  guest: ObjectId,
  rooms: [{ room: ObjectId, guests: Object }],
  checkInDate: Date,
  checkOutDate: Date,
  status: Enum,
  totalAmount: Number,
  paidAmount: Number,
  paymentStatus: Enum,
  source: Enum
}
```

## 🚦 Available Scripts

```bash
# Development
npm run dev:full      # Start both backend and frontend
npm run server        # Start backend only
npm run client        # Start frontend only

# Production
npm start            # Start production server
npm run build        # Build frontend for production

# Database
npm run seed         # Seed database with initial data

# Utilities
npm test             # Run tests (not implemented yet)
```

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) section
2. Create a new issue with detailed description
3. Contact the development team

## 🔮 Future Enhancements

- **Mobile App** - React Native mobile application
- **Email Notifications** - Automated booking confirmations and reminders
- **Payment Integration** - Stripe/PayPal payment processing
- **Housekeeping Module** - Task management for cleaning staff
- **Maintenance Tracking** - Work order system for maintenance requests
- **Multi-language Support** - Internationalization (i18n)
- **Advanced Analytics** - Machine learning for demand forecasting
- **Integration APIs** - Third-party booking platform integrations
- **Document Management** - Guest document upload and storage
- **Loyalty Program** - Guest rewards and points system

---

**Built with ❤️ for efficient hotel management**
