import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Hotel as HotelIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  category: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  bedConfiguration: string;
  size: number;
  description: string;
  status: string;
  floor: number;
}

interface ReservationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  selectedRoom: Room | null;
  specialRequests: string;
}

const steps = ['Search Rooms', 'Select Room', 'Guest Details', 'Confirmation'];

const OnlineReservation: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [reservationData, setReservationData] = useState<ReservationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    selectedRoom: null,
    specialRequests: ''
  });

  const calculateNights = () => {
    if (reservationData.checkInDate && reservationData.checkOutDate) {
      const checkIn = new Date(reservationData.checkInDate);
      const checkOut = new Date(reservationData.checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const roomRate = reservationData.selectedRoom?.pricePerNight || 0;
    const subtotal = nights * roomRate;
    const tax = subtotal * 0.15; // 15% tax
    return {
      nights,
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const searchRooms = async () => {
    if (!reservationData.checkInDate || !reservationData.checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }

    if (new Date(reservationData.checkInDate) >= new Date(reservationData.checkOutDate)) {
      setError('Check-out date must be after check-in date');
      return;
    }

    const totalGuests = reservationData.adults + reservationData.children;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/public/rooms/available', {
        params: {
          checkIn: reservationData.checkInDate,
          checkOut: reservationData.checkOutDate,
          guests: totalGuests
        }
      });

      if (response.data.success) {
        setAvailableRooms(response.data.data);
        if (response.data.data.length === 0) {
          setError('No rooms available for the selected dates and guest count');
        } else {
          setActiveStep(1);
        }
      }
    } catch (err: any) {
      console.error('Error searching rooms:', err);
      setError(err.response?.data?.message || 'Failed to search rooms');
    } finally {
      setLoading(false);
    }
  };

  const selectRoom = (room: Room) => {
    setReservationData({ ...reservationData, selectedRoom: room });
    setActiveStep(2);
  };

  const submitReservation = async () => {
    try {
      setLoading(true);
      setError(null);

      const calculatedValues = calculateTotal();
      
      const bookingData = {
        guest: {
          firstName: reservationData.firstName,
          lastName: reservationData.lastName,
          email: reservationData.email,
          phone: reservationData.phone
        },
        room: reservationData.selectedRoom?._id,
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
        numberOfGuests: reservationData.adults + reservationData.children,
        adults: reservationData.adults,
        children: reservationData.children,
        roomRate: reservationData.selectedRoom?.pricePerNight,
        totalAmount: calculatedValues.total,
        specialRequests: reservationData.specialRequests,
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        source: 'online'
      };

      const response = await axios.post('http://localhost:5000/api/public/reservations', bookingData);

      if (response.data.success) {
        setBookingNumber(response.data.data.bookingNumber);
        setSuccess(true);
        setActiveStep(3);
      }
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      searchRooms();
    } else if (activeStep === 2) {
      setShowConfirmation(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Find Available Rooms
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label="Check-in Date"
                    type="date"
                    value={reservationData.checkInDate}
                    onChange={(e) => setReservationData({ ...reservationData, checkInDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    required
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label="Check-out Date"
                    type="date"
                    value={reservationData.checkOutDate}
                    onChange={(e) => setReservationData({ ...reservationData, checkOutDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: reservationData.checkInDate || new Date().toISOString().split('T')[0] }}
                    required
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Adults</InputLabel>
                    <Select
                      value={reservationData.adults}
                      label="Adults"
                      onChange={(e) => setReservationData({ ...reservationData, adults: Number(e.target.value) })}
                    >
                      {[1, 2, 3, 4].map(num => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Children</InputLabel>
                    <Select
                      value={reservationData.children}
                      label="Children"
                      onChange={(e) => setReservationData({ ...reservationData, children: Number(e.target.value) })}
                    >
                      {[0, 1, 2, 3].map(num => (
                        <MenuItem key={num} value={num}>{num}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom align="center">
              Available Rooms
            </Typography>
            <Typography variant="body1" gutterBottom align="center" color="text.secondary">
              {reservationData.checkInDate} to {reservationData.checkOutDate} • {calculateNights()} night(s) • {reservationData.adults + reservationData.children} guest(s)
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
              {availableRooms.map((room) => (
                <Box key={room._id} sx={{ flex: '1 1 350px', maxWidth: '400px' }}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        backgroundColor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <HotelIcon sx={{ fontSize: 60, color: 'white' }} />
                    </CardMedia>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6">
                          Room {room.roomNumber}
                        </Typography>
                        <Chip label={room.type} color="primary" size="small" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {room.category} • {room.bedConfiguration} • {room.size} sq ft
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        {room.description}
                      </Typography>
                      
                      <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>Amenities:</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {room.amenities.slice(0, 4).map((amenity) => (
                            <Chip
                              key={amenity}
                              label={amenity}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {room.amenities.length > 4 && (
                            <Chip label={`+${room.amenities.length - 4} more`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" color="primary">
                            ZK {room.pricePerNight}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per night
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          onClick={() => selectRoom(room)}
                          size="small"
                        >
                          Select
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Card sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Guest Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 250px' }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={reservationData.firstName}
                      onChange={(e) => setReservationData({ ...reservationData, firstName: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 250px' }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={reservationData.lastName}
                      onChange={(e) => setReservationData({ ...reservationData, lastName: e.target.value })}
                      required
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 250px' }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={reservationData.email}
                      onChange={(e) => setReservationData({ ...reservationData, email: e.target.value })}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 250px' }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={reservationData.phone}
                      onChange={(e) => setReservationData({ ...reservationData, phone: e.target.value })}
                      required
                    />
                  </Box>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Special Requests"
                    multiline
                    rows={3}
                    value={reservationData.specialRequests}
                    onChange={(e) => setReservationData({ ...reservationData, specialRequests: e.target.value })}
                    placeholder="Any special requirements or preferences..."
                  />
                </Box>
              </Box>

              {reservationData.selectedRoom && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Booking Summary</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 200px' }}>
                          <Typography variant="subtitle2">Room:</Typography>
                          <Typography>Room {reservationData.selectedRoom.roomNumber} ({reservationData.selectedRoom.type})</Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px' }}>
                          <Typography variant="subtitle2">Dates:</Typography>
                          <Typography>{reservationData.checkInDate} to {reservationData.checkOutDate}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 200px' }}>
                          <Typography variant="subtitle2">Guests:</Typography>
                          <Typography>{reservationData.adults} Adults, {reservationData.children} Children</Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px' }}>
                          <Typography variant="subtitle2">Nights:</Typography>
                          <Typography>{calculateNights()} night(s)</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Room rate × {calculateNights()} nights:</Typography>
                      <Typography>ZK {(reservationData.selectedRoom.pricePerNight * calculateNights()).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tax (15%):</Typography>
                      <Typography>ZK {calculateTotal().tax.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">ZK {calculateTotal().total.toFixed(2)}</Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center' }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <CheckIcon sx={{ fontSize: 32 }} />
              </Avatar>
              
              <Typography variant="h4" gutterBottom color="success.main">
                Reservation Confirmed!
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Booking Number: {bookingNumber}
              </Typography>
              
              <Typography variant="body1" paragraph color="text.secondary">
                Your reservation has been successfully created. You will receive a confirmation email shortly.
              </Typography>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Reservation Details:</Typography>
                <Typography variant="body2">
                  {reservationData.firstName} {reservationData.lastName}<br />
                  Room {reservationData.selectedRoom?.roomNumber}<br />
                  {reservationData.checkInDate} to {reservationData.checkOutDate}<br />
                  Total: ZK {calculateTotal().total.toFixed(2)}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Please arrive at Zanji Lodge after 3:00 PM on your check-in date.
                Check-out is before 11:00 AM.
              </Typography>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return reservationData.checkInDate && reservationData.checkOutDate && reservationData.adults > 0;
      case 1:
        return reservationData.selectedRoom !== null;
      case 2:
        return reservationData.firstName && reservationData.lastName && reservationData.email && reservationData.phone;
      default:
        return true;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Zanji Lodge Reservation
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || success}
              onClick={handleBack}
            >
              Back
            </Button>
            
            {activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {loading ? 'Loading...' : (activeStep === 2 ? 'Confirm Reservation' : 'Next')}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Your Reservation</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please review your reservation details:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><HotelIcon /></ListItemIcon>
              <ListItemText 
                primary="Room"
                secondary={`Room ${reservationData.selectedRoom?.roomNumber} (${reservationData.selectedRoom?.type})`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CalendarIcon /></ListItemIcon>
              <ListItemText 
                primary="Dates"
                secondary={`${reservationData.checkInDate} to ${reservationData.checkOutDate} (${calculateNights()} nights)`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText 
                primary="Guests"
                secondary={`${reservationData.adults} Adults, ${reservationData.children} Children`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PaymentIcon /></ListItemIcon>
              <ListItemText 
                primary="Total Amount"
                secondary={`ZK ${calculateTotal().total.toFixed(2)}`}
              />
            </ListItem>
          </List>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            By confirming, you agree to our terms and conditions. Payment can be made upon arrival.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)}>Cancel</Button>
          <Button onClick={() => { setShowConfirmation(false); submitReservation(); }} variant="contained" color="primary">
            Confirm Reservation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnlineReservation;
