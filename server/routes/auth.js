const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pbService = require('../services/pocketbase');
const { requireAuth, attachUserData, trackLoginAttempt, resetLoginAttempts } = require('../middleware/auth');
const logger = require('../../logger');
const sanitizeHtml = require('sanitize-html');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', [
  // Validation middleware with enhanced security
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('username')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .isAlphanumeric().withMessage('Username can only contain letters and numbers')
    .trim(),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Verify CSRF token is present in header
    if (!req.csrfToken || req.get('X-CSRF-Token') !== req.csrfToken()) {
      logger.warn('CSRF token validation failed', { 
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or missing CSRF token'
      });
    }
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { email, password, passwordConfirm, username } = req.body;
    
    // Register user with PocketBase
    const user = await pbService.registerUser({
      email,
      password,
      passwordConfirm,
      username
    });
    
    // Create default user profile with sanitized input
    await pbService.createUserProfile({
      user: user.id,
      display_name: sanitizeHtml(username),
      onboarding_completed: false
    });
    
    // Return success response (but don't login automatically)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    logger.error('Registration failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Handle specific error cases
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed',
        errors: error.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user and create session
 * @access Public
 */
router.post('/login', [
  // Validation middleware
  body('identity')
    .notEmpty().withMessage('Email or username is required')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Verify CSRF token is present in header
    if (!req.csrfToken || req.get('X-CSRF-Token') !== req.csrfToken()) {
      logger.warn('CSRF token validation failed', { 
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or missing CSRF token'
      });
    }
    
    // Check for IP-based brute force protection
    if (trackLoginAttempt(req.ip)) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again later.'
      });
    }
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { identity, password } = req.body;
    
    // Authenticate with PocketBase
    const authData = await pbService.loginUser(identity, password);
    
    // Reset login attempts on successful login
    resetLoginAttempts(req.ip);
    
    // Create session
    req.session.userId = authData.record.id;
    req.session.authenticated = true;
    req.session.userAgent = req.get('User-Agent');
    req.session.ipAddress = req.ip;
    
    // Get complete user data with profile
    const userData = await pbService.getCompleteUserData(authData.record.id);
      
    // Return user data without tokens
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        displayName: userData.display_name,
        isOnboarded: userData.onboarding_completed || false
      }
    });
  } catch (error) {
    logger.error('Login failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Handle specific error cases
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Login failed',
        errors: error.data ? [error.data] : [{ msg: 'Invalid credentials' }]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and destroy session
 * @access Private
 */
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Failed to destroy session', { error: err.message });
      return res.status(500).json({
        success: false,
        message: 'Logout failed. Please try again.'
      });
    }
    
    // Clear the session cookie
    res.clearCookie('youkol_session');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * @route GET /api/auth/status
 * @desc Check if user is authenticated
 * @access Public
 */
router.get('/status', attachUserData, (req, res) => {
  if (req.user) {
    // User is authenticated and data is attached
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    // User is not authenticated
    res.json({
      authenticated: false
    });
  }
});

/**
 * @route POST /api/auth/password-reset/request
 * @desc Request password reset
 * @access Public
 */
router.post('/password-reset/request', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { email } = req.body;
    
    // Request password reset from PocketBase
    await pbService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Password reset request failed', { error: error.message });
    
    // Don't reveal if the email exists or not
    res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent'
    });
  }
});

/**
 * @route POST /api/auth/password-reset/confirm
 * @desc Confirm password reset
 * @access Public
 */
router.post('/password-reset/confirm', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { token, password, passwordConfirm } = req.body;
    
    // Confirm password reset with PocketBase
    await pbService.confirmPasswordReset(token, password, passwordConfirm);
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Password reset confirmation failed', { error: error.message });
    
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        errors: error.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again later.'
    });
  }
});

module.exports = router; 