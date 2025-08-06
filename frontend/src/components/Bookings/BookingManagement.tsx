import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Pagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as CheckInIcon,
  Logout as CheckOutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  status: string;
  pricePerNight: number;
  floor: number;
  capacity: number;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  guest: Guest;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfNights: number;
  roomRate: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  bookingStatus: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  specialRequests?: string;
  notes?: string;
  discountAmount: number;
  taxAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    bookings: Booking[];
    totalPages: number;
    currentPage: number;
    totalBookings: number;
  };
  message?: string;
}

const BookingManagement: React.FC = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const [formData, setFormData] = useState({
    guest: null as Guest | null,
    room: null as Room | null,
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    roomRate: 0,
    specialRequests: '',
    notes: '',
    discountAmount: 0,
    taxAmount: 0,
    paymentStatus: 'pending' as 'pending' | 'partial' | 'paid' | 'refunded',
    bookingStatus: 'confirmed' as 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show'
  });

  const resetForm = () => {
    setFormData({
      guest: null,
      room: null,
      checkInDate: '',
      checkOutDate: '',
      numberOfGuests: 1,
      roomRate: 0,
      specialRequests: '',
      notes: '',
      discountAmount: 0,
      taxAmount: 0,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });
  };

  // Calculate number of nights and total amount
  const calculateTotal = useCallback(() => {
    // Ensure we have valid dates and room rate
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomRate) {
      return { numberOfNights: 0, subtotal: 0, total: 0 };
    }
    
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    
    // Validate dates
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return { numberOfNights: 0, subtotal: 0, total: 0 };
    }
    
    // Calculate nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Parse amounts safely
    const roomRate = Number(formData.roomRate) || 0;
    const taxAmount = Number(formData.taxAmount) || 0;
    const discountAmount = Number(formData.discountAmount) || 0;
    
    // Calculate totals
    const subtotal = numberOfNights * roomRate;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    
    return {
      numberOfNights,
      subtotal,
      total
    };
  }, [formData.checkInDate, formData.checkOutDate, formData.roomRate, formData.taxAmount, formData.discountAmount]);

  const calculatedValues = calculateTotal();

  const fetchBookings = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5003/api/bookings?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success && result.data) {
        setBookings(Array.isArray(result.data.bookings) ? result.data.bookings : []);
        setTotalPages(result.data.totalPages || 1);
        setCurrentPage(result.data.currentPage || 1);
        setTotalBookings(result.data.totalBookings || 0);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchGuests = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5003/api/guests?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setGuests(result.data.guests || []);
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
    }
  }, [token]);

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5003/api/rooms?status=available&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setRooms(result.data.rooms || []);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings(currentPage);
    fetchGuests();
    fetchAvailableRooms();
  }, [currentPage, token, fetchBookings, fetchGuests, fetchAvailableRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guest || !formData.room) {
      setError('Please select both guest and room');
      return;
    }

    if (!formData.roomRate || formData.roomRate <= 0) {
      setError('Room rate must be greater than 0. Please reselect the room.');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      const calculated = calculateTotal();
      
      const bookingData = {
        guest: formData.guest._id,
        room: formData.room._id,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        numberOfNights: calculated.numberOfNights,
        roomRate: formData.roomRate,
        totalAmount: calculated.total,
        specialRequests: formData.specialRequests,
        notes: formData.notes,
        discountAmount: formData.discountAmount,
        taxAmount: formData.taxAmount,
        paymentStatus: formData.paymentStatus,
        bookingStatus: formData.bookingStatus,
        createdBy: user?.id  // Add the required createdBy field
      };

      const url = editingBooking 
        ? `http://localhost:5003/api/bookings/${editingBooking._id}`
        : 'http://localhost:5003/api/bookings';
      
      const method = editingBooking ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchBookings(currentPage);
        await fetchAvailableRooms(); // Refresh available rooms
        handleClose();
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to save booking');
      }
    } catch (err) {
      console.error('Error saving booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to save booking');
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5003/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchBookings(currentPage);
        await fetchAvailableRooms(); // Refresh available rooms
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:5003/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchBookings(currentPage);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to check in guest');
      }
    } catch (err) {
      console.error('Error checking in guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to check in guest');
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:5003/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchBookings(currentPage);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to check out guest');
      }
    } catch (err) {
      console.error('Error checking out guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to check out guest');
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      guest: booking.guest,
      room: booking.room,
      checkInDate: booking.checkInDate.split('T')[0],
      checkOutDate: booking.checkOutDate.split('T')[0],
      numberOfGuests: booking.numberOfGuests,
      roomRate: booking.room?.pricePerNight || booking.roomRate, // Use current room rate if available
      specialRequests: booking.specialRequests || '',
      notes: booking.notes || '',
      discountAmount: booking.discountAmount,
      taxAmount: booking.taxAmount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBooking(null);
    resetForm();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (status: string, type: 'booking' | 'payment') => {
    const color = type === 'booking' ? 
      (status === 'confirmed' ? 'primary' : 
       status === 'checked-in' ? 'success' : 
       status === 'checked-out' ? 'default' : 
       status === 'cancelled' ? 'error' : 'warning') :
      (status === 'paid' ? 'success' : 
       status === 'partial' ? 'warning' : 
       status === 'pending' ? 'default' : 'error');
    
    return (
      <Chip
        label={status}
        color={color}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading bookings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Booking Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New Booking
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Total Bookings: {totalBookings}
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Guest</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Nights</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>{booking.bookingNumber}</TableCell>
                    <TableCell>
                      {booking.guest ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {booking.room ? `Room ${booking.room.roomNumber} (${booking.room.type})` : 'N/A'}
                    </TableCell>
                    <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                    <TableCell>{formatDate(booking.checkOutDate)}</TableCell>
                    <TableCell>{booking.numberOfNights}</TableCell>
                    <TableCell>ZK {booking.totalAmount}</TableCell>
                    <TableCell>{getStatusChip(booking.paymentStatus, 'payment')}</TableCell>
                    <TableCell>{getStatusChip(booking.bookingStatus, 'booking')}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(booking)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      {booking.bookingStatus === 'confirmed' && (
                        <IconButton
                          color="success"
                          onClick={() => handleCheckIn(booking._id)}
                          size="small"
                          title="Check In"
                        >
                          <CheckInIcon />
                        </IconButton>
                      )}
                      {booking.bookingStatus === 'checked-in' && (
                        <IconButton
                          color="warning"
                          onClick={() => handleCheckOut(booking._id)}
                          size="small"
                          title="Check Out"
                        >
                          <CheckOutIcon />
                        </IconButton>
                      )}
                      {booking.bookingStatus !== 'cancelled' && booking.bookingStatus !== 'checked-out' && (
                        <IconButton
                          color="error"
                          onClick={() => handleCancel(booking._id)}
                          size="small"
                          title="Cancel"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBooking ? 'Edit Booking' : 'New Booking'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                <Autocomplete
                  options={guests}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  value={formData.guest}
                  onChange={(_, newValue) => setFormData({ ...formData, guest: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Guest" required fullWidth />
                  )}
                  fullWidth
                />
                <Autocomplete
                  options={rooms}
                  getOptionLabel={(option) => `Room ${option.roomNumber} (${option.type}) - ZK ${option.pricePerNight}/night`}
                  value={formData.room}
                  onChange={(_, newValue) => {
                    console.log('Room selected:', newValue);
                    setFormData({ 
                      ...formData, 
                      room: newValue,
                      roomRate: newValue?.pricePerNight || 0
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Room" required fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div>
                        <div><strong>Room {option.roomNumber}</strong> ({option.type})</div>
                        <div style={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          ZK {option.pricePerNight}/night
                        </div>
                      </div>
                    </li>
                  )}
                  fullWidth
                />
              </Box>
              
              <Box display="flex" gap={2}>
                <TextField
                  label="Check-in Date"
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <TextField
                  label="Check-out Date"
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  label="Number of Guests"
                  type="number"
                  value={formData.numberOfGuests}
                  onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                  required
                  fullWidth
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Room Rate per Night"
                  type="number"
                  value={formData.roomRate}
                  onChange={(e) => setFormData({ ...formData, roomRate: parseFloat(e.target.value) || 0 })}
                  required
                  fullWidth
                  disabled={true} // Make read-only since it comes from room selection
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">ZK</InputAdornment> }}
                  helperText="Rate is automatically set based on selected room"
                />
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  label="Tax Amount"
                  type="number"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">ZK</InputAdornment> }}
                />
                <TextField
                  label="Discount Amount"
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                  fullWidth
                  inputProps={{ step: 0.01, min: 0 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">ZK</InputAdornment> }}
                />
              </Box>

              {/* Calculation Summary */}
              {(formData.checkInDate && formData.checkOutDate && formData.roomRate > 0 && calculatedValues.numberOfNights > 0) && (
                <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Booking Summary
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography>Number of Nights:</Typography>
                    <Typography variant="body2">{calculatedValues.numberOfNights}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography>Room Rate × Nights:</Typography>
                    <Typography variant="body2">ZK {calculatedValues.subtotal.toFixed(2)}</Typography>
                  </Box>
                  {formData.taxAmount > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography>Tax Amount:</Typography>
                      <Typography variant="body2">+ ZK {formData.taxAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {formData.discountAmount > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography>Discount Amount:</Typography>
                      <Typography variant="body2">- ZK {formData.discountAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    <Typography variant="h6">Total Amount:</Typography>
                    <Typography variant="h6" color="primary">ZK {calculatedValues.total.toFixed(2)}</Typography>
                  </Box>
                </Card>
              )}

              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={formData.paymentStatus}
                    label="Payment Status"
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Booking Status</InputLabel>
                  <Select
                    value={formData.bookingStatus}
                    label="Booking Status"
                    onChange={(e) => setFormData({ ...formData, bookingStatus: e.target.value as any })}
                  >
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="checked-in">Checked In</MenuItem>
                    <MenuItem value="checked-out">Checked Out</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="no-show">No Show</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Special Requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingBooking ? 'Update' : 'Create'} Booking
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BookingManagement;
