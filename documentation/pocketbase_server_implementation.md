# Server-Side Pocketbase Implementation

## Overview

This document outlines the implementation plan for integrating Pocketbase through a Node.js server-side approach instead of client-side JWT handling. This approach enhances security by keeping sensitive operations and tokens server-side while exposing only necessary endpoints to the client.

## Architecture

```
Client (Browser) <---> Node.js Server <---> Pocketbase
```

In this architecture:
- The client makes HTTP requests to the Node.js server
- The Node.js server manages authentication with Pocketbase
- All Pocketbase API calls are made from the server, not directly from the client
- The Node.js server provides secure session management for clients

## Implementation Components

### 1. Server Setup

#### 1.1 Express.js Server Configuration

```javascript
// server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const PocketBase = require('pocketbase/cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize PocketBase
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Import route handlers
const authRoutes = require('./routes/auth');
const presetRoutes = require('./routes/presets');
const enhancementRoutes = require('./routes/enhancements');

// Use routes
app.use('/api/auth', authRoutes(pb));
app.use('/api/presets', presetRoutes(pb));
app.use('/api/enhancements', enhancementRoutes(pb));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Auth Middleware

```javascript
// middleware/auth.js
function authMiddleware(pb) {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    try {
      // Check if we have a valid session for this user
      const user = await pb.collection('users').getOne(req.session.userId);
      req.user = user;
      next();
    } catch (error) {
      // If PocketBase can't find the user or the token is invalid
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
  };
}

module.exports = authMiddleware;
```

### 3. Authentication Routes

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();

function authRoutes(pb) {
  // Register route
  router.post('/register', async (req, res) => {
    try {
      const { email, password, passwordConfirm, username } = req.body;
      
      // Create user in PocketBase
      const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        username
      });
      
      // Create user profile
      await pb.collection('user_profiles').create({
        user: user.id,
        display_name: username,
        bio: ''
      });
      
      // Send success response (don't return token to client)
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  });
  
  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { identity, password } = req.body;
      
      // Authenticate with PocketBase
      const authData = await pb.collection('users').authWithPassword(
        identity,
        password
      );
      
      // Store user ID in session
      req.session.userId = authData.record.id;
      
      // Get user profile
      const profile = await pb.collection('user_profiles').getFirstListItem(`user="${authData.record.id}"`);
      
      // Send response without tokens
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
      res.status(400).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  });
  
  // Logout route
  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
  
  // Get current user
  router.get('/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await pb.collection('users').getOne(req.session.userId);
      const profile = await pb.collection('user_profiles').getFirstListItem(`user="${req.session.userId}"`);
      
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
      req.session.destroy();
      res.status(401).json({ error: 'Session expired' });
    }
  });
  
  // Password reset request
  router.post('/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      await pb.collection('users').requestPasswordReset(email);
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send password reset email'
      });
    }
  });
  
  return router;
}

module.exports = authRoutes;
```

### 4. Enhancement Preset Routes

```javascript
// routes/presets.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

function presetRoutes(pb) {
  // Apply auth middleware to all preset routes
  router.use(authMiddleware(pb));
  
  // Get all presets for current user
  router.get('/', async (req, res) => {
    try {
      const presets = await pb.collection('enhancement_presets').getFullList({
        filter: `user="${req.user.id}"`,
        sort: '-created',
        expand: 'settings'
      });
      
      res.json({ success: true, presets });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch presets'
      });
    }
  });
  
  // Get preset by ID
  router.get('/:id', async (req, res) => {
    try {
      const preset = await pb.collection('enhancement_presets').getOne(req.params.id, {
        expand: 'settings'
      });
      
      // Check if preset belongs to current user
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json({ success: true, preset });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch preset'
      });
    }
  });
  
  // Create new preset
  router.post('/', async (req, res) => {
    try {
      const { name, isDefault, settings } = req.body;
      
      // If this is being set as default, update other presets
      if (isDefault) {
        try {
          const existingDefault = await pb.collection('enhancement_presets').getFirstListItem(
            `user="${req.user.id}" && is_default=true`
          );
          
          if (existingDefault) {
            await pb.collection('enhancement_presets').update(existingDefault.id, {
              is_default: false
            });
          }
        } catch (error) {
          // No default preset found, continue
        }
      }
      
      // Create the preset
      const preset = await pb.collection('enhancement_presets').create({
        user: req.user.id,
        name,
        is_default: isDefault
      });
      
      // Create settings
      const createdSettings = [];
      for (const setting of settings || []) {
        const newSetting = await pb.collection('enhancement_settings').create({
          preset: preset.id,
          setting_type: setting.type,
          intensity: setting.intensity,
          enabled: setting.enabled
        });
        createdSettings.push(newSetting);
      }
      
      res.status(201).json({
        success: true,
        preset: {
          ...preset,
          settings: createdSettings
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create preset'
      });
    }
  });
  
  // Update preset
  router.put('/:id', async (req, res) => {
    try {
      const { name, isDefault } = req.body;
      
      // Get preset
      const preset = await pb.collection('enhancement_presets').getOne(req.params.id);
      
      // Check if preset belongs to current user
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // If setting as default, update other presets
      if (isDefault && !preset.is_default) {
        try {
          const existingDefault = await pb.collection('enhancement_presets').getFirstListItem(
            `user="${req.user.id}" && is_default=true`
          );
          
          if (existingDefault) {
            await pb.collection('enhancement_presets').update(existingDefault.id, {
              is_default: false
            });
          }
        } catch (error) {
          // No default preset found, continue
        }
      }
      
      // Update preset
      const updatedPreset = await pb.collection('enhancement_presets').update(req.params.id, {
        name: name || preset.name,
        is_default: isDefault !== undefined ? isDefault : preset.is_default
      });
      
      res.json({ success: true, preset: updatedPreset });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update preset'
      });
    }
  });
  
  // Delete preset
  router.delete('/:id', async (req, res) => {
    try {
      // Get preset
      const preset = await pb.collection('enhancement_presets').getOne(req.params.id);
      
      // Check if preset belongs to current user
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get settings for this preset
      const settings = await pb.collection('enhancement_settings').getFullList({
        filter: `preset="${req.params.id}"`
      });
      
      // Delete settings
      for (const setting of settings) {
        await pb.collection('enhancement_settings').delete(setting.id);
      }
      
      // Delete preset
      await pb.collection('enhancement_presets').delete(req.params.id);
      
      res.json({ success: true, message: 'Preset deleted successfully' });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete preset'
      });
    }
  });
  
  return router;
}

module.exports = presetRoutes;
```

### 5. Enhancement Setting Routes

```javascript
// routes/enhancements.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

function enhancementRoutes(pb) {
  // Apply auth middleware to all enhancement routes
  router.use(authMiddleware(pb));
  
  // Get settings for preset
  router.get('/preset/:presetId', async (req, res) => {
    try {
      // First verify preset ownership
      const preset = await pb.collection('enhancement_presets').getOne(req.params.presetId);
      
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get settings
      const settings = await pb.collection('enhancement_settings').getFullList({
        filter: `preset="${req.params.presetId}"`
      });
      
      res.json({ success: true, settings });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch settings'
      });
    }
  });
  
  // Update setting
  router.put('/:id', async (req, res) => {
    try {
      const { intensity, enabled } = req.body;
      
      // Get setting
      const setting = await pb.collection('enhancement_settings').getOne(req.params.id);
      
      // Get preset to verify ownership
      const preset = await pb.collection('enhancement_presets').getOne(setting.preset);
      
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update setting
      const updatedSetting = await pb.collection('enhancement_settings').update(req.params.id, {
        intensity: intensity !== undefined ? intensity : setting.intensity,
        enabled: enabled !== undefined ? enabled : setting.enabled
      });
      
      res.json({ success: true, setting: updatedSetting });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update setting'
      });
    }
  });
  
  // Create setting
  router.post('/', async (req, res) => {
    try {
      const { presetId, settingType, intensity, enabled } = req.body;
      
      // Verify preset ownership
      const preset = await pb.collection('enhancement_presets').getOne(presetId);
      
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Create setting
      const setting = await pb.collection('enhancement_settings').create({
        preset: presetId,
        setting_type: settingType,
        intensity,
        enabled
      });
      
      res.status(201).json({ success: true, setting });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create setting'
      });
    }
  });
  
  // Delete setting
  router.delete('/:id', async (req, res) => {
    try {
      // Get setting
      const setting = await pb.collection('enhancement_settings').getOne(req.params.id);
      
      // Get preset to verify ownership
      const preset = await pb.collection('enhancement_presets').getOne(setting.preset);
      
      if (preset.user !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete setting
      await pb.collection('enhancement_settings').delete(req.params.id);
      
      res.json({ success: true, message: 'Setting deleted successfully' });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete setting'
      });
    }
  });
  
  return router;
}

module.exports = enhancementRoutes;
```

### 6. Front-end Integration

#### 6.1 API Service

```javascript
// services/api.js
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Important for cookies/sessions
});

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
```

#### 6.2 Example Authentication Component

```html
<div x-data="authState">
  <!-- Login Form -->
  <form x-show="view === 'login'" @submit.prevent="login">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Email or Username</span>
      </label>
      <input 
        type="text" 
        x-model="loginForm.identity" 
        class="input input-bordered" 
        required
      />
    </div>
    
    <div class="form-control">
      <label class="label">
        <span class="label-text">Password</span>
      </label>
      <input 
        type="password" 
        x-model="loginForm.password" 
        class="input input-bordered" 
        required
      />
    </div>
    
    <div class="form-control mt-6">
      <button 
        type="submit" 
        class="btn btn-primary" 
        :disabled="isLoading"
      >
        <span x-show="isLoading" class="loading loading-spinner"></span>
        Login
      </button>
    </div>
  </form>
</div>

<script>
  function authState() {
    return {
      view: 'login',
      isLoading: false,
      errorMessage: '',
      
      loginForm: {
        identity: '',
        password: ''
      },
      
      async login() {
        this.isLoading = true;
        this.errorMessage = '';
        
        try {
          // Use the authService from our API module
          const response = await authService.login({
            identity: this.loginForm.identity,
            password: this.loginForm.password
          });
          
          // If successful, redirect or update app state
          if (response.data.success) {
            window.location.href = '/dashboard';
          }
        } catch (error) {
          this.errorMessage = error.response?.data?.error || 'Login failed';
        } finally {
          this.isLoading = false;
        }
      }
    };
  }
</script>
```

## Benefits of Server-Side Implementation

### 1. Enhanced Security

- **API Key Protection**: Pocketbase API keys and authentication tokens never leave the server
- **Session Management**: Secure server-side session management using cookies instead of localStorage
- **Prevention of Client-Side Attacks**: Reduced exposure to XSS and other client-side attacks that could steal tokens

### 2. Better Control

- **Centralized Business Logic**: All API interactions go through the Node.js server, enabling:
  - Consistent validation
  - Rate limiting
  - Logging and monitoring
  - Enhanced error handling

- **Simplified Client Code**: Frontend code only needs to make standard HTTP requests to the Node.js server

### 3. Improved Maintainability

- **Clean Separation**: Clear separation between frontend, API layer, and data layer
- **API Versioning**: Easier to implement API versioning for future updates
- **Unified API Surface**: Consistent API patterns regardless of the underlying data source

## Implementation Steps

1. **Setup Node.js Server**
   - Install dependencies: Express, Pocketbase, express-session
   - Configure middleware and server settings

2. **Implement Authentication Routes**
   - Register, login, logout, and current user endpoints
   - Session management and security measures

3. **Implement Preset and Enhancement Routes**
   - Create CRUD operations for presets and enhancement settings
   - Implement proper ownership validation

4. **Update Frontend Code**
   - Create API service to communicate with Node.js server
   - Update all components to use the new API service

5. **Deploy**
   - Set up environment for both PocketBase and Node.js
   - Configure proper CORS and security settings

## Considerations

- **Scaling**: For large applications, consider Redis or other solutions for session storage
- **Security**: Implement HTTPS, CSRF protection, and proper cookie settings
- **Performance**: Monitor API performance and implement caching where appropriate
- **Logging**: Implement structured logging for troubleshooting and auditing 