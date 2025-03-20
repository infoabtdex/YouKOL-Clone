# Step 4: Session Management ✅ Completed

In this step, we implemented secure session management to enable server-side authentication with PocketBase.

## Overview

The session management implementation provides:

1. Server-side session storage using Express session
2. Secure HTTP-only cookies
3. Authentication middleware for protected routes
4. Authentication routes for registration, login, and logout

## Implementation

### 1. Session Configuration

First, we created a session configuration middleware with environment-specific settings:

```javascript
// server/middleware/session.js
const session = require('express-session');
const logger = require('../../logger');

/**
 * Configure session middleware for Express
 * 
 * Uses environment-specific settings:
 * - Production: Secure cookies, strict SameSite, should use a production store
 * - Testing: Relaxed cookie settings for testing environments
 * - Development: Default settings for local development
 * 
 * @returns {Function} Configured express-session middleware
 */
function configureSession() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Default session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'default-dev-secret-change-this',
    name: 'youkol_session',                             // Custom cookie name
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,                                   // Prevents client-side JS from reading the cookie
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours by default
      sameSite: 'lax'                                   // Provides CSRF protection
    }
  };
  
  // Apply environment-specific settings
  if (isProduction) {
    // Production settings
    sessionConfig.cookie.secure = true;                 // Requires HTTPS
    sessionConfig.cookie.sameSite = 'strict';           // Stronger CSRF protection
    
    // IMPORTANT: Configure a production session store here
    // Example with Redis:
    // const RedisStore = require('connect-redis')(session);
    // sessionConfig.store = new RedisStore({ client: redisClient });
    
    logger.info('Session configured for production environment');
  } else if (isTest) {
    // Testing-specific settings
    sessionConfig.cookie.sameSite = 'none';             // Allow cross-site cookies for tests
    sessionConfig.cookie.secure = false;                // Allow non-HTTPS for tests
    
    logger.info('Session configured for testing environment');
  } else {
    // Development settings (default)
    logger.info('Session configured for development environment');
  }
  
  // Log session config details at debug level
  logger.debug('Session configuration', { 
    name: sessionConfig.name,
    cookieMaxAge: sessionConfig.cookie.maxAge,
    sameSite: sessionConfig.cookie.sameSite,
    secure: sessionConfig.cookie.secure || false,
    store: sessionConfig.store ? 'custom' : 'memory'
  });
  
  return session(sessionConfig);
}

module.exports = configureSession;
```

### 2. Authentication Middleware

Next, we implemented authentication middleware to protect routes:

```javascript
// server/middleware/auth.js
const logger = require('../../logger');
const pbService = require('../services/pocketbase');

function requireAuth(req, res, next) {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  next();
}

async function attachUserData(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return next();
    }
    
    // Get user data from PocketBase
    const userData = await pbService.getCompleteUserData(req.session.userId);
    
    // Attach user data to request object
    req.user = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      displayName: userData.display_name || userData.username,
      isOnboarded: userData.onboarding_completed || false,
      profileId: userData.profile_id
    };
    
    next();
  } catch (error) {
    logger.error('Failed to attach user data', { error: error.message });
    
    // Clear invalid session
    if (error.status === 404) {
      req.session.destroy();
    }
    
    next();
  }
}

function requireOnboarding(req, res, next) {
  if (!req.user || !req.user.isOnboarded) {
    return res.status(403).json({
      success: false,
      message: 'Onboarding required',
      code: 'ONBOARDING_REQUIRED'
    });
  }
  
  next();
}

module.exports = {
  requireAuth,
  attachUserData,
  requireOnboarding
};
```

### 3. Authentication Routes

We created RESTful API endpoints for authentication:

```javascript
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pbService = require('../services/pocketbase');
const { requireAuth, attachUserData } = require('../middleware/auth');

// Registration endpoint
router.post('/register', [
  // Validation middleware
], async (req, res) => {
  // Implementation details
});

// Login endpoint
router.post('/login', [
  // Validation middleware
], async (req, res) => {
  // Implementation details including:
  // - Authenticate with PocketBase
  // - Create session
  // - Return user data (without tokens)
});

// Logout endpoint
router.post('/logout', requireAuth, (req, res) => {
  // Implementation details including:
  // - Destroy session
  // - Clear session cookie
});

// Auth status endpoint
router.get('/status', attachUserData, (req, res) => {
  // Return authentication status and user data if authenticated
});

// Password reset endpoints
// ...

module.exports = router;
```

### 4. Server Integration

Finally, we integrated these components into the main server:

```javascript
// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
// Other imports...

// Import session configuration and routes
const configureSession = require('./server/middleware/session');
const authRoutes = require('./server/routes/auth');

// Initialize Express app
const app = express();

// Configure middleware
app.use(cookieParser());
app.use(configureSession());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register authentication routes
app.use('/api/auth', authRoutes);

// Import authentication middleware
const { attachUserData, requireAuth } = require('./server/middleware/auth');

// Attach user data to request if authenticated
app.use(attachUserData);

// Example of a protected route
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Rest of the server code...
```

## Testing

We created a comprehensive test suite to verify the authentication flow and session management:

```javascript
// test/test-auth-routes.js
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Track cookies between requests for session testing
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

// Test data with timestamp for uniqueness
const testUser = {
  email: `test-${Date.now()}@example.com`,
  username: `testuser-${Date.now()}`,
  password: 'Password123!',
  passwordConfirm: 'Password123!'
};

async function testAuthRoutes() {
  try {
    // 1. Check initial auth status (should be unauthenticated)
    
    // 2. Register a new user
    
    // 3. Login and verify session cookie received
    
    // 4. Check auth status after login (should be authenticated)
    
    // 5. Access protected route with session cookie
    
    // 6. Logout and verify session cookie cleared
    
    // 7. Check auth status after logout (should be unauthenticated)
    
    // 8. Try to access protected route after logout (should fail with 401)
  }
}
```

The test script verifies:
1. Initial unauthenticated state
2. User registration
3. Login with cookie handling
4. Session persistence across requests
5. Protected route access with valid session
6. Proper session termination
7. Protected route access denial without session

A test script `test-auth-with-server` was also added to package.json to start the server with the test environment and run the tests automatically:

```json
{
  "scripts": {
    "test-auth": "node test/test-auth-routes.js",
    "test-auth-with-server": "powershell -Command \"$env:NODE_ENV='test'; start-process node -ArgumentList 'server.js' -NoNewWindow; sleep 2; node test/test-auth-routes.js\""
  }
}
```

## Security Considerations

The session management implementation includes several security enhancements:

1. **HTTP-Only Cookies**: Prevents client-side JavaScript from accessing the cookie, protecting against XSS attacks.

2. **SameSite Cookie Attribute**: Configurable based on environment to prevent CSRF attacks:
   - Production: `strict` - Cookies are only sent in a first-party context
   - Development: `lax` - Cookies are sent on same-site requests and top-level navigations
   - Testing: `none` - Allows cross-site testing (still secure in combination with testing tools)

3. **Secure Cookie Attribute**: In production, cookies are only sent over HTTPS connections.

4. **Custom Session Name**: Uses a non-default name to avoid revealing the technology stack.

5. **Session Secret**: Uses environment variable for the session secret with a fallback for development.

6. **Input Validation**: All authentication endpoints use express-validator to validate inputs.

7. **Proper Error Handling**: Security-sensitive error details are not exposed to clients.

8. **Session Expiration**: Sessions automatically expire after a configurable time period.

9. **Environment-Specific Configuration**: Session behavior adapts to development, testing, and production needs.

10. **Logging**: Security-relevant events are logged for monitoring and debugging.

## Conclusion

The session management implementation provides a secure, robust authentication system for the YouKOL Clone application. With server-side session storage, secure HTTP-only cookies, and comprehensive testing, the system ensures users can securely authenticate and access protected resources while maintaining a high level of security.

## Next Steps

1. Implement user profile management routes
2. Integrate session management with the frontend
3. Add CSRF protection
4. Consider implementing rate limiting for authentication endpoints
5. Set up a production-ready session store (Redis, MongoDB, etc.)

With this implementation, we have completed the core authentication infrastructure using server-side sessions integrated with PocketBase. 