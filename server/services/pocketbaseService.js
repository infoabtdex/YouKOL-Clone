const PocketBase = require('pocketbase');
const logger = require('../utils/logger');

// Configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Service methods
const pocketbaseService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User data
   */
  async registerUser(userData) {
    try {
      logger.info('Attempting to register new user', { email: userData.email });
      const user = await pb.collection('users').create({
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm,
        name: userData.name || '',
      });
      logger.info('User registered successfully', { id: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error('User registration failed', { error: error.message, data: error.data });
      throw error;
    }
  },

  /**
   * Authenticate a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Auth data including token
   */
  async loginUser(email, password) {
    try {
      logger.info('Attempting user login', { email });
      const authData = await pb.collection('users').authWithPassword(email, password);
      logger.info('User login successful', { id: authData.record.id, email: authData.record.email });
      return authData;
    } catch (error) {
      logger.error('User login failed', { error: error.message, email });
      throw error;
    }
  },

  /**
   * Get currently authenticated user
   * @param {string} token - Auth token
   * @returns {Promise<Object>} - User data
   */
  async getAuthenticatedUser(token) {
    try {
      if (!token) {
        logger.warn('No auth token provided to getAuthenticatedUser');
        return null;
      }

      // Set the auth token in the PocketBase instance
      pb.authStore.save(token, null);
      
      // Validate the token and get user if valid
      if (pb.authStore.isValid) {
        const userId = pb.authStore.model.id;
        logger.info('Getting authenticated user details', { userId });
        const user = await pb.collection('users').getOne(userId);
        return user;
      } else {
        logger.warn('Invalid auth token provided', { token: token.substring(0, 10) + '...' });
        return null;
      }
    } catch (error) {
      logger.error('Error getting authenticated user', { error: error.message });
      pb.authStore.clear();
      return null;
    }
  },

  /**
   * Logout a user by clearing the auth store
   */
  logout() {
    logger.info('Logging out user');
    pb.authStore.clear();
    return { success: true };
  },

  /**
   * Send password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} - Result of the operation
   */
  async requestPasswordReset(email) {
    try {
      logger.info('Requesting password reset', { email });
      await pb.collection('users').requestPasswordReset(email);
      logger.info('Password reset email sent', { email });
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      logger.error('Failed to request password reset', { error: error.message, email });
      throw error;
    }
  },

  /**
   * Create a new preset
   * @param {string} userId - User ID
   * @param {Object} presetData - Preset data
   * @returns {Promise<Object>} - Created preset
   */
  async createPreset(userId, presetData) {
    try {
      logger.info('Creating new preset', { userId });
      const preset = await pb.collection('presets').create({
        user: userId,
        name: presetData.name,
        settings: presetData.settings,
        isDefault: presetData.isDefault || false,
      });
      logger.info('Preset created successfully', { presetId: preset.id, userId });
      return preset;
    } catch (error) {
      logger.error('Failed to create preset', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Get all presets for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of presets
   */
  async getUserPresets(userId) {
    try {
      logger.info('Fetching presets for user', { userId });
      const presets = await pb.collection('presets').getFullList({
        filter: `user="${userId}"`,
        sort: 'created',
      });
      logger.info('Presets fetched successfully', { count: presets.length, userId });
      return presets;
    } catch (error) {
      logger.error('Failed to fetch user presets', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Get a specific preset by ID
   * @param {string} presetId - Preset ID
   * @returns {Promise<Object>} - Preset data
   */
  async getPreset(presetId) {
    try {
      logger.info('Fetching preset by ID', { presetId });
      const preset = await pb.collection('presets').getOne(presetId);
      logger.info('Preset fetched successfully', { presetId });
      return preset;
    } catch (error) {
      logger.error('Failed to fetch preset', { error: error.message, presetId });
      throw error;
    }
  },

  /**
   * Update a preset
   * @param {string} presetId - Preset ID
   * @param {Object} presetData - Updated preset data
   * @returns {Promise<Object>} - Updated preset
   */
  async updatePreset(presetId, presetData) {
    try {
      logger.info('Updating preset', { presetId });
      const preset = await pb.collection('presets').update(presetId, presetData);
      logger.info('Preset updated successfully', { presetId });
      return preset;
    } catch (error) {
      logger.error('Failed to update preset', { error: error.message, presetId });
      throw error;
    }
  },

  /**
   * Delete a preset
   * @param {string} presetId - Preset ID
   * @returns {Promise<boolean>} - Success status
   */
  async deletePreset(presetId) {
    try {
      logger.info('Deleting preset', { presetId });
      await pb.collection('presets').delete(presetId);
      logger.info('Preset deleted successfully', { presetId });
      return true;
    } catch (error) {
      logger.error('Failed to delete preset', { error: error.message, presetId });
      throw error;
    }
  },

  /**
   * Save user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} - Updated user data
   */
  async saveUserPreferences(userId, preferences) {
    try {
      logger.info('Saving user preferences', { userId });
      const user = await pb.collection('users').update(userId, {
        preferences: JSON.stringify(preferences),
        onboardingCompleted: true
      });
      logger.info('User preferences saved successfully', { userId });
      return user;
    } catch (error) {
      logger.error('Failed to save user preferences', { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Get instance of PocketBase client
   * @returns {PocketBase} - PocketBase client instance
   */
  getPocketBaseInstance() {
    return pb;
  }
};

module.exports = pocketbaseService; 