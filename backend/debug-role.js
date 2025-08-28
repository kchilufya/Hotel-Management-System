// Debug role-based access
const debugRoleAccess = async () => {
  try {
    console.log('Testing receptionist access with detailed debugging...\n');
    
    const loginResponse = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'receptionist@hotel.com', 
        password: 'receptionist123' 
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    console.log('Receptionist login data:', {
      role: loginData.data.staff.role,
      department: loginData.data.staff.department,
      permissions: loginData.data.staff.permissions
    });

    // Test staff list access with detailed response
    const staffResponse = await fetch('http://localhost:5003/api/staff', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('\nStaff list response:');
    console.log('Status:', staffResponse.status);
    console.log('OK:', staffResponse.ok);
    
    const responseData = await staffResponse.json();
    console.log('Response data:', responseData);

  } catch (error) {
    console.log('Error:', error.message);
  }
};

debugRoleAccess();
