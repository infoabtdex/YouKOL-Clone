const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const pocketbaseService = require('../services/pocketbaseService');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all preset routes with authentication
router.use(authMiddleware);

/**
 * @route   GET /api/presets
 * @desc    Get all presets for the authenticated user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const presets = await pocketbaseService.getUserPresets(req.user.id);
    
    logger.info('Presets fetched successfully', { userId: req.user.id, count: presets.length });
    
    res.json({
      success: true,
      presets: presets.map(preset => ({
        id: preset.id,
        name: preset.name,
        settings: preset.settings,
        isDefault: preset.isDefault,
        created: preset.created,
        updated: preset.updated
      }))
    });
  } catch (error) {
    logger.error('Error fetching presets', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Error fetching presets'
    });
  }
});

/**
 * @route   POST /api/presets
 * @desc    Create a new preset
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, settings, isDefault } = req.body;
    
    // Validate required fields
    if (!name || !settings) {
      logger.warn('Create preset failed: Missing required fields', { userId: req.user.id });
      return res.status(400).json({
        success: false,
        message: 'Name and settings are required'
      });
    }
    
    // Create preset
    const preset = await pocketbaseService.createPreset(req.user.id, {
      name,
      settings,
      isDefault: isDefault || false
    });
    
    logger.info('Preset created successfully', { presetId: preset.id, userId: req.user.id });
    
    res.status(201).json({
      success: true,
      preset: {
        id: preset.id,
        name: preset.name,
        settings: preset.settings,
        isDefault: preset.isDefault,
        created: preset.created,
        updated: preset.updated
      }
    });
  } catch (error) {
    logger.error('Error creating preset', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      message: 'Error creating preset'
    });
  }
});

/**
 * @route   GET /api/presets/:id
 * @desc    Get a specific preset
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const presetId = req.params.id;
    
    // Get preset
    const preset = await pocketbaseService.getPreset(presetId);
    
    // Check if preset belongs to user
    if (preset.user !== req.user.id) {
      logger.warn('Unauthorized preset access attempt', { presetId, userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this preset'
      });
    }
    
    logger.info('Preset fetched successfully', { presetId, userId: req.user.id });
    
    res.json({
      success: true,
      preset: {
        id: preset.id,
        name: preset.name,
        settings: preset.settings,
        isDefault: preset.isDefault,
        created: preset.created,
        updated: preset.updated
      }
    });
  } catch (error) {
    logger.error('Error fetching preset', { error: error.message, presetId: req.params.id });
    
    // Handle not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching preset'
    });
  }
});

/**
 * @route   PUT /api/presets/:id
 * @desc    Update a preset
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const presetId = req.params.id;
    const { name, settings, isDefault } = req.body;
    
    // Get existing preset to check ownership
    const existingPreset = await pocketbaseService.getPreset(presetId);
    
    // Check if preset belongs to user
    if (existingPreset.user !== req.user.id) {
      logger.warn('Unauthorized preset update attempt', { presetId, userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this preset'
      });
    }
    
    // Validate required fields
    if (!name && !settings && isDefault === undefined) {
      logger.warn('Update preset failed: No fields to update', { presetId, userId: req.user.id });
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (settings) updateData.settings = settings;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    
    // Update preset
    const updatedPreset = await pocketbaseService.updatePreset(presetId, updateData);
    
    logger.info('Preset updated successfully', { presetId, userId: req.user.id });
    
    res.json({
      success: true,
      preset: {
        id: updatedPreset.id,
        name: updatedPreset.name,
        settings: updatedPreset.settings,
        isDefault: updatedPreset.isDefault,
        created: updatedPreset.created,
        updated: updatedPreset.updated
      }
    });
  } catch (error) {
    logger.error('Error updating preset', { error: error.message, presetId: req.params.id });
    
    // Handle not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating preset'
    });
  }
});

/**
 * @route   DELETE /api/presets/:id
 * @desc    Delete a preset
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const presetId = req.params.id;
    
    // Get existing preset to check ownership
    const existingPreset = await pocketbaseService.getPreset(presetId);
    
    // Check if preset belongs to user
    if (existingPreset.user !== req.user.id) {
      logger.warn('Unauthorized preset deletion attempt', { presetId, userId: req.user.id });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this preset'
      });
    }
    
    // Delete preset
    await pocketbaseService.deletePreset(presetId);
    
    logger.info('Preset deleted successfully', { presetId, userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Preset deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting preset', { error: error.message, presetId: req.params.id });
    
    // Handle not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting preset'
    });
  }
});

module.exports = router; 