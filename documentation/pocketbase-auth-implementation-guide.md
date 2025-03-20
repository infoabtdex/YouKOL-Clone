# Comprehensive PocketBase Authentication Implementation Guide

This guide provides detailed instructions for implementing PocketBase authentication in the YouKOL Clone project through a Node.js server proxy.

## Table of Contents

1. [Introduction](#introduction)
2. [Implementation Steps](#implementation-steps)
3. [Security Considerations](#security-considerations)
4. [Testing and Verification](#testing-and-verification)
5. [Further Resources](#further-resources)
6. [Troubleshooting](#troubleshooting)

## Introduction

### Architecture Overview

The YouKOL Clone application uses a server-side authentication approach with PocketBase for user management. The architecture is designed as follows:

```
Client (Browser) <---> Node.js Server <---> PocketBase
```

In this architecture:

- The client never directly communicates with PocketBase
- The Node.js server acts as a proxy for all PocketBase interactions
- Authentication tokens remain entirely server-side
- User sessions are managed via HTTP-only cookies
- Protected routes are secured via middleware

### Benefits of This Approach

1. **Enhanced Security**: Authentication tokens are never exposed to client-side code
2. **Simplified Frontend**: The client doesn't need to handle token storage or refresh logic
3. **Centralized Authentication**: All authentication logic is managed in one place
4. **Better Control**: The server can implement additional security measures like rate limiting
5. **Future Flexibility**: Backend authentication provider can be changed without affecting the client

## Implementation Steps

The implementation is divided into logical steps, each building upon the previous one.

### Step 1: Setup PocketBase and Required Dependencies

Before implementing authentication, you need to set up PocketBase and install the required dependencies:

1. Install PocketBase SDK and additional packages:
   ```bash
   npm install pocketbase express-session express-rate-limit helmet cookie-parser
   ```

2. Update environment variables in `.env`:
   ```
   # PocketBase Configuration
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=admin@youkol.com
   POCKETBASE_ADMIN_PASSWORD=secure_admin_password
   
   # Session Configuration
   SESSION_SECRET=your-session-secret-change-this
   SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
   ```

3. Create a PocketBase service module at `server/services/pocketbase.js`:
   - Connection management
   - Health check functionality
   - Basic admin authentication

### Step 2: Create PocketBase Collections

PocketBase needs properly configured collections for user authentication:

1. Configure the built-in Users collection:
   - Add custom fields like avatar

2. Create a User Profiles collection:
   - Link to Users via relation
   - Store additional user information
   - Track onboarding status

3. Configure appropriate collection permissions:
   - Public access for registration and login
   - Authenticated access for user-specific operations

### Step 3: Implement PocketBase Service

Build a comprehensive service module for interacting with PocketBase:

1. Authentication methods:
   - User registration
   - Login
   - Password reset

2. User profile methods:
   - Profile creation with proper JSON field handling
   - Profile retrieval with fallback creation
   - Profile updates
   - Onboarding status management

3. Utility methods:
   - Enhanced health check with auto-cancellation handling
   - Complete user data retrieval
   - Automatic profile creation for users without profiles

4. JSON field handling:
   - Proper stringification of JSON objects
   - Avoiding sending null values for JSON fields
   - Improved error reporting with data details

5. Error handling:
   - Detailed error logging
   - Fallback mechanisms for common errors
   - Proper status code checking for specific error responses

### Step 4: Add Session Management ✅ Completed

Implement secure session management using Express Session:

```javascript
// server/middleware/session.js
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
    sessionConfig.cookie.secure = true;                 // Requires HTTPS
    sessionConfig.cookie.sameSite = 'strict';           // Stronger CSRF protection
  } else if (isTest) {
    // Testing-specific settings for running automated tests
    sessionConfig.cookie.sameSite = 'none';             
    sessionConfig.cookie.secure = false;                
  }
  
  return session(sessionConfig);
}
```

**Key Components Implemented:**

1. **Session Configuration:** Environment-specific session settings with proper security options
2. **Authentication Middleware:** Middleware for protected routes and attaching user data
3. **Authentication Routes:** Register, login, logout and status endpoints with proper session handling
4. **Testing Framework:** Comprehensive tests verifying the entire authentication flow

**Features of the Implementation:**

- Server-side session storage using HTTP-only cookies
- Different session configurations for development, testing, and production
- Automatic user data attachment for authenticated requests
- Comprehensive validation and error handling
- Thorough testing coverage with proper cookie handling

Detailed implementation is available in [Step 4: Add Session Management](../temp/active/step4_session_management.md).

### Step 5: Create Authentication Routes

Implement RESTful API endpoints for authentication:

1. Registration endpoint:
   - Create user in PocketBase
   - Create associated user profile
   - Return appropriate response

2. Login endpoint:
   - Authenticate with PocketBase
   - Set up session
   - Return user data (without tokens)

3. Authentication verification:
   - Check authentication status
   - Return user data if authenticated

4. Logout endpoint:
   - Destroy session
   - Clear cookies

### Step 6: Implement User Profile Management

Create routes for managing user profiles:

1. Profile retrieval:
   - Get user profile data
   - Format for client consumption

2. Profile updates:
   - Update preferences
   - Store user settings

3. Onboarding flow:
   - Track completion status
   - Save onboarding preferences

### Step 7: Integrate with Frontend

Connect the frontend to the authentication API:

1. Update API calls:
   - Use server authentication routes
   - Send credentials with requests

2. Handle authentication state:
   - Check authentication status on app load
   - Show appropriate UI based on authentication

3. Implement forms and UI:
   - Registration form
   - Login form
   - Onboarding flow

### Step 8: Security Enhancements

Add additional security measures:

1. Implement CSRF protection
2. Add rate limiting for authentication endpoints
3. Configure HTTP security headers
4. Validate all inputs server-side

## Security Considerations

### Token Management

- All PocketBase tokens remain server-side
- Tokens are never exposed to the client
- Session is the only authentication state on the client

### Cookie Security

- Use HTTP-only cookies
- Set Secure flag in production
- Configure proper SameSite attribute
- Set appropriate expiration

### Input Validation

- Validate all user inputs server-side
- Sanitize data before storage
- Use proper error handling

### Rate Limiting

- Implement rate limiting for authentication endpoints
- Prevent brute force attacks
- Log suspicious activity

## Testing and Verification

### Testing the Authentication Flow

To verify the implementation, test the complete authentication flow:

1. Registration
2. Login
3. Session verification
4. Profile operations
5. Logout
6. Verification of session invalidation

### Security Testing

- Verify that authentication tokens are not accessible client-side
- Check that HTTP-only cookies are properly set
- Test CSRF protection
- Ensure proper error handling

## Further Resources

- [PocketBase SDK Documentation](https://github.com/pocketbase/js-sdk)
- [Express Session Documentation](https://github.com/expressjs/session)
- [Security Best Practices for Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Troubleshooting

### Common Issues

#### PocketBase Connection Issues
- Ensure PocketBase is running on the expected URL
- Check admin credentials in environment variables
- Verify network connectivity between the server and PocketBase

#### JSON Field Handling
- Ensure JSON fields are properly stringified before sending to PocketBase
- Avoid sending null values for JSON fields
- Use empty objects (`{}`) instead of null when appropriate

#### Profile Creation Failures
- Check collection permissions in PocketBase
- Ensure all required fields are included and have valid values
- Use the getOrCreateUserProfile method for more robust profile handling

#### Health Check Failures
- Disable auto-cancellation for health checks to prevent timeouts
- Implement proper retry logic for intermittent connection issues
- Use detailed error logging to diagnose specific errors

---

For detailed implementation guidance, refer to the step-by-step guides in the `/temp/active/` directory.

1. [Step 1: Setup PocketBase and Required Dependencies](../temp/active/step1_pocketbase_setup.md)
2. [Step 2: Create PocketBase Collections](../temp/active/step2_pocketbase_collections.md)
3. [Step 3: Implement PocketBase Service](../temp/active/step3_pocketbase_service.md)
4. [Step 4: Add Session Management](../temp/active/step4_session_management.md)

## Implementation Status

- ✅ Step 1: Setup PocketBase and Dependencies
- ✅ Step 2: Create PocketBase Collections
- ✅ Step 3: Implement PocketBase Service
- ✅ Step 4: Add Session Management

Authentication implementation is now complete with server-side session management using HTTP-only cookies. 