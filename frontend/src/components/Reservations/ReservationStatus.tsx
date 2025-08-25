import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Container
} from '@mui/material';
import {
  Hotel as HotelIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Booking {
  _id: string;
  bookingNumber: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  room: {
    roomNumber: string;
    type: string;
    floor: number;
    amenities: string[];
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfNights: number;
  roomRate: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  specialRequests?: string;
  source: string;
  createdAt: string;
}

const ReservationStatus: React.FC = () => {
  const navigate = useNavigate();
  const [bookingNumber, setBookingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const searchReservation = async () => {
    if (!bookingNumber.trim()) {
      setError('Please enter your booking number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:5000/api/public/reservations/${bookingNumber}`);
      
      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching reservation:', err);
      setError(err.response?.data?.message || 'Reservation not found');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async () => {
    if (!booking || !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`http://localhost:5000/api/public/reservations/${booking.bookingNumber}/cancel`, {
        email: email,
        reason: 'Guest cancellation request'
      });
      
      if (response.data.success) {
        // Refresh the booking data
        await searchReservation();
        setShowCancelConfirm(false);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string, type: 'booking' | 'payment') => {
    if (type === 'booking') {
      switch (status) {
        case 'confirmed': return 'primary';
        case 'checked-in': return 'success';
        case 'checked-out': return 'default';
        case 'cancelled': return 'error';
        default: return 'warning';
      }
    } else {
      switch (status) {
        case 'paid': return 'success';
        case 'partial': return 'warning';
        case 'pending': return 'default';
        default: return 'error';
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <HotelIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Zanji Lodge - Reservation Status
          </Typography>
          <Button color="inherit" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
          <Button color="inherit" onClick={() => navigate('/reservation')}>
            New Reservation
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Search Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom align="center">
              Check Your Reservation
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" paragraph>
              Enter your booking number to view or manage your reservation
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <TextField
                fullWidth
                label="Booking Number"
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
                placeholder="e.g., BK2024001"
                disabled={loading}
              />
              <Button
                variant="contained"
                onClick={searchReservation}
                disabled={loading || !bookingNumber.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Booking Details */}
        {booking && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">
                  Reservation Details
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip 
                    label={booking.bookingStatus} 
                    color={getStatusColor(booking.bookingStatus, 'booking')}
                    size="small"
                  />
                  <Chip 
                    label={`Payment: ${booking.paymentStatus}`} 
                    color={getStatusColor(booking.paymentStatus, 'payment')}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Booking Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Booking Number: {booking.bookingNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Booked on: {formatDate(booking.createdAt)}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Guest Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><EmailIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Guest Name"
                      secondary={`${booking.guest.firstName} ${booking.guest.lastName}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EmailIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Email"
                      secondary={booking.guest.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PhoneIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Phone"
                      secondary={booking.guest.phone}
                    />
                  </ListItem>
                </List>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Room & Stay Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><HotelIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Room"
                      secondary={`Room ${booking.room.roomNumber} (${booking.room.type}) - Floor ${booking.room.floor}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Check-in"
                      secondary={formatDate(booking.checkInDate)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Check-out"
                      secondary={formatDate(booking.checkOutDate)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Guests"
                      secondary={`${booking.numberOfGuests} guest(s) for ${booking.numberOfNights} night(s)`}
                    />
                  </ListItem>
                </List>
              </Box>

              {booking.room.amenities && booking.room.amenities.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Room Amenities
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {booking.room.amenities.map((amenity, index) => (
                      <Chip key={index} label={amenity} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {booking.specialRequests && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Special Requests
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {booking.specialRequests}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Room Rate × {booking.numberOfNights} nights:</Typography>
                    <Typography>ZK {(booking.roomRate * booking.numberOfNights).toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total Amount:</Typography>
                    <Typography variant="h6" color="primary">ZK {booking.totalAmount.toFixed(2)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Payment Status: {booking.paymentStatus}
                  </Typography>
                </Paper>
              </Box>

              {/* Action Buttons */}
              {booking.bookingStatus === 'confirmed' && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" gutterBottom>
                    Manage Your Reservation
                  </Typography>
                  
                  {!showCancelConfirm ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      Cancel Reservation
                    </Button>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="error" gutterBottom>
                        To cancel your reservation, please enter your email address for verification:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                          label="Email Address"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          size="small"
                          sx={{ minWidth: 250 }}
                        />
                        <Button
                          variant="contained"
                          color="error"
                          onClick={cancelReservation}
                          disabled={loading || !email.trim()}
                        >
                          Confirm Cancellation
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setShowCancelConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Note: Cancellations must be made at least 24 hours before check-in.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {booking.bookingStatus === 'cancelled' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  This reservation has been cancelled. If you need assistance, please contact our front desk.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Contact our front desk for assistance with your reservation
            </Typography>
            <Box display="flex" justifyContent="center" gap={4}>
              <Box>
                <PhoneIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  +260 211 123 456
                </Typography>
              </Box>
              <Box>
                <EmailIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  info@grandhotelzambia.com
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ReservationStatus;
