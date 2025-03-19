const PocketBase = require('pocketbase/cjs');
const logger = require('../../logger');

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    // Initialize connection status
    this.isConnected = false;
    this.checkConnection();
    
    // Try admin authentication if credentials are provided
    if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
      this.adminAuth();
    }
  }
  
  /**
   * Check connection to PocketBase
   */
  async checkConnection() {
    try {
      const healthStatus = await this.pb.health.check();
      this.isConnected = true;
      logger.info('✅ PocketBase connection successful');
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('❌ Failed to connect to PocketBase: ' + error.message);
      return false;
    }
  }
  
  /**
   * Authenticate as admin
   */
  async adminAuth() {
    try {
      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      logger.info('👤 Admin authenticated with PocketBase');
    } catch (error) {
      logger.error('❌ Failed to authenticate admin with PocketBase: ' + error.message);
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  async registerUser(userData) {
    return await this.pb.collection('users').create(userData);
  }
  
  /**
   * Authenticate a user
   * @param {string} identity - Email or username
   * @param {string} password - User password
   */
  async loginUser(identity, password) {
    // Determine if identity is email or username
    const authData = await this.pb.collection('users').authWithPassword(
      identity,
      password
    );
    return authData;
  }
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   */
  async getUserById(userId) {
    return await this.pb.collection('users').getOne(userId);
  }
  
  /**
   * Create a user profile
   * @param {Object} profileData - Profile data
   */
  async createUserProfile(profileData) {
    return await this.pb.collection('user_profiles').create(profileData);
  }
  
  /**
   * Get a user's profile
   * @param {string} userId - User ID
   */
  async getUserProfile(userId) {
    try {
      return await this.pb.collection('user_profiles').getFirstListItem(`user="${userId}"`);
    } catch (error) {
      logger.warn(`Profile not found for user ${userId}`);
      return null;
    }
  }
  
  /**
   * Update a user profile
   * @param {string} profileId - Profile ID
   * @param {Object} data - Updated profile data
   */
  async updateUserProfile(profileId, data) {
    return await this.pb.collection('user_profiles').update(profileId, data);
  }
  
  /**
   * Create an enhancement preset
   * @param {Object} presetData - Preset data
   */
  async createPreset(presetData) {
    return await this.pb.collection('enhancement_presets').create(presetData);
  }
  
  /**
   * Get presets for a user
   * @param {string} userId - User ID
   */
  async getUserPresets(userId) {
    return await this.pb.collection('enhancement_presets').getFullList({
      filter: `user="${userId}"`,
      sort: '-created'
    });
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   */
  async requestPasswordReset(email) {
    return await this.pb.collection('users').requestPasswordReset(email);
  }
}

// Export a singleton instance
module.exports = new PocketBaseService(); 