// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  API_BASE: 'http://localhost:5000/api',
  PUBLIC_API: 'http://localhost:5000/api/public'
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_CONFIG.API_BASE}/auth/login`,
  ME: `${API_CONFIG.API_BASE}/auth/me`,
  
  // Staff
  STAFF: `${API_CONFIG.API_BASE}/staff`,
  
  // Guests
  GUESTS: `${API_CONFIG.API_BASE}/guests`,
  
  // Rooms
  ROOMS: `${API_CONFIG.API_BASE}/rooms`,
  
  // Bookings
  BOOKINGS: `${API_CONFIG.API_BASE}/bookings`,
  
  // Reports
  REPORTS: `${API_CONFIG.API_BASE}/reports`,
  
  // Public endpoints
  PUBLIC_ROOMS: `${API_CONFIG.PUBLIC_API}/rooms/available`,
  PUBLIC_RESERVATIONS: `${API_CONFIG.PUBLIC_API}/reservations`
};
