# Step 3: Implement PocketBase Service

In this step, we'll expand our PocketBase service module with comprehensive methods for user authentication and profile management.

## Overview

We'll enhance the PocketBase service created in Step 1 with methods for:

1. User authentication (registration, login, password reset)
2. User profile management
3. Utility methods for complete user data retrieval

## Implementation

Let's enhance the PocketBase service in `server/services/pocketbase.js`:

```javascript
// server/services/pocketbase.js
const PocketBase = require('pocketbase/cjs');
const logger = require('../../logger');

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    this.isConnected = false;
    
    // Set request timeout
    if (process.env.POCKETBASE_TIMEOUT) {
      this.pb.autoCancellation(false);
      const timeout = parseInt(process.env.POCKETBASE_TIMEOUT);
      this.pb.axios.defaults.timeout = timeout;
      logger.info(`PocketBase timeout set to ${timeout}ms`);
    }
    
    // Initialize connection
    this.init();
  }
  
  async init() {
    try {
      // Test connection to PocketBase
      await this.pb.health.check();
      this.isConnected = true;
      logger.info('✅ PocketBase connection successful');
      
      // Admin authentication if credentials are provided
      if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
        await this.adminAuth();
      }
    } catch (error) {
      logger.error('❌ Failed to connect to PocketBase', { error: error.message });
      this.isConnected = false;
      
      // Retry connection
      const retryDelay = process.env.POCKETBASE_RETRY_DELAY || 5000;
      setTimeout(() => this.init(), retryDelay);
    }
  }
  
  async adminAuth() {
    try {
      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      logger.info('✅ Admin authenticated with PocketBase');
    } catch (error) {
      logger.error('❌ Failed to authenticate admin with PocketBase', { error: error.message });
    }
  }
  
  // ========== Health Check Methods ==========
  
  async isHealthy() {
    try {
      await this.pb.health.check();
      return true;
    } catch (error) {
      logger.error('PocketBase health check failed', { error: error.message });
      return false;
    }
  }
  
  // ========== Authentication Methods ==========
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.passwordConfirm - Password confirmation
   * @param {string} userData.username - Username
   * @returns {Promise<Object>} - Created user object
   */
  async registerUser(userData) {
    try {
      logger.info('Registering new user', { email: userData.email });
      const user = await this.pb.collection('users').create(userData);
      logger.info('User registered successfully', { id: user.id });
      return user;
    } catch (error) {
      logger.error('Failed to register user', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Authenticate a user with email/username and password
   * @param {string} identity - Email or username
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication data with user and token
   */
  async loginUser(identity, password) {
    try {
      logger.info('Authenticating user', { identity });
      const authData = await this.pb.collection('users').authWithPassword(
        identity,
        password
      );
      logger.info('User authenticated successfully', { id: authData.record.id });
      return authData;
    } catch (error) {
      logger.error('Failed to authenticate user', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User object
   */
  async getUserById(userId) {
    try {
      return await this.pb.collection('users').getOne(userId);
    } catch (error) {
      logger.error('Failed to get user by ID', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Request password reset for a user
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async requestPasswordReset(email) {
    try {
      logger.info('Requesting password reset', { email });
      await this.pb.collection('users').requestPasswordReset(email);
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to request password reset', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Confirm password reset
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @param {string} passwordConfirm - Password confirmation
   * @returns {Promise<void>}
   */
  async confirmPasswordReset(token, password, passwordConfirm) {
    try {
      logger.info('Confirming password reset');
      await this.pb.collection('users').confirmPasswordReset(
        token,
        password,
        passwordConfirm
      );
      logger.info('Password reset successfully');
    } catch (error) {
      logger.error('Failed to confirm password reset', { error: error.message });
      throw error;
    }
  }
  
  // ========== User Profile Methods ==========
  
  /**
   * Create a user profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} - Created profile
   */
  async createUserProfile(profileData) {
    try {
      logger.info('Creating user profile', { userId: profileData.user });
      const profile = await this.pb.collection('user_profiles').create(profileData);
      logger.info('User profile created successfully', { id: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to create user profile', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a user's profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getUserProfile(userId) {
    try {
      return await this.pb.collection('user_profiles').getFirstListItem(`user="${userId}"`);
    } catch (error) {
      logger.error('Failed to get user profile', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Update a user profile
   * @param {string} profileId - Profile ID
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} - Updated profile
   */
  async updateUserProfile(profileId, profileData) {
    try {
      logger.info('Updating user profile', { profileId });
      const profile = await this.pb.collection('user_profiles').update(profileId, profileData);
      logger.info('User profile updated successfully', { id: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to update user profile', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Update user onboarding status
   * @param {string} userId - User ID
   * @param {Object} onboardingData - Onboarding data
   * @returns {Promise<Object>} - Updated profile
   */
  async updateOnboardingStatus(userId, onboardingData) {
    try {
      logger.info('Updating onboarding status', { userId });
      
      // Get the user profile
      const profile = await this.getUserProfile(userId);
      
      // Update the profile
      return await this.updateUserProfile(profile.id, {
        ...onboardingData,
        onboarding_completed: true
      });
    } catch (error) {
      logger.error('Failed to update onboarding status', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Check if a user has completed onboarding
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Onboarding status
   */
  async hasCompletedOnboarding(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile.onboarding_completed;
    } catch (error) {
      logger.error('Failed to check onboarding status', { error: error.message });
      return false;
    }
  }
  
  // ========== Custom User Methods ==========
  
  /**
   * Get complete user data including profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete user data
   */
  async getCompleteUserData(userId) {
    try {
      const user = await this.getUserById(userId);
      let profile = null;
      
      try {
        profile = await this.getUserProfile(userId);
      } catch (error) {
        logger.warn('User profile not found, creating default profile', { userId });
        
        // Create a default profile if one doesn't exist
        profile = await this.createUserProfile({
          user: userId,
          display_name: user.username,
          bio: '',
          onboarding_completed: false
        });
      }
      
      // Return combined user data
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        created: user.created,
        updated: user.updated,
        verified: user.verified,
        profile: {
          id: profile.id,
          displayName: profile.display_name,
          bio: profile.bio,
          onboardingCompleted: profile.onboarding_completed,
          usageFrequency: profile.usage_frequency,
          contentTypes: profile.content_types,
          preferences: profile.preferences
        }
      };
    } catch (error) {
      logger.error('Failed to get complete user data', { error: error.message });
      throw error;
    }
  }
}

// Create a singleton instance
const pocketBaseService = new PocketBaseService();

module.exports = pocketBaseService;
```

## Testing the Enhanced PocketBase Service

Let's create a test script to verify the enhanced PocketBase service:

```javascript
// test/test-pocketbase.js
const pbService = require('../server/services/pocketbase');
const dotenv = require('dotenv');

dotenv.config();

async function testPocketBaseService() {
  console.log('Testing PocketBase Service...');
  
  try {
    // Test health check
    console.log('\nTesting health check...');
    const isHealthy = await pbService.isHealthy();
    console.log(`Health check result: ${isHealthy ? '✅ Healthy' : '❌ Not healthy'}`);
    
    if (!isHealthy) {
      console.error('PocketBase is not healthy, aborting tests.');
      return;
    }
    
    // Generate a unique email and username for testing
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testUsername = `testuser-${timestamp}`;
    
    // Test user registration
    console.log('\nTesting user registration...');
    const testUser = {
      email: testEmail,
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      username: testUsername
    };
    
    const user = await pbService.registerUser(testUser);
    console.log('✅ User registered:', user.id);
    
    // Test user profile creation
    console.log('\nTesting user profile creation...');
    const profileData = {
      user: user.id,
      display_name: 'Test User',
      bio: 'This is a test user profile',
      onboarding_completed: false
    };
    
    const profile = await pbService.createUserProfile(profileData);
    console.log('✅ Profile created:', profile.id);
    
    // Test login
    console.log('\nTesting user login...');
    const authData = await pbService.loginUser(testEmail, testUser.password);
    console.log('✅ Login successful:', authData.record.id);
    
    // Test getting complete user data
    console.log('\nTesting get complete user data...');
    const userData = await pbService.getCompleteUserData(user.id);
    console.log('✅ Complete user data retrieved:', userData.id);
    
    // Test update onboarding status
    console.log('\nTesting update onboarding status...');
    const onboardingData = {
      usage_frequency: 'weekly',
      content_types: JSON.stringify(['photos', 'graphics']),
    };
    
    const updatedProfile = await pbService.updateOnboardingStatus(user.id, onboardingData);
    console.log('✅ Onboarding status updated:', updatedProfile.onboarding_completed);
    
    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

// Run the tests
testPocketBaseService();
```

## Update package.json with Test Script

Add the test script to your `package.json`:

```json
{
  "scripts": {
    // existing scripts
    "test-pb": "node test/test-pocketbase.js"
  }
}
```

## Implementation Steps

1. Replace the content of `server/services/pocketbase.js` with the enhanced implementation above
2. Create the test directory if it doesn't exist: `mkdir -p test`
3. Create the test script at `test/test-pocketbase.js`
4. Update `package.json` to include the test script
5. Run the test to verify the implementation: `npm run test-pb`

## Key Enhancements

The enhanced PocketBase service now includes:

1. **User Authentication Methods**
   - Registration with proper error handling
   - Login with email or username
   - Password reset functionality

2. **User Profile Management**
   - Profile creation
   - Profile retrieval
   - Profile updates
   - Onboarding status management

3. **Utility Methods**
   - Health check
   - Complete user data retrieval
   - Default profile creation if missing

## Next Steps

After implementing and testing the PocketBase service, proceed to [Step 4: Add Session Management](./step4_session_management.md) to implement server-side session management for authentication. 