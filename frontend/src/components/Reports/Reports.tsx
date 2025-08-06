import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Hotel,
  People,
  AttachMoney,
  Assessment,
  DateRange
} from '@mui/icons-material';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalGuests: number;
  totalStaff: number;
  todayArrivals: number;
  todayDepartures: number;
  todayCheckouts: number;
  pendingBookings: number;
  revenueToday: number;
}

interface RevenueData {
  _id: string;
  totalRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
}

interface OccupancyData {
  _id: string;
  occupiedRooms: number;
  occupancyRate: number;
}

interface RoomPerformanceData {
  _id: {
    roomId: string;
    roomNumber: string;
    type: string;
    floor: number;
  };
  totalBookings: number;
  totalRevenue: number;
  averageRevenue: number;
  totalNights: number;
}

interface DemographicsData {
  nationalityStats: Array<{ _id: string; count: number }>;
  vipStats: Array<{ _id: string; count: number }>;
  monthlyGuests: Array<{ _id: string; count: number }>;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [roomPerformanceData, setRoomPerformanceData] = useState<RoomPerformanceData[]>([]);
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState('day');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const fetchReport = async (endpoint: string, params?: URLSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const url = params 
        ? `http://localhost:5003/api/reports/${endpoint}?${params.toString()}`
        : `http://localhost:5003/api/reports/${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data');
      }

      return result.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchReport('dashboard');
      setDashboardData(data.statistics);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, []);

  const loadRevenue = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy
      });
      const data = await fetchReport('revenue', params);
      setRevenueData(data.revenue || []);
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  }, [dateRange.startDate, dateRange.endDate, groupBy]);

  const loadOccupancy = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const data = await fetchReport('occupancy', params);
      setOccupancyData(data.occupancy || []);
    } catch (error) {
      console.error('Error loading occupancy:', error);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const loadRoomPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const data = await fetchReport('room-performance', params);
      setRoomPerformanceData(data || []);
    } catch (error) {
      console.error('Error loading room performance:', error);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const loadDemographics = useCallback(async () => {
    try {
      const data = await fetchReport('demographics');
      setDemographicsData(data);
    } catch (error) {
      console.error('Error loading demographics:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'revenue') {
      loadRevenue();
    } else if (activeTab === 'occupancy') {
      loadOccupancy();
    } else if (activeTab === 'room-performance') {
      loadRoomPerformance();
    } else if (activeTab === 'demographics') {
      loadDemographics();
    }
  }, [activeTab, dateRange, groupBy, loadDashboard, loadRevenue, loadOccupancy, loadRoomPerformance, loadDemographics]);

  const formatCurrency = (amount: number) => {
    // Force ZMW formatting - updated at ${new Date().toISOString()}
    return `ZK ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  const StatCard = ({ title, value, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const TabButton = ({ tab, label, isActive, onClick }: {
    tab: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Chip
      label={label}
      onClick={onClick}
      color={isActive ? 'primary' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
      sx={{ margin: 0.5 }}
    />
  );

  const renderDashboard = () => (
    <Stack spacing={3}>
      <Box display="flex" gap={2} flexWrap="wrap">
        <Box flex="1" minWidth="200px">
          <StatCard
            title="Total Rooms"
            value={dashboardData?.totalRooms || 0}
            icon={<Hotel sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Box>
        <Box flex="1" minWidth="200px">
          <StatCard
            title="Occupancy Rate"
            value={`${dashboardData?.occupancyRate || 0}%`}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Box>
        <Box flex="1" minWidth="200px">
          <StatCard
            title="Total Guests"
            value={dashboardData?.totalGuests || 0}
            icon={<People sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Box>
        <Box flex="1" minWidth="200px">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(dashboardData?.revenueToday || 0)}
            icon={<AttachMoney sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Box>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Box flex="1" minWidth="400px">
          <Card>
            <CardHeader title="Room Status Overview" />
            <CardContent>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Available', value: dashboardData?.availableRooms || 0 },
                        { name: 'Occupied', value: dashboardData?.occupiedRooms || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="400px">
          <Card>
            <CardHeader title="Quick Stats" />
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Today's Arrivals:</Typography>
                  <Typography fontWeight="bold">{dashboardData?.todayArrivals || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Today's Departures:</Typography>
                  <Typography fontWeight="bold">{dashboardData?.todayDepartures || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Today's Checkouts:</Typography>
                  <Typography fontWeight="bold" color="success.main">{dashboardData?.todayCheckouts || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Pending Bookings:</Typography>
                  <Typography fontWeight="bold">{dashboardData?.pendingBookings || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Staff:</Typography>
                  <Typography fontWeight="bold">{dashboardData?.totalStaff || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Stack>
  );

  const renderRevenue = () => (
    <Card>
      <CardHeader title="Revenue Analysis" />
      <CardContent>
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="bookingCount" fill="#82ca9d" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  const renderOccupancy = () => (
    <Card>
      <CardHeader title="Occupancy Rate Trends" />
      <CardContent>
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancyRate" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  const renderRoomPerformance = () => (
    <Card>
      <CardHeader title="Room Performance" />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Room Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell align="right">Total Bookings</TableCell>
                <TableCell align="right">Total Revenue</TableCell>
                <TableCell align="right">Average Revenue</TableCell>
                <TableCell align="right">Total Nights</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomPerformanceData.map((room) => (
                <TableRow key={room._id.roomId}>
                  <TableCell>{room._id.roomNumber}</TableCell>
                  <TableCell>{room._id.type}</TableCell>
                  <TableCell>{room._id.floor}</TableCell>
                  <TableCell align="right">{room.totalBookings}</TableCell>
                  <TableCell align="right">{formatCurrency(room.totalRevenue)}</TableCell>
                  <TableCell align="right">{formatCurrency(room.averageRevenue)}</TableCell>
                  <TableCell align="right">{room.totalNights}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderDemographics = () => (
    <Stack spacing={3}>
      <Box display="flex" gap={2} flexWrap="wrap">
        <Box flex="1" minWidth="400px">
          <Card>
            <CardHeader title="Guest Nationality Distribution" />
            <CardContent>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicsData?.nationalityStats || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="_id"
                    >
                      {(demographicsData?.nationalityStats || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="400px">
          <Card>
            <CardHeader title="VIP Status Distribution" />
            <CardContent>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicsData?.vipStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card>
        <CardHeader title="Monthly Guest Registration" />
        <CardContent>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demographicsData?.monthlyGuests || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ margin: 2 }}>
          {error}
        </Alert>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'revenue':
        return renderRevenue();
      case 'occupancy':
        return renderOccupancy();
      case 'room-performance':
        return renderRoomPerformance();
      case 'demographics':
        return renderDemographics();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment />
        Reports & Analytics
      </Typography>

      {/* Tab Navigation */}
      <Box sx={{ marginBottom: 3 }}>
        <TabButton
          tab="dashboard"
          label="Dashboard"
          isActive={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />
        <TabButton
          tab="revenue"
          label="Revenue"
          isActive={activeTab === 'revenue'}
          onClick={() => setActiveTab('revenue')}
        />
        <TabButton
          tab="occupancy"
          label="Occupancy"
          isActive={activeTab === 'occupancy'}
          onClick={() => setActiveTab('occupancy')}
        />
        <TabButton
          tab="room-performance"
          label="Room Performance"
          isActive={activeTab === 'room-performance'}
          onClick={() => setActiveTab('room-performance')}
        />
        <TabButton
          tab="demographics"
          label="Demographics"
          isActive={activeTab === 'demographics'}
          onClick={() => setActiveTab('demographics')}
        />
      </Box>

      {/* Date Range Filters (for non-dashboard tabs) */}
      {activeTab !== 'dashboard' && activeTab !== 'demographics' && (
        <Card sx={{ marginBottom: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <Box flex="1" minWidth="200px">
                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
              <Box flex="1" minWidth="200px">
                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
              {activeTab === 'revenue' && (
                <Box flex="1" minWidth="200px">
                  <FormControl fullWidth>
                    <InputLabel>Group By</InputLabel>
                    <Select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              <Box flex="1" minWidth="200px">
                <Button
                  variant="contained"
                  startIcon={<DateRange />}
                  onClick={() => {
                    if (activeTab === 'revenue') loadRevenue();
                    else if (activeTab === 'occupancy') loadOccupancy();
                    else if (activeTab === 'room-performance') loadRoomPerformance();
                  }}
                  fullWidth
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {renderContent()}
    </Box>
  );
};

export default Reports;
