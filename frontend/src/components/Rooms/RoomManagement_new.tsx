import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  type: 'standard' | 'suite' | 'presidential';
  category: 'standard' | 'deluxe' | 'suite';
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  bedConfiguration: string;
  size: number;
  description: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  createdAt: string;
  updatedAt: string;
}

interface RoomFormData {
  roomNumber: string;
  floor: number;
  type: 'standard' | 'suite' | 'presidential';
  category: 'standard' | 'deluxe' | 'suite';
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  bedConfiguration: string;
  size: number;
  description: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: '',
    floor: 1,
    type: 'standard',
    category: 'standard',
    capacity: 1,
    pricePerNight: 0,
    amenities: [],
    bedConfiguration: '',
    size: 0,
    description: '',
    status: 'available'
  });

  const availableAmenities = [
    'WiFi',
    'Air Conditioning',
    'Mini Bar',
    'TV',
    'Kitchenette',
    'Balcony',
    'Safe',
    'Hairdryer',
    'Room Service',
    'Jacuzzi'
  ];

  const statusColors = {
    available: 'success',
    occupied: 'error',
    maintenance: 'warning',
    'out-of-order': 'default'
  } as const;

  useEffect(() => {
    fetchRooms();
  }, [currentPage, searchTerm, statusFilter, typeFilter, floorFilter]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (floorFilter) params.append('floor', floorFilter);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rooms?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.data.rooms);
      setTotalPages(data.data.totalPages);
      setTotalRooms(data.data.totalRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setDialogMode('add');
    setFormData({
      roomNumber: '',
      floor: 1,
      type: 'standard',
      category: 'standard',
      capacity: 1,
      pricePerNight: 0,
      amenities: [],
      bedConfiguration: '',
      size: 0,
      description: '',
      status: 'available'
    });
    setOpenDialog(true);
  };

  const handleEditRoom = (room: Room) => {
    setDialogMode('edit');
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      category: room.category,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      amenities: room.amenities,
      bedConfiguration: room.bedConfiguration,
      size: room.size,
      description: room.description,
      status: room.status
    });
    setOpenDialog(true);
  };

  const handleViewRoom = (room: Room) => {
    setDialogMode('view');
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      category: room.category,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      amenities: room.amenities,
      bedConfiguration: room.bedConfiguration,
      size: room.size,
      description: room.description,
      status: room.status
    });
    setOpenDialog(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      setSuccess('Room deleted successfully');
      fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  const handleSaveRoom = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = dialogMode === 'add' 
        ? 'http://localhost:5000/api/rooms'
        : `http://localhost:5000/api/rooms/${selectedRoom?._id}`;
      
      const method = dialogMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save room');
      }

      setSuccess(`Room ${dialogMode === 'add' ? 'created' : 'updated'} successfully`);
      setOpenDialog(false);
      fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setFloorFilter('');
    setCurrentPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Room Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRoom}
        >
          Add Room
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="occupied">Occupied</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="out-of-order">Out of Order</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="suite">Suite</MenuItem>
                <MenuItem value="presidential">Presidential</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Floor"
              type="number"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              size="small"
              sx={{ width: 100 }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchRooms}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Room Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Rooms ({totalRooms} total)
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Room Number</TableCell>
                      <TableCell>Floor</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Price/Night</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room._id}>
                        <TableCell>{room.roomNumber}</TableCell>
                        <TableCell>{room.floor}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{room.type}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{room.category}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>ZK {room.pricePerNight}</TableCell>
                        <TableCell>
                          <Chip
                            label={room.status.replace('-', ' ')}
                            color={statusColors[room.status]}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewRoom(room)}
                              color="info"
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditRoom(room)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRoom(room._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Room Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Add New Room'}
          {dialogMode === 'edit' && 'Edit Room'}
          {dialogMode === 'view' && 'Room Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
                disabled={dialogMode === 'view'}
              />
              <TextField
                fullWidth
                label="Floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                required
                disabled={dialogMode === 'view'}
              />
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  label="Type"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="suite">Suite</MenuItem>
                  <MenuItem value="presidential">Presidential</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  label="Category"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="deluxe">Deluxe</MenuItem>
                  <MenuItem value="suite">Suite</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Row 3 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                required
                disabled={dialogMode === 'view'}
              />
              <TextField
                fullWidth
                label="Price per Night"
                type="number"
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })}
                required
                disabled={dialogMode === 'view'}
                InputProps={{ startAdornment: 'ZK ' }}
              />
            </Box>

            {/* Row 4 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Bed Configuration"
                value={formData.bedConfiguration}
                onChange={(e) => setFormData({ ...formData, bedConfiguration: e.target.value })}
                disabled={dialogMode === 'view'}
              />
              <TextField
                fullWidth
                label="Size (sq ft)"
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) || 0 })}
                disabled={dialogMode === 'view'}
              />
            </Box>

            {/* Row 5 */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                label="Status"
                disabled={dialogMode === 'view'}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="occupied">Occupied</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="out-of-order">Out of Order</MenuItem>
              </Select>
            </FormControl>

            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={dialogMode === 'view'}
            />

            {/* Amenities */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableAmenities.map((amenity) => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    clickable={dialogMode !== 'view'}
                    color={formData.amenities.includes(amenity) ? 'primary' : 'default'}
                    onClick={() => {
                      if (dialogMode === 'view') return;
                      const newAmenities = formData.amenities.includes(amenity)
                        ? formData.amenities.filter(a => a !== amenity)
                        : [...formData.amenities, amenity];
                      setFormData({ ...formData, amenities: newAmenities });
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSaveRoom} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomManagement;
