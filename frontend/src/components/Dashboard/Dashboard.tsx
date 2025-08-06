import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Hotel,
  People,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import axios from 'axios';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalGuests: number;
  activeBookings: number;
  todayArrivals: number;
  todayDepartures: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/reports/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default stats for demo
        setStats({
          totalRooms: 50,
          availableRooms: 35,
          occupiedRooms: 15,
          totalGuests: 120,
          activeBookings: 25,
          todayArrivals: 8,
          todayDepartures: 5,
          monthlyRevenue: 45000,
          occupancyRate: 75,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            <Typography variant="h6" color="text.primary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back! Here's what's happening at your hotel today.
      </Typography>

      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {/* Room Statistics */}
        <StatCard
          title="Total Rooms"
          value={stats?.totalRooms}
          subtitle={`${stats?.availableRooms} available`}
          icon={<Hotel />}
          color="primary"
        />

        <StatCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate}%`}
          subtitle={`${stats?.occupiedRooms} occupied`}
          icon={<Hotel />}
          color="success"
        />

        <StatCard
          title="Active Bookings"
          value={stats?.activeBookings}
          subtitle="Current reservations"
          icon={<CalendarToday />}
          color="info"
        />

        <StatCard
          title="Total Guests"
          value={stats?.totalGuests}
          subtitle="Registered guests"
          icon={<People />}
          color="secondary"
        />

        {/* Today's Activities */}
        <StatCard
          title="Today's Arrivals"
          value={stats?.todayArrivals}
          subtitle="Check-ins expected"
          icon={<CalendarToday />}
          color="warning"
        />

        <StatCard
          title="Today's Departures"
          value={stats?.todayDepartures}
          subtitle="Check-outs expected"
          icon={<CalendarToday />}
          color="error"
        />

        <StatCard
          title="Monthly Revenue"
          value={`ZK ${stats?.monthlyRevenue?.toLocaleString()}`}
          subtitle="This month"
          icon={<AttachMoney />}
          color="success"
        />

        <StatCard
          title="Available Rooms"
          value={stats?.availableRooms}
          subtitle="Ready for booking"
          icon={<Hotel />}
          color="primary"
        />
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="body2">New Booking</Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="body2">Check-in Guest</Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="body2">Check-out Guest</Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="body2">View Reports</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
