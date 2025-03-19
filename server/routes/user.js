const express = require('express');
const router = express.Router();
const logger = require('../../logger');
const pocketbaseService = require('../services/pocketbase');
const authMiddleware = require('../middleware/auth');

// Protect all user routes with authentication
router.use(authMiddleware());

/**
 * GET /api/user/profile
 * Get the user's profile
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await pocketbaseService.getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        bio: profile.bio,
        onboardingCompleted: profile.onboarding_completed || false,
        usageFrequency: profile.usage_frequency,
        contentTypes: profile.content_types ? JSON.parse(profile.content_types) : []
      }
    });
  } catch (error) {
    logger.error(`Error getting user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * POST /api/user/preferences
 * Update user preferences
 */
router.post('/preferences', async (req, res) => {
  try {
    const { usageFrequency, contentTypes, onboardingCompleted } = req.body;
    
    // Get user profile
    const profile = await pocketbaseService.getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (usageFrequency) {
      updateData.usage_frequency = usageFrequency;
    }
    
    if (contentTypes) {
      updateData.content_types = JSON.stringify(contentTypes);
    }
    
    if (onboardingCompleted !== undefined) {
      updateData.onboarding_completed = onboardingCompleted;
    }
    
    // Update profile
    const updatedProfile = await pocketbaseService.updateUserProfile(profile.id, updateData);
    
    logger.info(`User preferences updated for user: ${req.user.id}`);
    
    res.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        displayName: updatedProfile.display_name,
        bio: updatedProfile.bio,
        onboardingCompleted: updatedProfile.onboarding_completed,
        usageFrequency: updatedProfile.usage_frequency,
        contentTypes: updatedProfile.content_types ? JSON.parse(updatedProfile.content_types) : []
      }
    });
  } catch (error) {
    logger.error(`Error updating user preferences: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    
    // Get user profile
    const profile = await pocketbaseService.getUserProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (displayName) {
      updateData.display_name = displayName;
    }
    
    if (bio !== undefined) {
      updateData.bio = bio;
    }
    
    // Update profile
    const updatedProfile = await pocketbaseService.updateUserProfile(profile.id, updateData);
    
    logger.info(`Profile updated for user: ${req.user.id}`);
    
    res.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        displayName: updatedProfile.display_name,
        bio: updatedProfile.bio,
        onboardingCompleted: updatedProfile.onboarding_completed,
        usageFrequency: updatedProfile.usage_frequency,
        contentTypes: updatedProfile.content_types ? JSON.parse(updatedProfile.content_types) : []
      }
    });
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router; 