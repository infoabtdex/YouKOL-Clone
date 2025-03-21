const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pbService = require('../services/pocketbase');
const { requireAuth, attachUserData, requireOnboarding } = require('../middleware/auth');
const logger = require('../../logger');

/**
 * @route GET /api/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/', requireAuth, attachUserData, async (req, res) => {
  try {
    // User data is already attached to req.user by the attachUserData middleware
    // For more detailed profile, we can fetch the complete profile
    const profile = await pbService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      profile: {
        id: profile.id,
        userId: profile.user,
        displayName: profile.display_name || req.user.username,
        bio: profile.bio || '',
        preferences: profile.preferences || {},
        onboardingCompleted: profile.onboarding_completed || false,
        onboardingData: profile.onboarding_data || {},
        createdAt: profile.created,
        updatedAt: profile.updated
      }
    });
  } catch (error) {
    logger.error('Failed to fetch user profile', { 
      userId: req.user.id,
      error: error.message
    });
    
    // If profile doesn't exist, create it
    if (error.status === 404) {
      try {
        const newProfile = await pbService.getOrCreateUserProfile(req.user.id);
        
        return res.json({
          success: true,
          profile: {
            id: newProfile.id,
            userId: newProfile.user,
            displayName: newProfile.display_name || req.user.username,
            bio: newProfile.bio || '',
            preferences: newProfile.preferences || {},
            onboardingCompleted: newProfile.onboarding_completed || false,
            onboardingData: newProfile.onboarding_data || {},
            createdAt: newProfile.created,
            updatedAt: newProfile.updated
          }
        });
      } catch (createError) {
        logger.error('Failed to create user profile', { 
          userId: req.user.id,
          error: createError.message
        });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve or create user profile'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * @route PUT /api/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/', [
  requireAuth,
  attachUserData,
  body('displayName').optional().isString().isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  body('bio').optional().isString().isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('preferences').optional().isObject()
    .withMessage('Preferences must be an object')
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
    
    // Get profile ID from user data
    if (!req.user.profileId) {
      // Create profile if it doesn't exist
      const profile = await pbService.getOrCreateUserProfile(req.user.id);
      req.user.profileId = profile.id;
    }
    
    // Prepare update data - only include fields that were provided
    const updateData = {};
    if (req.body.displayName !== undefined) updateData.display_name = req.body.displayName;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.preferences !== undefined) {
      // Merge with existing preferences if any
      try {
        const currentProfile = await pbService.getUserProfile(req.user.id);
        const currentPreferences = currentProfile.preferences || {};
        updateData.preferences = JSON.stringify({
          ...currentPreferences,
          ...req.body.preferences
        });
      } catch (error) {
        // If profile doesn't exist, just use the new preferences
        updateData.preferences = JSON.stringify(req.body.preferences);
      }
    }
    
    // Update profile
    const updatedProfile = await pbService.updateUserProfile(req.user.profileId, updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        userId: updatedProfile.user,
        displayName: updatedProfile.display_name,
        bio: updatedProfile.bio || '',
        preferences: updatedProfile.preferences || {},
        onboardingCompleted: updatedProfile.onboarding_completed || false,
        onboardingData: updatedProfile.onboarding_data || {},
        createdAt: updatedProfile.created,
        updatedAt: updatedProfile.updated
      }
    });
  } catch (error) {
    logger.error('Failed to update user profile', { 
      userId: req.user.id,
      profileId: req.user.profileId,
      error: error.message,
      data: error.data
    });
    
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile data',
        errors: error.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again later.'
    });
  }
});

/**
 * @route POST /api/profile/onboarding
 * @desc Complete user onboarding
 * @access Private
 */
router.post('/onboarding', [
  requireAuth,
  attachUserData,
  body('preferences').optional().isObject()
    .withMessage('Preferences must be an object'),
  body('completed').isBoolean()
    .withMessage('Completed status is required')
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
    
    const { preferences, completed, steps } = req.body;
    
    // Update onboarding status
    const onboardingData = {
      completed,
      preferences: preferences || {},
      steps: steps || []
    };
    
    await pbService.updateOnboardingStatus(req.user.id, onboardingData);
    
    res.json({
      success: true,
      message: 'Onboarding status updated',
      onboarding: {
        completed,
        preferences: preferences || {},
        steps: steps || []
      }
    });
  } catch (error) {
    logger.error('Failed to update onboarding status', { 
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding status'
    });
  }
});

/**
 * @route GET /api/profile/onboarding/status
 * @desc Check onboarding status
 * @access Private
 */
router.get('/onboarding/status', requireAuth, attachUserData, async (req, res) => {
  try {
    const completed = await pbService.hasCompletedOnboarding(req.user.id);
    
    // Get detailed onboarding data if available
    let onboardingData = {};
    try {
      const profile = await pbService.getUserProfile(req.user.id);
      onboardingData = profile.onboarding_data || {};
    } catch (err) {
      // Ignore errors, we'll use default empty object
    }
    
    res.json({
      success: true,
      onboarding: {
        completed,
        ...onboardingData
      }
    });
  } catch (error) {
    logger.error('Failed to check onboarding status', { 
      userId: req.user.id,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to check onboarding status'
    });
  }
});

module.exports = router; 