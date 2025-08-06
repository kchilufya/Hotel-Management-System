import React, { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  documentType: 'passport' | 'nationalId' | 'drivingLicense';
  documentNumber: string;
  dateOfBirth: string;
  nationality: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: string[];
  status: 'active' | 'inactive';
  totalStays: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    guests: Guest[];
    totalPages: number;
    currentPage: number;
    totalGuests: number;
  };
  message?: string;
}

const GuestManagement: React.FC = () => {
  const { token } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    documentType: 'passport' as 'passport' | 'nationalId' | 'drivingLicense',
    documentNumber: '',
    dateOfBirth: '',
    nationality: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      documentType: 'passport',
      documentNumber: '',
      dateOfBirth: '',
      nationality: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: [],
      status: 'active'
    });
  };

  const fetchGuests = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5003/api/guests?page=${page}`, {
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
        setGuests(Array.isArray(result.data.guests) ? result.data.guests : []);
        setTotalPages(result.data.totalPages || 1);
        setCurrentPage(result.data.currentPage || 1);
        setTotalGuests(result.data.totalGuests || 0);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch guests');
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch guests');
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests(currentPage);
  }, [currentPage, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGuest 
        ? `http://localhost:5003/api/guests/${editingGuest._id}`
        : 'http://localhost:5003/api/guests';
      
      const method = editingGuest ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchGuests(currentPage);
        handleClose();
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to save guest');
      }
    } catch (err) {
      console.error('Error saving guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to save guest');
    }
  };

  const handleDelete = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5003/api/guests/${guestId}`, {
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
        await fetchGuests(currentPage);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to delete guest');
      }
    } catch (err) {
      console.error('Error deleting guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete guest');
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address,
      documentType: guest.documentType,
      documentNumber: guest.documentNumber,
      dateOfBirth: guest.dateOfBirth.split('T')[0], // Convert to YYYY-MM-DD format
      nationality: guest.nationality,
      emergencyContact: guest.emergencyContact,
      preferences: guest.preferences,
      status: guest.status
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingGuest(null);
    resetForm();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (status: string) => {
    return (
      <Chip
        label={status}
        color={status === 'active' ? 'success' : 'default'}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading guests...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Guest Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Guest
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
              Total Guests: {totalGuests}
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Nationality</TableCell>
                  <TableCell>Total Stays</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest._id}>
                    <TableCell>{`${guest.firstName} ${guest.lastName}`}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>{guest.documentType}: {guest.documentNumber}</TableCell>
                    <TableCell>{guest.nationality}</TableCell>
                    <TableCell>{guest.totalStays}</TableCell>
                    <TableCell>{getStatusChip(guest.status)}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(guest)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(guest._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
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
          {editingGuest ? 'Edit Guest' : 'Add New Guest'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  fullWidth
                />
              </Box>
              
              <Box display="flex" gap={2}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  fullWidth
                />
              </Box>

              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                multiline
                rows={2}
                fullWidth
              />

              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={formData.documentType}
                    label="Document Type"
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                  >
                    <MenuItem value="passport">Passport</MenuItem>
                    <MenuItem value="nationalId">National ID</MenuItem>
                    <MenuItem value="drivingLicense">Driving License</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Document Number"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  required
                  fullWidth
                />
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <TextField
                  label="Nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  required
                  fullWidth
                />
              </Box>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Emergency Contact
              </Typography>
              <Box display="flex" gap={2}>
                <TextField
                  label="Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })}
                  required
                  fullWidth
                />
                <TextField
                  label="Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
                  required
                  fullWidth
                />
              </Box>
              <TextField
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                })}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingGuest ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GuestManagement;
