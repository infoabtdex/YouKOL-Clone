# Step 4: Add Session Management

This document provides detailed instructions for implementing server-side session management for authentication in the YouKOL Clone project.

## Overview

We'll implement session-based authentication using Express Session, where:

1. The PocketBase authentication token remains entirely server-side
2. The client uses HTTP-only cookies for maintaining session state
3. Authentication middleware protects API routes

## Implementation Steps

### 1. Install Additional Dependencies

Ensure that you have the necessary dependencies installed:

```bash
npm install express-session cookie-parser
```

### 2. Configure Session Management in Server.js

Update your `server.js` file to include session management:

```javascript
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Import the PocketBase service
const pbService = require('./server/services/pocketbase');

// Import authentication routes
const authRoutes = require('./server/routes/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// API Keys - Securely loaded from environment variables
const DEEP_IMAGE_API_KEY = process.env.DEEP_IMAGE_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;

// Log API key status (truncated for security)
logger.info('🔑 API Key Configuration:');
logger.info(`Deep Image API Key: ${DEEP_IMAGE_API_KEY ? DEEP_IMAGE_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);
logger.info(`Grok API Key: ${GROK_API_KEY ? GROK_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);

// Setup CORS for cross-origin requests
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*']; // Default to allow all origins if not specified

// Configure CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies to be sent with requests
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'youkol-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JavaScript from accessing cookies
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    sameSite: 'lax' // Protect against CSRF
  }
}));

// Setup authentication routes
app.use('/api/auth', authRoutes);

// Add health check endpoint
app.get('/api/health/pocketbase', async (req, res) => {
  if (await pbService.isHealthy()) {
    return res.status(200).json({ status: 'ok', message: 'PocketBase is healthy' });
  }
  return res.status(503).json({ status: 'error', message: 'PocketBase is not responding' });
});

// ... existing server.js code ...
```

### 3. Create Authentication Middleware

Create a new file at `server/middleware/auth.js`:

```javascript
// server/middleware/auth.js
const pbService = require('../services/pocketbase');
const logger = require('../../logger');

/**
 * Authentication middleware to protect routes
 * Verifies that the user has a valid session and exists in PocketBase
 */
const authMiddleware = async (req, res, next) => {
  // Check if user ID exists in session
  if (!req.session || !req.session.userId) {
    logger.info('Unauthorized access attempt - no session', { 
      path: req.path, 
      ip: req.ip 
    });
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized. Please log in.' 
    });
  }

  try {
    // Verify the user exists in PocketBase
    const user = await pbService.getUserById(req.session.userId);
    
    // Attach user to request object for use in route handlers
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    logger.error('Authentication error', { 
      userId: req.session.userId, 
      error: error.message 
    });
    
    // Destroy the session if user doesn't exist or token is invalid
    req.session.destroy(err => {
      if (err) {
        logger.error('Error destroying session', { error: err.message });
      }
    });
    
    return res.status(401).json({ 
      success: false, 
      error: 'Session expired. Please log in again.' 
    });
  }
};

module.exports = authMiddleware;
```

### 4. Create Authentication Routes

Create a new file at `server/routes/auth.js`:

```javascript
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const pbService = require('../services/pocketbase');
const authMiddleware = require('../middleware/auth');
const logger = require('../../logger');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, passwordConfirm, username } = req.body;
    
    // Validate input
    if (!email || !password || !passwordConfirm || !username) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    // Register user in PocketBase
    const user = await pbService.registerUser({
      email,
      password,
      passwordConfirm,
      username
    });
    
    // Create user profile
    await pbService.createUserProfile({
      user: user.id,
      display_name: username,
      bio: '',
      onboarding_completed: false
    });
    
    // Log the registration
    logger.info('User registered successfully', { 
      id: user.id, 
      email: user.email 
    });
    
    // Send success response (don't return token to client)
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { identity, password } = req.body;
    
    // Validate input
    if (!identity || !password) {
      return res.status(400).json({
        success: false,
        error: 'Identity and password are required'
      });
    }
    
    // Authenticate with PocketBase
    const authData = await pbService.loginUser(identity, password);
    
    // Store user ID in session
    req.session.userId = authData.record.id;
    
    // Get complete user data
    const userData = await pbService.getCompleteUserData(authData.record.id);
    
    // Log the login
    logger.info('User logged in successfully', { 
      id: authData.record.id,
      email: authData.record.email
    });
    
    // Send response without tokens
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  // Get the user ID before destroying the session
  const userId = req.session.userId;
  
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout error', { error: err.message });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to logout' 
      });
    }
    
    // Clear the session cookie
    res.clearCookie('connect.sid');
    
    logger.info('User logged out successfully', { userId });
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// Get current authenticated user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Get complete user data including profile
    const userData = await pbService.getCompleteUserData(req.user.id);
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('Error fetching user data', { 
      userId: req.user.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user data'
    });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    await pbService.requestPasswordReset(email);
    
    logger.info('Password reset requested', { email });
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent' 
    });
  } catch (error) {
    logger.error('Password reset request error', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send password reset email'
    });
  }
});

// Confirm password reset
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, password, passwordConfirm } = req.body;
    
    if (!token || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: 'Token, password, and password confirmation are required'
      });
    }
    
    await pbService.confirmPasswordReset(token, password, passwordConfirm);
    
    logger.info('Password reset successful');
    
    res.json({ 
      success: true, 
      message: 'Password reset successful' 
    });
  } catch (error) {
    logger.error('Password reset confirmation error', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reset password'
    });
  }
});

module.exports = router;
```

### 5. Create a Protected Route Example

Create a simple protected route to demonstrate authentication:

```javascript
// server/routes/user.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pbService = require('../services/pocketbase');
const logger = require('../../logger');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await pbService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      profile: {
        displayName: profile.display_name,
        bio: profile.bio,
        onboardingCompleted: profile.onboarding_completed,
        usageFrequency: profile.usage_frequency,
        contentTypes: profile.content_types
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile', { 
      userId: req.user.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile'
    });
  }
});

// Update user preferences
router.post('/preferences', async (req, res) => {
  try {
    const { usageFrequency, contentTypes } = req.body;
    
    // Get user profile
    const profile = await pbService.getUserProfile(req.user.id);
    
    // Update profile with onboarding data
    const updatedProfile = await pbService.updateUserProfile(profile.id, {
      usage_frequency: usageFrequency,
      content_types: JSON.stringify(contentTypes),
      onboarding_completed: true
    });
    
    logger.info('User preferences updated', { userId: req.user.id });
    
    res.json({
      success: true,
      profile: {
        displayName: updatedProfile.display_name,
        bio: updatedProfile.bio,
        onboardingCompleted: updatedProfile.onboarding_completed,
        usageFrequency: updatedProfile.usage_frequency,
        contentTypes: updatedProfile.content_types
      }
    });
  } catch (error) {
    logger.error('Error updating user preferences', { 
      userId: req.user.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences'
    });
  }
});

module.exports = router;
```

### 6. Update Server.js to Include User Routes

Add the user routes to the server:

```javascript
// Import user routes (add to existing imports)
const userRoutes = require('./server/routes/user');

// ... existing middleware setup ...

// Setup user routes
app.use('/api/user', userRoutes);
```

### 7. Test the Authentication Flow

Create a simple test script in `test/test-auth-flow.js`:

```javascript
// test/test-auth-flow.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAuthFlow() {
  console.log('Testing Authentication Flow...');
  
  try {
    // Generate unique test user
    const timestamp = Date.now();
    const testUser = {
      email: `test-${timestamp}@example.com`,
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      username: `testuser-${timestamp}`
    };
    
    // 1. Register user
    console.log('\n1. Testing user registration...');
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);
    console.log('Registration successful:', registerResponse.data.user.id);
    
    // 2. Login
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      identity: testUser.email,
      password: testUser.password
    });
    console.log('Login successful:', loginResponse.data.user.id);
    
    // 3. Get authenticated user
    console.log('\n3. Testing get authenticated user...');
    const meResponse = await axios.get(`${API_URL}/api/auth/me`);
    console.log('Got authenticated user:', meResponse.data.user.id);
    
    // 4. Update user preferences
    console.log('\n4. Testing update user preferences...');
    const preferencesResponse = await axios.post(`${API_URL}/api/user/preferences`, {
      usageFrequency: 'weekly',
      contentTypes: ['photos', 'graphics']
    });
    console.log('Preferences updated, onboarding completed:', preferencesResponse.data.profile.onboardingCompleted);
    
    // 5. Get user profile
    console.log('\n5. Testing get user profile...');
    const profileResponse = await axios.get(`${API_URL}/api/user/profile`);
    console.log('Got user profile:', profileResponse.data.profile.displayName);
    
    // 6. Logout
    console.log('\n6. Testing logout...');
    const logoutResponse = await axios.post(`${API_URL}/api/auth/logout`);
    console.log('Logout successful:', logoutResponse.data.message);
    
    // 7. Verify session is invalidated
    console.log('\n7. Verifying session is invalidated...');
    try {
      await axios.get(`${API_URL}/api/auth/me`);
      console.error('Error: User still authenticated after logout!');
    } catch (error) {
      console.log('Session invalidated successfully, received 401 as expected');
    }
    
    console.log('\nAll authentication flow tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuthFlow();
```

### 8. Add Test Script to Package.json

Add the test script to your `package.json`:

```json
{
  "scripts": {
    // ...existing scripts
    "test-auth": "node test/test-auth-flow.js"
  }
}
```

## Verify Session Management Implementation

To verify the session management implementation:

1. Ensure PocketBase is running
2. Start the Node.js server
3. Run the authentication flow test:

```bash
npm run test-auth
```

## Next Steps

After implementing and testing the session management, proceed to [Step 5: Create Authentication Routes](./step5_auth_routes.md) to implement complete authentication routes with proper error handling and validation. 