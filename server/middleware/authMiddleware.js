const pocketbaseService = require('../services/pocketbaseService');
const logger = require('../utils/logger');

/**
 * Middleware to check if the user is authenticated
 * Uses the session token to verify authentication and 
 * attaches the user to the request object if authenticated
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Check if session exists
    if (!req.session || !req.session.token) {
      logger.warn('Authentication failed: No session token found');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Get user from token
    const user = await pocketbaseService.getAuthenticatedUser(req.session.token);
    
    if (!user) {
      logger.warn('Authentication failed: Invalid or expired token');
      // Clear the invalid session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Error destroying session', { error: err.message });
        }
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: Invalid or expired token' 
      });
    }

    // Attach user to request object
    req.user = user;
    
    logger.info('User authenticated successfully', { userId: user.id });
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
};

module.exports = authMiddleware; 