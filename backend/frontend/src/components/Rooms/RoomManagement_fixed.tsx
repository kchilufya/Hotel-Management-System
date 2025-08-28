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
  Grid,
  TablePagination,
  Snackbar,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const availableAmenities = [
    'WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service',
    'Balcony', 'Jacuzzi', 'Safe', 'Coffee Maker', 'Hair Dryer'
  ];

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/rooms', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter,
          type: typeFilter,
          floor: floorFilter
        }
      });
      
      setRooms(response.data.rooms || response.data);
      setTotalRooms(response.data.total || response.data.length);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching rooms',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter, floorFilter]);

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', room?: Room) => {
    setDialogMode(mode);
    setSelectedRoom(room || null);
    
    if (mode === 'add') {
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
    } else if (room) {
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
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoom(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (dialogMode === 'add') {
        await axios.post('http://localhost:5000/api/rooms', formData);
        setSnackbar({
          open: true,
          message: 'Room created successfully',
          severity: 'success'
        });
      } else if (dialogMode === 'edit' && selectedRoom) {
        await axios.put(`http://localhost:5000/api/rooms/${selectedRoom._id}`, formData);
        setSnackbar({
          open: true,
          message: 'Room updated successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      setSnackbar({
        open: true,
        message: 'Error saving room',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5000/api/rooms/${roomId}`);
        setSnackbar({
          open: true,
          message: 'Room deleted successfully',
          severity: 'success'
        });
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting room',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    } else {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter(a => a !== amenity)
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setFloorFilter('');
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      case 'out-of-order': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Room Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add New Room
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
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
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="suite">Suite</MenuItem>
                <MenuItem value="presidential">Presidential</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Floor"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              sx={{ width: 100 }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchRooms}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Room Number</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Price per Night</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No rooms found
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>{room.roomNumber}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>{room.category}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>ZK {room.pricePerNight}</TableCell>
                    <TableCell>
                      <Chip
                        label={room.status}
                        color={getStatusColor(room.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('view', room)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', room)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(room._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalRooms}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Room Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Room' : 
           dialogMode === 'edit' ? 'Edit Room' : 'Room Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="deluxe">Deluxe</MenuItem>
                  <MenuItem value="suite">Suite</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Price per Night"
                type="number"
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">ZK</InputAdornment> }}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Bed Configuration"
                value={formData.bedConfiguration}
                onChange={(e) => setFormData({ ...formData, bedConfiguration: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Size (sq ft)"
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) || 0 })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="occupied">Occupied</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="out-of-order">Out of Order</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={dialogMode === 'view'}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Amenities
              </Typography>
              <FormGroup row>
                {availableAmenities.map((amenity) => (
                  <FormControlLabel
                    key={amenity}
                    control={
                      <Checkbox
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                        disabled={dialogMode === 'view'}
                      />
                    }
                    label={amenity}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {dialogMode === 'add' ? 'Add Room' : 'Update Room'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoomManagement;
