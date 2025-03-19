const express = require('express');
const router = express.Router();
const pocketbaseService = require('../services/pocketbaseService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, passwordConfirm, name } = req.body;

    // Validate required fields
    if (!email || !password || !passwordConfirm) {
      logger.warn('Registration failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and password confirmation are required' 
      });
    }

    // Validate password match
    if (password !== passwordConfirm) {
      logger.warn('Registration failed: Passwords do not match');
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Register user
    const user = await pocketbaseService.registerUser({
      email,
      password,
      passwordConfirm,
      name
    });

    // Login user after registration
    const authData = await pocketbaseService.loginUser(email, password);
    
    // Store token in session (server-side)
    req.session.token = authData.token;
    
    // Return user data (without sensitive info)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingCompleted: false
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message, data: error.data });
    
    // Handle PocketBase validation errors
    if (error.data) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      logger.warn('Login failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Login user
    const authData = await pocketbaseService.loginUser(email, password);
    
    // Store token in session (server-side)
    req.session.token = authData.token;
    
    // Extract user from auth data
    const user = authData.record;
    
    // Return user data (without sensitive info)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingCompleted: user.onboardingCompleted || false,
        preferences: user.preferences ? JSON.parse(user.preferences) : null
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    
    // Specific error for invalid credentials
    if (error.status === 400) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.get('/logout', async (req, res) => {
  try {
    // Clear PocketBase auth store
    await pocketbaseService.logout();
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session', { error: err.message });
        return res.status(500).json({
          success: false,
          message: 'Error logging out'
        });
      }
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // User is attached to req by authMiddleware
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingCompleted: user.onboardingCompleted || false,
        preferences: user.preferences ? JSON.parse(user.preferences) : null
      }
    });
  } catch (error) {
    logger.error('Error getting current user', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting current user'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      logger.warn('Password reset failed: Missing email');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    await pocketbaseService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Password reset error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email'
    });
  }
});

/**
 * @route   POST /api/auth/preferences
 * @desc    Save user preferences
 * @access  Private
 */
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      logger.warn('Saving preferences failed: Missing preferences data');
      return res.status(400).json({
        success: false,
        message: 'Preferences data is required'
      });
    }
    
    const updatedUser = await pocketbaseService.saveUserPreferences(
      req.user.id,
      preferences
    );
    
    res.json({
      success: true,
      message: 'User preferences saved successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        onboardingCompleted: updatedUser.onboardingCompleted || false,
        preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : null
      }
    });
  } catch (error) {
    logger.error('Error saving preferences', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error saving user preferences'
    });
  }
});

module.exports = router; 