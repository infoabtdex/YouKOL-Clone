const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const jwt = require('jsonwebtoken');

// Fix PocketBase import - use dynamic import
let pb; // Declare pb variable in the global scope

// Load environment variables
dotenv.config();

// Environment variables
const PORT = process.env.PORT || 3000;
const DEEP_IMAGE_API_KEY = process.env.DEEP_IMAGE_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PocketBase asynchronously
async function initPocketBase() {
  try {
    // Dynamic import for ES modules
    const PocketBase = (await import('pocketbase')).default;
    pb = new PocketBase('http://127.0.0.1:8090');
    console.log('PocketBase initialized successfully');
    return pb;
  } catch (error) {
    console.error('Error initializing PocketBase:', error);
    throw error;
  }
}

// Log API key status (truncated for security)
logger.info('🔑 API Key Configuration:');
logger.info(`Deep Image API Key: ${DEEP_IMAGE_API_KEY ? DEEP_IMAGE_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);
logger.info(`Grok API Key: ${GROK_API_KEY ? GROK_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);

// Setup CORS for cross-origin requests
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*']; // Default to allow all origins if not specified

logger.info('📋 CORS Configuration:');
if (allowedOrigins.includes('*')) {
  logger.warn('⚠️ All origins allowed - this is not recommended for production');
  logger.info('\nTo configure allowed origins, update the ALLOWED_ORIGINS variable in your .env file');
} else {
  logger.info('✅ CORS configured to allow only the following origins:');
  allowedOrigins.forEach(origin => logger.info(`  - ${origin}`));
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins if '*' is in the list
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS Error: This server does not allow access from origin ${origin}. Update ALLOWED_ORIGINS in .env file.`;
      logger.error(`❌ ${msg}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Serve uploaded files temporarily for the Deep Image API
app.use('/temp-uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Serve static files from the current directory (for development)
app.use(express.static(__dirname));

// Serve index.html at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Ensure PocketBase is initialized
    if (!pb) {
      await initPocketBase();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required', errorCode: 'AUTH_REQUIRED' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format', errorCode: 'INVALID_TOKEN_FORMAT' });
    }

    // Clear any previous authentication state
    pb.authStore.clear();
    
    try {
      // Store the token in the client instance
      pb.authStore.save(token);
      
      // If the token is invalid or expired, this will throw an error
      if (!pb.authStore.isValid) {
        throw new Error('Invalid token');
      }
      
      // Validate user ID exists in the token model
      if (!pb.authStore.model || !pb.authStore.model.id) {
        throw new Error('Invalid user identity in token');
      }
      
      // Set the user on the request object
      req.user = pb.authStore.model;
      next();
    } catch (error) {
      pb.authStore.clear();
      console.error('Token validation error:', error);
      
      // Determine specific error type for better client handling
      let errorCode = 'INVALID_TOKEN';
      let statusCode = 401;
      let message = 'Invalid or expired token';
      
      if (error.status === 403) {
        errorCode = 'FORBIDDEN';
        statusCode = 403;
        message = 'You do not have permission to access this resource';
      }
      
      return res.status(statusCode).json({ 
        message: message, 
        errorCode: errorCode
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error', errorCode: 'SERVER_ERROR' });
  }
};

// API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    // Ensure PocketBase is initialized
    if (!pb) {
      await initPocketBase();
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const authData = await pb.collection('users').authWithPassword(email, password);
    
    return res.status(200).json({
      user: authData.record,
      token: pb.authStore.token
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.status === 400) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    // Clear the auth store
    if (pb) {
      pb.authStore.clear();
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', authMiddleware, async (req, res) => {
  try {
    // The authMiddleware has already validated the token
    // If we got here, the token is still valid, so we can just generate a new one
    
    const userId = req.user.id;
    
    // Get the current user data from PocketBase to ensure it's up to date
    const user = await pb.collection('users').getOne(userId);
    
    // Create a new token with the same user information but extended expiration
    const token = jwt.sign({ 
      id: user.id,
      email: user.email,
      isNew: user.isNew || false
    }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '7d' }); // Extend token expiration to 7 days
    
    // Return the new token
    return res.status(200).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        isNew: user.isNew || false
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ message: 'Token refresh failed', error: error.message });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    // Ensure PocketBase is initialized
    if (!pb) {
      await initPocketBase();
    }
    
    const { email, password, passwordConfirm } = req.body;
    
    // Validate required fields
    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({ 
        message: 'Email, password and password confirmation are required' 
      });
    }
    
    // Validate password confirmation
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    // Create the user with PocketBase
    const data = {
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      isNew: true // Flag to track new users for onboarding
    };
    
    const record = await pb.collection('users').create(data);
    
    // Authenticate the user automatically after signup
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    return res.status(201).json({
      user: authData.record,
      token: pb.authStore.token,
      isNew: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate email
    if (error.status === 400 && error.response?.data?.email?.code === 'validation_invalid_email_unique') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    return res.status(500).json({ 
      message: 'Error creating user', 
      error: error.response?.data || error.message 
    });
  }
});

// Save preferences endpoint (protected)
app.post('/api/preferences', authMiddleware, async (req, res) => {
  try {
    const { preferences, skipped } = req.body;
    const userId = req.user.id;
    
    // Log the received data
    console.log(`Saving preferences for user ${userId}:`, { preferences, skipped });

    // Prepare the preferences object based on the skipped flag
    const preferencesData = skipped 
      ? { skipped: true, skippedAt: new Date().toISOString() } 
      : preferences;

    // Check if the user already has preferences stored
    const existingPrefs = await pb.collection('preferences').getList(1, 1, {
      filter: `userId = "${userId}"`
    });

    // If preferences already exist, update them
    if (existingPrefs.items.length > 0) {
      const updatedPref = await pb.collection('preferences').update(existingPrefs.items[0].id, {
        preferences: preferencesData
      });
      return res.status(200).json(updatedPref);
    } 
    // Otherwise create new preferences
    else {
      const newPref = await pb.collection('preferences').create({
        userId: userId,
        preferences: preferencesData
      });
      return res.status(201).json(newPref);
    }
  } catch (error) {
    console.error('Save preferences error:', error);
    return res.status(500).json({ message: 'Failed to save preferences', error: error.message });
  }
});

// Get preferences endpoint (protected)
app.get('/api/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userPrefs = await pb.collection('preferences').getList(1, 1, {
      filter: `userId = "${userId}"`
    });

    if (userPrefs.items.length === 0) {
      return res.status(404).json({ message: 'No preferences found for this user' });
    }

    return res.status(200).json(userPrefs.items[0]);
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ message: 'Failed to retrieve preferences', error: error.message });
  }
});

// Enhanced endpoint for image enhancement that proxies to Deep Image API
app.post('/api/enhance-image', async (req, res) => {
  try {
    // Check if we have base64 image data
    if (req.body && req.body.image_base64) {
      logger.info('Received base64 image data');
      
      // Create a temporary file from the base64 data
      const imageData = req.body.image_base64;
      // Remove data URL prefix if it exists
      const base64Data = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
      
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Create a temporary file
      const tempFilePath = path.join(uploadDir, `temp-${Date.now()}.jpg`);
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
      logger.info(`Created temporary file from base64 data: ${tempFilePath}`);
      
      // Set the file path for the API call
      req.tempFilePath = tempFilePath;
      await handleDeepImageAPICall(req, res);
    } 
    // Check if we have imageUrl in the request body
    else if (req.body && req.body.imageUrl) {
      logger.info('Received image URL via JSON');
      await handleDeepImageAPICall(req, res);
    } else {
      // For form uploads, use multer
      upload.single('image')(req, res, async function(err) {
        if (err) {
          logger.error('Error in file upload:', err);
          return res.status(400).json({ 
            status: 'error', 
            message: err.message 
          });
        }
        
        if (!req.file) {
          logger.error('No file uploaded, no image_base64, and no imageUrl in request body');
          return res.status(400).json({ 
            status: 'error', 
            message: 'Please provide either imageUrl, image_base64, or upload a file' 
          });
        }
        
        logger.info('File uploaded successfully:', req.file.path);
        
        // Set the file path for the API call
        req.tempFilePath = req.file.path;
        await handleDeepImageAPICall(req, res);
      });
    }
  } catch (error) {
    logger.error('Error in enhance-image endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error processing the image',
      error: error.message
    });
  }
});

// Function to handle the actual API call to Deep Image
async function handleDeepImageAPICall(req, res) {
  try {
    logger.info('Starting enhancement workflow with Deep Image API...');
    const apiKey = DEEP_IMAGE_API_KEY;
    const apiEndpoint = 'https://api.deep-image.ai/rest_api/process_result';
    
    // Step 1: Get or generate an image URL (this is the simplified workflow)
    let imageUrl;
    let tempFilePath;
    
    // If we already have an image URL in the request, use it directly
    if (req.body && req.body.imageUrl) {
      logger.info('Using provided image URL:', req.body.imageUrl);
      imageUrl = req.body.imageUrl;
    }
    // If we have a local file (either uploaded or created from base64), we need to convert it to a URL
    else if (req.tempFilePath) {
      logger.info('Converting local file to base64 for Deep Image API:', req.tempFilePath);
      tempFilePath = req.tempFilePath;
      
      // Read the file and convert to base64
      const fileBuffer = fs.readFileSync(req.tempFilePath);
      const base64Data = fileBuffer.toString('base64');
      
      // Create a base64 URL in the format expected by Deep Image API
      // Note: They expect "base64," prefix rather than full data URL format
      imageUrl = `base64,${base64Data}`;
      
      logger.info('Created base64 string for Deep Image API');
    } else {
      throw new Error('No valid image source provided (no URL or file)');
    }
    
    // Step 2: Prepare the JSON payload for the API call (following the documentation example)
    const jsonPayload = {
      url: imageUrl,
      max_length: 4096,
      enhancements: [
        "face_enhance"
      ],
      face_enhance_parameters: {
        type: "beautify-real",
        level: 0.8,
        smoothing_level: 0.1
      },
      output_format: 'jpg'
    };
    
    // Step 3: Make the API call using JSON (the documented approach)
    logger.info('Sending image data to Deep Image API via JSON payload');
    const response = await axios.post(apiEndpoint, jsonPayload, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Step 4: Process the API response
    logger.info('Received response from Deep Image API with status:', response.status);
    logger.info('Response details:', JSON.stringify(response.data, null, 2));
    
    // Handle the response
    if (response.data.result_url) {
      logger.info('Found image URL in result_url, fetching:', response.data.result_url);
      const imageResponse = await axios.get(response.data.result_url, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64
      const enhancedImageData = Buffer.from(imageResponse.data, 'binary').toString('base64');
      logger.info('Successfully fetched and converted enhanced image');
      
      // Return the enhanced image data
      res.json({
        status: 'success',
        result: {
          image_base64: enhancedImageData,
          response_data: response.data
        }
      });
    } else {
      logger.error('No result_url in API response:', response.data);
      throw new Error('No enhanced image URL in API response');
    }
    
    // Clean up temporary file after use
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        logger.info('Temporary file deleted:', tempFilePath);
      } catch (unlinkError) {
        logger.error('Error deleting temporary file:', unlinkError);
      }
    }
  } catch (error) {
    logger.error('Error calling Deep Image API:', error);
    
    // Log detailed error information
    if (error.response) {
      logger.error('Response status:', error.response.status);
      logger.error('Response headers:', error.response.headers);
      logger.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Send detailed error response
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: 'Failed to enhance image',
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
}

// Add Grok Vision API endpoint for caption generation
app.post('/api/generate-caption', async (req, res) => {
  try {
    // Check if Grok API key exists
    if (!GROK_API_KEY) {
      return res.status(500).json({
        status: 'error',
        message: 'Grok API key not configured. Please set GROK_API_KEY in your .env file.'
      });
    }
    
    // Check for media data in request
    if (!req.body.mediaItems || !Array.isArray(req.body.mediaItems) || req.body.mediaItems.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request must include mediaItems array with at least one image'
      });
    }
    
    // Create message content with text prompt and images
    const messageContent = [
      {
        type: "text",
        text: req.body.prompt || "Generate a creative, engaging, and social media friendly caption for this post. The caption should be short but catchy, suitable for social media, and should capture the essence of all the image(s)/video(s) into one caption."
      }
    ];
    
    // Add all images to message content
    req.body.mediaItems.forEach(media => {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${media.type || 'image/jpeg'};base64,${media.data}`,
          detail: "high"
        }
      });
    });
    
    // Create request for Grok Vision API
    const requestData = {
      model: "grok-2-vision-latest",
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ]
    };
    
    logger.info('Sending request to Grok Vision API...');
    
    // Call Grok API with X.AI endpoint
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      ...requestData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      }
    });
    
    // Check for valid response
    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      logger.error('Invalid response format from Grok API:', response.data);
      return res.status(500).json({
        status: 'error',
        message: 'Invalid response format from Grok API'
      });
    }
    
    logger.info('Caption generated successfully');
    
    // Return the generated caption
    res.json({
      status: 'success',
      result: {
        caption: response.data.choices[0].message.content.trim()
      }
    });
    
  } catch (error) {
    logger.error('Error in generate-caption endpoint:', error);
    
    let statusCode = 500;
    let errorMessage = 'Server error generating caption';
    
    // Handle different error types
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `Grok API error: ${error.response.status} ${error.response.statusText}`;
      logger.error('Grok API response:', error.response.data);
    }
    
    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Test endpoint for the Deep Image API integration
app.get('/api/test-deep-image', (req, res) => {
  res.json({
    status: 'success',
    message: 'Deep Image API proxy endpoint is ready',
    instructions: 'POST to /api/enhance-image with image_base64 in the request body or a file upload with name "image"'
  });
});

// Test endpoint for the Grok API integration
app.get('/api/test-grok', (req, res) => {
  // Check if API key is configured
  if (!GROK_API_KEY) {
    return res.status(200).json({
      status: 'warning',
      message: 'Grok API endpoint is configured but API key is missing',
      instructions: 'Add GROK_API_KEY to your .env file'
    });
  }
  
  res.json({
    status: 'success',
    message: 'Grok Vision API proxy endpoint is ready',
    instructions: 'POST to /api/generate-caption with mediaItems array containing image data'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.message === 'Only image and video files are allowed!') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server',
    error: err.message
  });
});

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give the logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // We don't exit the process here as it's less severe
});

// Start the server
async function startServer() {
  try {
    // Initialize PocketBase before starting the server
    await initPocketBase();
    
    // Start the server
    app.listen(PORT, () => {
      const interfaces = require('os').networkInterfaces();
      const addresses = [];
      
      // Get all IP addresses
      Object.keys(interfaces).forEach(interfaceName => {
        interfaces[interfaceName].forEach(interfaceData => {
          // Skip internal and non-IPv4 addresses
          if (interfaceData.internal === false && interfaceData.family === 'IPv4') {
            addresses.push(interfaceData.address);
          }
        });
      });
      
      logger.info(`\n🚀 Server running on port ${PORT}`);
      
      logger.info(`\n🌐 Access your application at:`);
      logger.info(`  http://localhost:${PORT}`);
      
      if (addresses.length > 0) {
        logger.info(`\n📱 Network access (same WiFi/LAN):`);
        addresses.forEach(address => {
          logger.info(`  http://${address}:${PORT}`);
        });
      }
      
      logger.info(`\n⚙️ Configuration tips:`);
      logger.info(`  - CORS is ${allowedOrigins.includes('*') ? 'allowing all origins' : 'restricted to specific origins'}`);
      logger.info(`  - Deep Image API ${DEEP_IMAGE_API_KEY ? 'key is configured' : 'key is MISSING'}`);
      logger.info(`  - Grok Vision API ${GROK_API_KEY ? 'key is configured' : 'key is MISSING'}`);
      logger.info(`  - The server can be configured in the .env file`);
      logger.info(`  - PocketBase connected to: http://127.0.0.1:8090`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 