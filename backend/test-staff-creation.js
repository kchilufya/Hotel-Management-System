// Test script to verify staff creation works with all required fields
const testStaffCreation = async () => {
  const testStaff = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@hotel.com',
    phone: '555-1234',
    password: 'testpass123',
    role: 'receptionist',
    department: 'frontDesk',
    permissions: ['read_bookings', 'write_bookings'],
    hireDate: '2024-01-15',
    salary: 35000,
    shift: 'morning',
    isActive: true
  };

  try {
    console.log('Testing staff creation with data:', testStaff);
    
    const response = await fetch('http://localhost:5003/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testStaff)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Staff creation successful!');
      console.log('Response:', result);
      console.log('Generated Employee ID:', result.staff.employeeId);
    } else {
      console.log('❌ Staff creation failed!');
      console.log('Error:', result);
    }
    
    return result;
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
};

// Run the test
testStaffCreation();
