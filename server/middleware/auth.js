const logger = require('../../logger');
const pocketbaseService = require('../services/pocketbase');

/**
 * Authentication middleware
 * Verifies that the user has a valid session and attaches the user to the request object
 */
function authMiddleware() {
  return async (req, res, next) => {
    // Check if user ID exists in session
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized. Please log in.'
      });
    }

    try {
      // Get the user from PocketBase
      const user = await pocketbaseService.getUserById(req.session.userId);
      
      // Attach user to request for use in route handlers
      req.user = user;
      
      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      // If PocketBase can't find the user or there's another error
      logger.error(`Authentication error: ${error.message}`);
      
      // Destroy the session as it's no longer valid
      req.session.destroy(err => {
        if (err) {
          logger.error(`Error destroying session: ${err.message}`);
        }
      });
      
      return res.status(401).json({ 
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
  };
}

module.exports = authMiddleware; 