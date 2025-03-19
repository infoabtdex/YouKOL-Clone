# Server-Side Implementation Structure

This document outlines the directory structure and file organization for implementing the server-side Pocketbase integration.

## Directory Structure

```
/
├── server/                # Node.js server files
│   ├── routes/            # API route handlers
│   │   ├── auth.js        # Authentication routes
│   │   ├── presets.js     # Enhancement preset routes
│   │   └── enhancements.js # Enhancement settings routes
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # Authentication middleware
│   │   ├── errorHandler.js # Error handling middleware
│   │   └── logger.js      # Request logging middleware
│   ├── services/          # Business logic
│   │   ├── pocketbase.js  # PocketBase service
│   │   └── logger.js      # Logging service
│   ├── config/            # Configuration files
│   │   └── index.js       # Configuration loader
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── public/                # Static frontend files
├── pocketbase/            # PocketBase executable and database
```

## Implementation Files

### 1. Main Server File

```javascript
// server/server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth');
const presetRoutes = require('./routes/presets');
const enhancementRoutes = require('./routes/enhancements');

// Import PocketBase service
const pb = require('./services/pocketbase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(logger);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'youkol-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/enhancements', enhancementRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. PocketBase Service

```javascript
// server/services/pocketbase.js
const PocketBase = require('pocketbase/cjs');

class PocketBaseService {
  constructor() {
    this.pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
    
    // Optional: setup admin authentication if needed
    if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
      this.adminAuth();
    }
  }
  
  async adminAuth() {
    try {
      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      console.log('Admin authenticated with PocketBase');
    } catch (error) {
      console.error('Failed to authenticate admin with PocketBase:', error);
    }
  }
  
  // User authentication methods
  async registerUser(userData) {
    return await this.pb.collection('users').create(userData);
  }
  
  async loginUser(identity, password) {
    // Determine if identity is email or username
    const isEmail = identity.includes('@');
    const authData = await this.pb.collection('users').authWithPassword(
      identity,
      password
    );
    return authData;
  }
  
  async getUserById(userId) {
    return await this.pb.collection('users').getOne(userId);
  }
  
  async createUserProfile(profileData) {
    return await this.pb.collection('user_profiles').create(profileData);
  }
  
  async getUserProfile(userId) {
    return await this.pb.collection('user_profiles').getFirstListItem(`user="${userId}"`);
  }
  
  // Enhancement preset methods
  async getUserPresets(userId) {
    return await this.pb.collection('enhancement_presets').getFullList({
      filter: `user="${userId}"`,
      sort: '-created'
    });
  }
  
  async getPresetById(presetId) {
    return await this.pb.collection('enhancement_presets').getOne(presetId);
  }
  
  async createPreset(presetData) {
    return await this.pb.collection('enhancement_presets').create(presetData);
  }
  
  async updatePreset(presetId, data) {
    return await this.pb.collection('enhancement_presets').update(presetId, data);
  }
  
  async deletePreset(presetId) {
    return await this.pb.collection('enhancement_presets').delete(presetId);
  }
  
  // Enhancement settings methods
  async getPresetSettings(presetId) {
    return await this.pb.collection('enhancement_settings').getFullList({
      filter: `preset="${presetId}"`
    });
  }
  
  async createSetting(settingData) {
    return await this.pb.collection('enhancement_settings').create(settingData);
  }
  
  async updateSetting(settingId, data) {
    return await this.pb.collection('enhancement_settings').update(settingId, data);
  }
  
  async deleteSetting(settingId) {
    return await this.pb.collection('enhancement_settings').delete(settingId);
  }
}

// Create a singleton instance
const pocketBaseService = new PocketBaseService();

module.exports = pocketBaseService;
```

### 3. Authentication Middleware

```javascript
// server/middleware/auth.js
const pbService = require('../services/pocketbase');

/**
 * Authentication middleware to protect routes
 */
function authMiddleware(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized. Please log in.' 
    });
  }

  // Optionally verify the user exists in PocketBase
  pbService.getUserById(req.session.userId)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      // If user doesn't exist or token is invalid
      console.error('Auth middleware error:', error);
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired. Please log in again.' 
      });
    });
}

module.exports = authMiddleware;
```

### 4. Authentication Routes

```javascript
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const pbService = require('../services/pocketbase');

// Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, username } = req.body;
    
    // Validate required fields
    if (!email || !password || !passwordConfirm || !username) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    // Create user in PocketBase
    const user = await pbService.registerUser({
      email,
      password,
      passwordConfirm,
      username
    });
    
    // Create user profile
    await pbService.createUserProfile({
      user: user.id,
      display_name: username,
      bio: ''
    });
    
    // Return success response (don't include sensitive data)
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { identity, password } = req.body;
    
    // Validate required fields
    if (!identity || !password) {
      return res.status(400).json({
        success: false,
        error: 'Identity and password are required'
      });
    }
    
    // Authenticate with PocketBase
    const authData = await pbService.loginUser(identity, password);
    
    // Store user ID in session
    req.session.userId = authData.record.id;
    
    // Get user profile
    const profile = await pbService.getUserProfile(authData.record.id);
    
    // Return user data
    res.json({
      success: true,
      user: {
        id: authData.record.id,
        email: authData.record.email,
        username: authData.record.username,
        profile: {
          displayName: profile.display_name,
          bio: profile.bio
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to logout' 
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }
    
    const user = await pbService.getUserById(req.session.userId);
    const profile = await pbService.getUserProfile(req.session.userId);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: {
          displayName: profile.display_name,
          bio: profile.bio
        }
      }
    });
  } catch (error) {
    // If user not found, destroy session
    if (error.status === 404) {
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired' 
      });
    }
    next(error);
  }
});

// Request password reset
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    await pbService.pb.collection('users').requestPasswordReset(email);
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent' 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 5. Enhancement Preset Routes

```javascript
// server/routes/presets.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pbService = require('../services/pocketbase');

// Apply auth middleware to all preset routes
router.use(authMiddleware);

// Get all presets for current user
router.get('/', async (req, res, next) => {
  try {
    const presets = await pbService.getUserPresets(req.user.id);
    
    // For each preset, get its settings
    const presetsWithSettings = await Promise.all(
      presets.map(async (preset) => {
        const settings = await pbService.getPresetSettings(preset.id);
        return {
          ...preset,
          settings
        };
      })
    );
    
    res.json({ success: true, presets: presetsWithSettings });
  } catch (error) {
    next(error);
  }
});

// Get preset by ID
router.get('/:id', async (req, res, next) => {
  try {
    const preset = await pbService.getPresetById(req.params.id);
    
    // Check if preset belongs to current user
    if (preset.user !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }
    
    // Get settings for this preset
    const settings = await pbService.getPresetSettings(preset.id);
    
    res.json({ 
      success: true, 
      preset: {
        ...preset,
        settings
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new preset
router.post('/', async (req, res, next) => {
  try {
    const { name, isDefault, settings } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Preset name is required'
      });
    }
    
    // If this is being set as default, update other presets
    if (isDefault) {
      try {
        const userPresets = await pbService.getUserPresets(req.user.id);
        const defaultPreset = userPresets.find(p => p.is_default);
        
        if (defaultPreset) {
          await pbService.updatePreset(defaultPreset.id, {
            is_default: false
          });
        }
      } catch (error) {
        console.error('Error updating default preset:', error);
        // Continue with preset creation anyway
      }
    }
    
    // Create the preset
    const preset = await pbService.createPreset({
      user: req.user.id,
      name,
      is_default: isDefault || false
    });
    
    // Create settings if provided
    const createdSettings = [];
    if (settings && Array.isArray(settings)) {
      for (const setting of settings) {
        const newSetting = await pbService.createSetting({
          preset: preset.id,
          setting_type: setting.type,
          intensity: setting.intensity || 50,
          enabled: setting.enabled || false
        });
        createdSettings.push(newSetting);
      }
    }
    
    res.status(201).json({
      success: true,
      preset: {
        ...preset,
        settings: createdSettings
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update preset
router.put('/:id', async (req, res, next) => {
  try {
    const { name, isDefault } = req.body;
    
    // Get preset
    const preset = await pbService.getPresetById(req.params.id);
    
    // Check if preset belongs to current user
    if (preset.user !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }
    
    // If setting as default, update other presets
    if (isDefault && !preset.is_default) {
      try {
        const userPresets = await pbService.getUserPresets(req.user.id);
        const currentDefault = userPresets.find(p => p.is_default && p.id !== preset.id);
        
        if (currentDefault) {
          await pbService.updatePreset(currentDefault.id, {
            is_default: false
          });
        }
      } catch (error) {
        console.error('Error updating default preset:', error);
        // Continue with preset update anyway
      }
    }
    
    // Update preset
    const updatedPreset = await pbService.updatePreset(req.params.id, {
      name: name !== undefined ? name : preset.name,
      is_default: isDefault !== undefined ? isDefault : preset.is_default
    });
    
    // Get settings for this preset
    const settings = await pbService.getPresetSettings(updatedPreset.id);
    
    res.json({ 
      success: true, 
      preset: {
        ...updatedPreset,
        settings
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete preset
router.delete('/:id', async (req, res, next) => {
  try {
    // Get preset
    const preset = await pbService.getPresetById(req.params.id);
    
    // Check if preset belongs to current user
    if (preset.user !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }
    
    // Get settings for this preset
    const settings = await pbService.getPresetSettings(preset.id);
    
    // Delete settings
    for (const setting of settings) {
      await pbService.deleteSetting(setting.id);
    }
    
    // Delete preset
    await pbService.deletePreset(preset.id);
    
    res.json({ 
      success: true, 
      message: 'Preset deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 6. Client-Side API Service

```javascript
// client/src/services/api.js
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Important for session cookies
});

// Error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear local auth state if needed
      if (window.authState) {
        window.authState.user = null;
      }
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  resetPassword: (email) => api.post('/auth/reset-password', { email })
};

// Preset services
export const presetService = {
  getAllPresets: () => api.get('/presets'),
  getPreset: (id) => api.get(`/presets/${id}`),
  createPreset: (presetData) => api.post('/presets', presetData),
  updatePreset: (id, presetData) => api.put(`/presets/${id}`, presetData),
  deletePreset: (id) => api.delete(`/presets/${id}`)
};

// Enhancement services
export const enhancementService = {
  getPresetSettings: (presetId) => api.get(`/enhancements/preset/${presetId}`),
  updateSetting: (id, settingData) => api.put(`/enhancements/${id}`, settingData),
  createSetting: (settingData) => api.post('/enhancements', settingData),
  deleteSetting: (id) => api.delete(`/enhancements/${id}`)
};

export default {
  auth: authService,
  presets: presetService,
  enhancements: enhancementService
}; 