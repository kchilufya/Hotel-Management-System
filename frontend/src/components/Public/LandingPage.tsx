import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  AppBar,
  Toolbar,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Wifi as WifiIcon,
  Restaurant as RestaurantIcon,
  Pool as PoolIcon,
  Spa as SpaIcon,
  FitnessCenter as GymIcon,
  LocalParking as ParkingIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <WifiIcon />, title: 'Free WiFi', description: 'High-speed internet throughout the hotel' },
    { icon: <RestaurantIcon />, title: 'Restaurant', description: 'Fine dining with local and international cuisine' },
    { icon: <PoolIcon />, title: 'Swimming Pool', description: 'Outdoor pool with panoramic city views' },
    { icon: <SpaIcon />, title: 'Spa & Wellness', description: 'Full-service spa and wellness center' },
    { icon: <GymIcon />, title: 'Fitness Center', description: '24/7 fitness center with modern equipment' },
    { icon: <ParkingIcon />, title: 'Free Parking', description: 'Complimentary parking for all guests' }
  ];

  const roomTypes = [
    {
      title: 'Standard Room',
      price: 'From ZK 150',
      description: 'Comfortable accommodations with modern amenities',
      features: ['Queen bed', 'City view', 'WiFi', 'TV', 'Air conditioning']
    },
    {
      title: 'Deluxe Room',
      price: 'From ZK 250',
      description: 'Spacious rooms with enhanced comfort and style',
      features: ['King bed', 'Premium view', 'Mini bar', 'Room service', 'Balcony']
    },
    {
      title: 'Executive Suite',
      price: 'From ZK 400',
      description: 'Luxury suite with separate living area',
      features: ['King bed', 'Living room', 'Jacuzzi', 'Premium amenities', 'Concierge service']
    }
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <HotelIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Zanji Lodge
          </Typography>
          <Button color="inherit" onClick={() => navigate('/reservation-status')}>
            Check Reservation
          </Button>
          <Button color="inherit" onClick={() => navigate('/login')}>
            Staff Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Welcome to Zanji Lodge
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4 }}>
            Experience comfort and tranquility in the heart of Ndola
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" mb={4}>
            <LocationIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Tusha Street, Ndola, Zambia
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" mb={6}>
            {[1, 2, 3, 4].map((star) => (
              <StarIcon key={star} sx={{ color: '#ffd700', fontSize: 32 }} />
            ))}
            <Typography variant="h6" sx={{ ml: 2 }}>
              Quality Lodge
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
            onClick={() => navigate('/reservation')}
          >
            Book Your Stay Now
          </Button>
        </Container>
      </Box>

      {/* Room Types Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Our Rooms
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Choose from our selection of beautifully appointed rooms and suites
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {roomTypes.map((room, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    height: 200,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HotelIcon sx={{ fontSize: 80, color: 'white' }} />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {room.title}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {room.price}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {room.description}
                  </Typography>
                  <List dense>
                    {room.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemIcon>
                          <StarIcon color="primary" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            Hotel Amenities
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Enjoy world-class facilities and services during your stay
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '350px' }}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h2" gutterBottom>
          Ready to Book?
        </Typography>
        <Typography variant="h6" paragraph color="text.secondary" sx={{ mb: 4 }}>
          Reserve your room today and experience comfortable hospitality in Ndola
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
            onClick={() => navigate('/reservation')}
          >
            Make a Reservation
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
            onClick={() => navigate('/reservation-status')}
          >
            Check Existing Booking
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" paragraph>
                Tusha Street<br />
                Ndola, Zambia<br />
                Phone: +260 212 555 789<br />
                Email: info@zanjilodge.com
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" gutterBottom>
                Check-in / Check-out
              </Typography>
              <Typography variant="body2" paragraph>
                Check-in: 3:00 PM<br />
                Check-out: 11:00 AM<br />
                <br />
                24-hour front desk service
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography variant="body2">
              © 2024 Zanji Lodge. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
