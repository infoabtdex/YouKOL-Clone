const logger = require('../../logger');
const pbService = require('../services/pocketbase');

/**
 * Middleware to require authentication for protected routes
 * Checks if the user is authenticated via session
 * If authenticated, attaches user data to the request object
 * If not authenticated, returns a 401 Unauthorized response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
function requireAuth(req, res, next) {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    logger.warn('Unauthorized access attempt', { 
      path: req.path,
      ip: req.ip,
      method: req.method
    });
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // User is authenticated, proceed to the route handler
  next();
}

/**
 * Middleware to attach user data to the request object if authenticated
 * Does not block the request if user is not authenticated
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
async function attachUserData(req, res, next) {
  try {
    // Skip if no user ID in session
    if (!req.session || !req.session.userId) {
      return next();
    }
    
    // Get user data from PocketBase
    const userData = await pbService.getCompleteUserData(req.session.userId);
    
    // Attach user data to request object
    req.user = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      displayName: userData.display_name || userData.username,
      isOnboarded: userData.onboarding_completed || false,
      profileId: userData.profile_id
    };
    
    // Proceed to the route handler
    next();
  } catch (error) {
    logger.error('Failed to attach user data', { 
      userId: req.session?.userId,
      error: error.message
    });
    
    // Clear invalid session
    if (error.status === 404) {
      req.session.destroy(err => {
        if (err) {
          logger.error('Failed to destroy invalid session', { error: err.message });
        }
      });
    }
    
    // Continue without user data
    next();
  }
}

/**
 * Middleware to require completed onboarding
 * Must be used after attachUserData middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
function requireOnboarding(req, res, next) {
  // Check if user exists and has completed onboarding
  if (!req.user || !req.user.isOnboarded) {
    return res.status(403).json({
      success: false,
      message: 'Onboarding required',
      code: 'ONBOARDING_REQUIRED'
    });
  }
  
  // User has completed onboarding, proceed to the route handler
  next();
}

module.exports = {
  requireAuth,
  attachUserData,
  requireOnboarding
}; 