const session = require('express-session');

// Get session secret from environment variable or use a default for development
const SESSION_SECRET = process.env.SESSION_SECRET || 'youkol-dev-secret-change-in-production';

/**
 * Configure session settings for Express
 * Uses secure HTTP-only cookies for server-side session storage
 */
const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Set secure to true in production when using HTTPS
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Prevents client-side JS from reading the cookie
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Provides CSRF protection
  }
};

module.exports = sessionConfig; 