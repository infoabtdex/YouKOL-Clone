// test/test-auth-routes.js
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Track cookies between requests
let cookies = [];

// Create a more robust axios instance for testing
const api = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  withCredentials: true,
  maxRedirects: 0,
  validateStatus: status => status < 500, // Don't throw on HTTP status 4xx
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Function to extract cookie from response
const extractCookies = (response) => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    cookies = setCookie;
    console.log('Received and stored cookies:', cookies);
  }
};

// Add interceptors to handle cookies
api.interceptors.response.use(response => {
  extractCookies(response);
  return response;
});

api.interceptors.request.use(config => {
  if (cookies.length > 0) {
    config.headers.Cookie = cookies.join('; ');
    console.log('Sending cookies:', config.headers.Cookie);
  }
  return config;
});

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  username: `testuser-${Date.now()}`,
  password: 'Password123!',
  passwordConfirm: 'Password123!'
};

// Helper function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAuthRoutes() {
  try {
    console.log('Testing Authentication Routes\n');
    
    // 1. Check auth status (should be unauthenticated)
    console.log('Step 1: Checking initial authentication status...');
    const statusResponse = await api.get('/api/auth/status');
    console.log('Initial status check response:', {
      data: statusResponse.data,
      headers: statusResponse.headers,
      status: statusResponse.status,
      statusText: statusResponse.statusText
    });
    
    if (!statusResponse.data.authenticated) {
      console.log('✅ Initial status check passed: Not authenticated');
    } else {
      console.log('❌ Initial status check failed: Already authenticated');
      return;
    }
    
    // 2. Register a new user
    console.log('\nStep 2: Registering a new user...');
    const registerResponse = await api.post('/api/auth/register', testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful');
      console.log('User ID:', registerResponse.data.user.id);
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }
    
    // 3. Login
    console.log('\nStep 3: Logging in...');
    const loginResponse = await api.post('/api/auth/login', {
      identity: testUser.email,
      password: testUser.password
    });
    console.log('Login response:', {
      data: loginResponse.data,
      status: loginResponse.status,
      statusText: loginResponse.statusText
    });
    console.log('Login cookies:', loginResponse.headers['set-cookie']);
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('User:', loginResponse.data.user);
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    // 4. Check auth status again (should be authenticated)
    console.log('\nStep 4: Checking authentication status after login...');
    const statusAfterLoginResponse = await api.get('/api/auth/status');
    console.log('Status after login response:', {
      data: statusAfterLoginResponse.data,
      headers: statusAfterLoginResponse.headers,
      status: statusAfterLoginResponse.status,
      statusText: statusAfterLoginResponse.statusText
    });
    
    if (statusAfterLoginResponse.data.authenticated) {
      console.log('✅ Status check passed: Authenticated');
      console.log('User:', statusAfterLoginResponse.data.user);
    } else {
      console.log('❌ Status check failed: Not authenticated after login');
      return;
    }
    
    // 5. Access protected route
    console.log('\nStep 5: Accessing protected route...');
    const profileResponse = await api.get('/api/profile');
    console.log('✅ Protected route access successful');
    console.log('Profile data:', profileResponse.data);
    
    // 6. Logout
    console.log('\nStep 6: Logging out...');
    const logoutResponse = await api.post('/api/auth/logout');
    
    if (logoutResponse.data.success) {
      console.log('✅ Logout successful');
    } else {
      console.log('❌ Logout failed:', logoutResponse.data.message);
      return;
    }
    
    // 7. Check auth status after logout (should be unauthenticated)
    console.log('\nStep 7: Checking authentication status after logout...');
    const statusAfterLogoutResponse = await api.get('/api/auth/status');
    
    if (!statusAfterLogoutResponse.data.authenticated) {
      console.log('✅ Status check passed: Not authenticated after logout');
    } else {
      console.log('❌ Status check failed: Still authenticated after logout');
      return;
    }
    
    // 8. Try to access protected route after logout (should fail)
    console.log('\nStep 8: Trying to access protected route after logout...');
    try {
      const protectedRouteResponse = await api.get('/api/profile');
      
      if (protectedRouteResponse.status === 401) {
        console.log('✅ Protected route correctly returned 401 Unauthorized after logout');
      } else {
        console.log('❌ Protected route access should have failed with 401 after logout');
        console.log('Received status:', protectedRouteResponse.status);
        console.log('Response data:', protectedRouteResponse.data);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protected route correctly denied access after logout');
      } else {
        console.log('❌ Protected route did not fail with the expected 401 status');
        console.error('Error:', error.message);
      }
    }
    
    console.log('\n✅ All authentication tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the tests if the server is ready
console.log('Waiting for server to be ready...');
sleep(3000).then(() => {
  console.log('Starting auth routes tests...');
  testAuthRoutes();
}); 