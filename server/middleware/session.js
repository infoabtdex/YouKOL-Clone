const session = require('express-session');
const logger = require('../../logger');

/**
 * Configure session middleware for Express
 * 
 * Uses environment-specific settings:
 * - Production: Secure cookies, strict SameSite, should use a production store
 * - Testing: Relaxed cookie settings for testing environments
 * - Development: Default settings for local development
 * 
 * @returns {Function} Configured express-session middleware
 */
function configureSession() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Default session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'default-dev-secret-change-this',
    name: 'youkol_session',                             // Custom cookie name
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,                                   // Prevents client-side JS from reading the cookie
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours by default
      sameSite: 'lax'                                   // Provides CSRF protection
    }
  };
  
  // Apply environment-specific settings
  if (isProduction) {
    // Production settings
    sessionConfig.cookie.secure = true;                 // Requires HTTPS
    sessionConfig.cookie.sameSite = 'strict';           // Stronger CSRF protection
    
    // IMPORTANT: Configure a production session store here
    // Example with Redis:
    // const RedisStore = require('connect-redis')(session);
    // sessionConfig.store = new RedisStore({ client: redisClient });
    
    logger.info('Session configured for production environment');
  } else if (isTest) {
    // Testing-specific settings
    sessionConfig.cookie.sameSite = 'none';             // Allow cross-site cookies for tests
    sessionConfig.cookie.secure = false;                // Allow non-HTTPS for tests
    
    logger.info('Session configured for testing environment');
  } else {
    // Development settings (default)
    logger.info('Session configured for development environment');
  }
  
  // Log session config details at debug level
  logger.debug('Session configuration', { 
    name: sessionConfig.name,
    cookieMaxAge: sessionConfig.cookie.maxAge,
    sameSite: sessionConfig.cookie.sameSite,
    secure: sessionConfig.cookie.secure || false,
    store: sessionConfig.store ? 'custom' : 'memory'
  });
  
  return session(sessionConfig);
}

module.exports = configureSession; 