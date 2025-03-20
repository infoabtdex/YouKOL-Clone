# Step 1: Setup PocketBase and Required Dependencies

This document provides detailed instructions for setting up PocketBase and the required dependencies for the YouKOL Clone project.

## 1. Install PocketBase SDK and Dependencies

Add the following dependencies to the project:

```bash
npm install pocketbase express-session express-rate-limit helmet cookie-parser
```

**Update package.json**

```json
{
  "dependencies": {
    // ...existing dependencies
    "cookie-parser": "^1.4.6",
    "express-rate-limit": "^7.1.5",
    "express-session": "^1.18.0",
    "helmet": "^7.1.0",
    "pocketbase": "^0.21.1"
  }
}
```

## 2. Configure Server Environment Variables

Update the `.env` file with the following PocketBase configuration:

```
# PocketBase Configuration
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@youkol.com
POCKETBASE_ADMIN_PASSWORD=secure_admin_password

# Session Configuration
SESSION_SECRET=your-session-secret-change-this
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
```

## 3. Create PocketBase Service Module

Create a new file at `server/services/pocketbase.js`:

```javascript
// server/services/pocketbase.js
const PocketBase = require('pocketbase/cjs');
const logger = require('../../logger');

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    this.isConnected = false;
    
    // Set request timeout
    if (process.env.POCKETBASE_TIMEOUT) {
      this.pb.autoCancellation(false);
      const timeout = parseInt(process.env.POCKETBASE_TIMEOUT);
      this.pb.axios.defaults.timeout = timeout;
      logger.info(`PocketBase timeout set to ${timeout}ms`);
    }
    
    // Initialize connection
    this.init();
  }
  
  async init() {
    try {
      // Test connection to PocketBase
      await this.pb.health.check();
      this.isConnected = true;
      logger.info('✅ PocketBase connection successful');
      
      // Admin authentication if credentials are provided
      if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
        await this.adminAuth();
      }
    } catch (error) {
      logger.error('❌ Failed to connect to PocketBase', { error: error.message });
      this.isConnected = false;
      
      // Retry connection
      setTimeout(() => this.init(), 5000);
    }
  }
  
  async adminAuth() {
    try {
      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      logger.info('✅ Admin authenticated with PocketBase');
    } catch (error) {
      logger.error('❌ Failed to authenticate admin with PocketBase', { error: error.message });
    }
  }
  
  // Basic health check method
  async isHealthy() {
    try {
      await this.pb.health.check();
      return true;
    } catch (error) {
      logger.error('PocketBase health check failed', { error: error.message });
      return false;
    }
  }
}

// Create a singleton instance
const pocketBaseService = new PocketBaseService();

module.exports = pocketBaseService;
```

## 4. Create Directory Structure

Ensure the following directory structure exists for the server components:

```
/server
  /services
    pocketbase.js
  /routes
    auth.js
  /middleware
    auth.js
```

## Verification

To verify the PocketBase setup is working correctly, add a health check endpoint to the server. Update the `server.js` file to include:

```javascript
// Import the PocketBase service
const pbService = require('./server/services/pocketbase');

// Add health check endpoint
app.get('/api/health/pocketbase', async (req, res) => {
  if (await pbService.isHealthy()) {
    return res.status(200).json({ status: 'ok', message: 'PocketBase is healthy' });
  }
  return res.status(503).json({ status: 'error', message: 'PocketBase is not responding' });
});
```

## Next Steps

After completing this setup, proceed to [Step 2: Create PocketBase Collections](./step2_pocketbase_collections.md). 