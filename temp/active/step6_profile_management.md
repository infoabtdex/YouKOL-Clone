# Step 6: User Profile Management Implementation

## Objective

Implement RESTful API endpoints for user profile management, including profile retrieval, updates, and onboarding flow.

## Implementation Details

### 1. Profile Routes (`server/routes/profile.js`)

The following endpoints have been implemented:

#### GET /api/profile
- **Purpose**: Get the current user's profile
- **Access**: Private (requires authentication)
- **Features**:
  - Fetches detailed profile from PocketBase
  - Automatically creates profile if it doesn't exist
  - Returns formatted profile data for client consumption

#### PUT /api/profile
- **Purpose**: Update user profile
- **Access**: Private (requires authentication)
- **Features**:
  - Validates input data (display name, bio, preferences)
  - Merges new preferences with existing ones
  - Updates profile in PocketBase
  - Returns updated profile data

#### POST /api/profile/onboarding
- **Purpose**: Complete the onboarding process
- **Access**: Private (requires authentication)
- **Features**:
  - Updates onboarding completion status
  - Stores onboarding preferences and steps
  - Returns confirmation and updated onboarding data

#### GET /api/profile/onboarding/status
- **Purpose**: Check onboarding status
- **Access**: Private (requires authentication)
- **Features**:
  - Retrieves onboarding completion status
  - Returns detailed onboarding data if available

### 2. Server Configuration

The profile routes have been registered in the main server.js file:

```javascript
// Import routes
const authRoutes = require('./server/routes/auth');
const profileRoutes = require('./server/routes/profile');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
```

### 3. Security and Best Practices

- **Authentication**: All profile endpoints require authentication
- **Validation**: Input validation using express-validator
- **Error Handling**: Comprehensive error handling with appropriate status codes
- **Logging**: Detailed logging for troubleshooting
- **JSON Handling**: Proper handling of JSON fields with automatic stringification and parsing

## Testing

The profile endpoints can be tested using the following curl commands:

```bash
# Get user profile (requires authentication cookie)
curl -X GET http://localhost:3000/api/profile -H "Cookie: youkol_session=<session-cookie>"

# Update user profile
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: youkol_session=<session-cookie>" \
  -d '{"displayName": "Updated Name", "bio": "My updated bio", "preferences": {"theme": "dark"}}'

# Complete onboarding
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: youkol_session=<session-cookie>" \
  -d '{"completed": true, "preferences": {"notifications": true}, "steps": ["intro", "profile"]}'

# Check onboarding status
curl -X GET http://localhost:3000/api/profile/onboarding/status \
  -H "Cookie: youkol_session=<session-cookie>"
```

## Implementation Notes

1. The profile endpoints leverage existing PocketBase service methods:
   - `getUserProfile`
   - `getOrCreateUserProfile`
   - `updateUserProfile`
   - `updateOnboardingStatus`
   - `hasCompletedOnboarding`

2. The implementation follows the same pattern as auth routes for consistency:
   - Middleware for authentication and validation
   - Structured JSON responses with success flag
   - Consistent error handling

3. The profile data structure includes:
   - Basic information (display name, bio)
   - Preferences (stored as JSON)
   - Onboarding status and data
   - Creation and update timestamps 