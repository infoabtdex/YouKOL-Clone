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
  
  /**
   * Check if PocketBase is healthy and accessible
   * @returns {Promise<boolean>} - True if healthy, false otherwise
   */
  async isHealthy() {
    try {
      logger.debug('Performing PocketBase health check');
      
      // Disable auto-cancellation for health check
      this.pb.autoCancellation(false);
      
      const result = await this.pb.health.check();
      
      // Re-enable auto-cancellation
      this.pb.autoCancellation(true);
      
      logger.debug('PocketBase health check successful', { result });
      return true;
    } catch (error) {
      logger.error('PocketBase health check failed', { 
        error: error.message,
        code: error.status || 'unknown',
        data: error.data || {}
      });
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
      
      // Ensure required fields are present
      const requiredProfile = {
        user: profileData.user,
        display_name: profileData.display_name || 'New User',
        onboarding_completed: typeof profileData.onboarding_completed === 'boolean' ? 
          profileData.onboarding_completed : false
      };
      
      // Add optional fields only if they have valid values (not null or undefined)
      if (profileData.bio) requiredProfile.bio = profileData.bio;
      
      // Handle usage_frequency (enum field)
      if (profileData.usage_frequency) requiredProfile.usage_frequency = profileData.usage_frequency;
      
      // Handle content_types (JSON field)
      if (profileData.content_types && profileData.content_types !== null) {
        // Ensure JSON fields are properly stringified if they're not already strings
        if (typeof profileData.content_types === 'object') {
          requiredProfile.content_types = JSON.stringify(profileData.content_types);
        } else {
          requiredProfile.content_types = profileData.content_types;
        }
      }
      
      // Handle preferences (JSON field)
      if (profileData.preferences && profileData.preferences !== null) {
        // Ensure JSON fields are properly stringified if they're not already strings
        if (typeof profileData.preferences === 'object') {
          requiredProfile.preferences = JSON.stringify(profileData.preferences);
        } else {
          requiredProfile.preferences = profileData.preferences;
        }
      }
      
      logger.debug('Creating profile with data', { profileData: requiredProfile });
      
      const profile = await this.pb.collection('user_profiles').create(requiredProfile);
      logger.info('User profile created successfully', { id: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to create user profile', { 
        error: error.message, 
        data: error.data,
        profileData: JSON.stringify(profileData)
      });
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
  
  /**
   * Get a user's profile, creating a default one if it doesn't exist
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getOrCreateUserProfile(userId) {
    try {
      try {
        // Try to get the existing profile
        return await this.getUserProfile(userId);
      } catch (error) {
        // If profile doesn't exist, create a default one
        if (error.status === 404) {
          logger.info('Profile not found, creating default profile', { userId });
          
          // Get the user info to use their username
          const user = await this.getUserById(userId);
          
          // Create a default profile with ONLY required fields
          // This avoids sending null values for JSON fields
          const defaultProfile = {
            user: userId,
            display_name: user.username || 'New User',
            onboarding_completed: false
          };
          
          return await this.createUserProfile(defaultProfile);
        }
        
        // For any other error, just throw it
        throw error;
      }
    } catch (error) {
      logger.error('Failed to get or create user profile', { userId, error: error.message });
      throw error;
    }
  }
  
  // ========== Custom User Methods ==========
  
  /**
   * Get complete user data (user + profile)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete user data
   */
  async getCompleteUserData(userId) {
    try {
      logger.info('Getting complete user data', { userId });
      
      // Get user data
      const user = await this.getUserById(userId);
      
      // Get user profile (or create if it doesn't exist)
      const profile = await this.getOrCreateUserProfile(userId);
      
      // Combine user and profile data
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        created: user.created,
        updated: user.updated,
        avatar: user.avatar,
        display_name: profile.display_name,
        bio: profile.bio,
        onboarding_completed: profile.onboarding_completed,
        usage_frequency: profile.usage_frequency,
        content_types: profile.content_types,
        preferences: profile.preferences,
        profile_id: profile.id
      };
    } catch (error) {
      logger.error('Failed to get complete user data', { userId, error: error.message });
      throw error;
    }
  }
}

// Create a singleton instance
const pocketBaseService = new PocketBaseService();

module.exports = pocketBaseService; 