// Test login API
const testLogin = async () => {
  const credentials = {
    email: 'admin@hotel.com',
    password: 'admin123'
  };

  try {
    console.log('Testing login with:', credentials);
    
    const response = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Response:', result);
      console.log('Token received:', result.data.token ? 'Yes' : 'No');
      console.log('Staff data:', result.data.staff);
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
    
    return result;
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
};

// Run the test
testLogin();
