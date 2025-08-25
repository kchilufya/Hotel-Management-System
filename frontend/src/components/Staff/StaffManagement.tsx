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
  Chip,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Staff {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  department: string;
  permissions: string[];
  hireDate: string;
  salary: number;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  department: string;
  permissions: string[];
  hireDate: string;
  salary: number;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    staff: Staff[];
    currentPage: number;
    totalPages: number;
    totalStaff: number;
    limit: number;
  };
  message?: string;
}

const StaffManagement: React.FC = () => {
  const { token, user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterActive, setFilterActive] = useState('');
  
  // Permission checking functions
  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }
    
    // Role-based permissions
    const rolePermissions: { [key: string]: string[] } = {
      'manager': [
        'read_staff', 'write_staff', 'read_rooms', 'write_rooms', 
        'read_bookings', 'write_bookings', 'read_guests', 'write_guests', 'read_reports'
      ],
      'receptionist': [
        'read_rooms', 'read_bookings', 'write_bookings', 'read_guests', 'write_guests'
      ],
      'housekeeping': [
        'read_rooms', 'read_bookings'
      ],
      'maintenance': [
        'read_rooms', 'write_rooms'
      ],
      'security': [
        'read_rooms', 'read_bookings', 'read_guests'
      ],
      'concierge': [
        'read_rooms', 'read_bookings', 'read_guests', 'write_guests'
      ]
    };
    
    const userRolePermissions = rolePermissions[user.role] || [];
    return userRolePermissions.includes(permission);
  };
  
  const canCreateStaff = () => user?.role === 'admin' || user?.role === 'manager';
  const canEditStaff = () => user?.role === 'admin' || user?.role === 'manager';
  const canDeleteStaff = () => user?.role === 'admin';
  
  // Form data
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist',
    department: 'frontDesk',
    permissions: [],
    hireDate: new Date().toISOString().split('T')[0], // Default to today
    salary: 0,
    shift: 'morning',
    isActive: true
  });
  
  const [newPassword, setNewPassword] = useState('');

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'receptionist',
      department: 'frontDesk',
      permissions: [],
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      shift: 'morning',
      isActive: true
    });
  };

  const fetchStaff = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole) params.append('role', filterRole);
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterActive) params.append('isActive', filterActive);

      const response = await fetch(`http://localhost:5000/api/staff?${params}`, {
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
        setStaff(Array.isArray(result.data.staff) ? result.data.staff : []);
        setTotalPages(result.data.totalPages || 1);
        setCurrentPage(result.data.currentPage || 1);
        setTotalStaff(result.data.totalStaff || 0);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch staff');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [token, limit, searchTerm, filterRole, filterDepartment, filterActive]);

  useEffect(() => {
    fetchStaff(currentPage);
  }, [currentPage, token, fetchStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const url = editingStaff 
        ? `http://localhost:5000/api/staff/${editingStaff._id}`
        : 'http://localhost:5000/api/staff';
      
      const method = editingStaff ? 'PUT' : 'POST';
      
      // For editing, don't send password unless it's provided
      const submitData = editingStaff 
        ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            isActive: formData.isActive
          }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingStaff ? 'Staff member updated successfully!' : 'Staff member created successfully!');
        setDialogOpen(false);
        setEditingStaff(null);
        resetForm();
        await fetchStaff(currentPage);
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingStaff || !newPassword) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/staff/${editingStaff._id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password updated successfully!');
        setPasswordDialogOpen(false);
        setNewPassword('');
        setEditingStaff(null);
      } else {
        setError(result.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone || '',
      password: '', // Don't prefill password for security
      role: staffMember.role,
      department: staffMember.department,
      permissions: staffMember.permissions || [],
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      salary: staffMember.salary || 0,
      shift: staffMember.shift || 'morning',
      isActive: staffMember.isActive
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Staff member deactivated successfully!');
        await fetchStaff(currentPage);
      } else {
        setError(result.message || 'Failed to deactivate staff member');
      }
    } catch (err) {
      console.error('Deactivate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStaff(1);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'receptionist':
        return 'primary';
      case 'housekeeping':
        return 'success';
      default:
        return 'default';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'front desk':
      case 'reception':
        return <PersonIcon />;
      case 'housekeeping':
        return <WorkIcon />;
      case 'management':
        return <BadgeIcon />;
      default:
        return <WorkIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        Staff Management
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <TextField
                fullWidth
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Box>
            
            <Box sx={{ minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="receptionist">Receptionist</MenuItem>
                  <MenuItem value="housekeeping">Housekeeping</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDepartment}
                  label="Department"
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="management">Management</MenuItem>
                  <MenuItem value="frontDesk">Front Desk</MenuItem>
                  <MenuItem value="housekeeping">Housekeeping</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="concierge">Concierge</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: '120px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterActive}
                  label="Status"
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => fetchStaff(currentPage)}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
                {canCreateStaff() && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingStaff(null);
                      resetForm();
                      setDialogOpen(true);
                    }}
                    startIcon={<AddIcon />}
                  >
                    Add Staff
                  </Button>
                )}
              </Box>
            </Box>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Shift</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staff.map((staffMember) => (
                      <TableRow key={staffMember._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {staffMember.employeeId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" />
                            {staffMember.firstName} {staffMember.lastName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon color="action" />
                            {staffMember.email}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon color="action" />
                            {staffMember.phone}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staffMember.role}
                            color={getRoleColor(staffMember.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getDepartmentIcon(staffMember.department)}
                            {staffMember.department}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staffMember.shift}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staffMember.isActive ? 'Active' : 'Inactive'}
                            color={staffMember.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {canEditStaff() && (
                            <Tooltip title="Edit Staff">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(staffMember)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canEditStaff() && (
                            <Tooltip title="Change Password">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingStaff(staffMember);
                                  setPasswordDialogOpen(true);
                                }}
                                color="info"
                              >
                                <BadgeIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDeleteStaff() && staffMember.isActive && (
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                onClick={() => handleDeactivate(staffMember._id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalStaff}
                page={currentPage - 1}
                onPageChange={handlePageChange}
                rowsPerPage={limit}
                rowsPerPageOptions={[limit]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {!editingStaff && (
                  <TextField
                    sx={{ flex: 1, minWidth: 200 }}
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    helperText="Minimum 6 characters"
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: 1, minWidth: 200 }} required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="receptionist">Receptionist</MenuItem>
                    <MenuItem value="housekeeping">Housekeeping</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1, minWidth: 200 }} required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <MenuItem value="management">Management</MenuItem>
                    <MenuItem value="frontDesk">Front Desk</MenuItem>
                    <MenuItem value="housekeeping">Housekeeping</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="concierge">Concierge</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Hire Date"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  required
                />
                <FormControl sx={{ flex: 1, minWidth: 200 }} required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={formData.shift}
                    label="Shift"
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                  >
                    <MenuItem value="morning">Morning</MenuItem>
                    <MenuItem value="afternoon">Afternoon</MenuItem>
                    <MenuItem value="evening">Evening</MenuItem>
                    <MenuItem value="night">Night</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: 1, minWidth: 300 }}>
                  <InputLabel>Permissions</InputLabel>
                  <Select
                    multiple
                    value={formData.permissions}
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value as string[] })}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                  >
                    <MenuItem value="read_staff">Read Staff</MenuItem>
                    <MenuItem value="write_staff">Write Staff</MenuItem>
                    <MenuItem value="read_rooms">Read Rooms</MenuItem>
                    <MenuItem value="write_rooms">Write Rooms</MenuItem>
                    <MenuItem value="read_bookings">Read Bookings</MenuItem>
                    <MenuItem value="write_bookings">Write Bookings</MenuItem>
                    <MenuItem value="read_guests">Read Guests</MenuItem>
                    <MenuItem value="write_guests">Write Guests</MenuItem>
                    <MenuItem value="read_reports">Read Reports</MenuItem>
                    <MenuItem value="admin_all">Admin All</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {editingStaff && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : (editingStaff ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdatePassword}
            variant="contained"
            disabled={loading || !newPassword || newPassword.length < 6}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffManagement;
