const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('./server/utils/logger');
const sessionConfig = require('./server/config/session');

// Import routes
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const presetRoutes = require('./server/routes/presets');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get API keys
const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

// Check if API keys are configured
if (!API_KEY) {
  logger.warn('API_KEY is not set in environment variables');
} else {
  logger.info('API_KEY is configured');
}

if (!API_URL) {
  logger.warn('API_URL is not set in environment variables');
} else {
  logger.info(`API_URL is configured: ${API_URL}`);
}

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
  logger.info(`Created uploads directory at ${uploadDir}`);
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

// Parse JSON request bodies (increased size limit for base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Parse cookies
app.use(cookieParser());

// Use session middleware
app.use(session(sessionConfig));

// Serve static files from public directory (for frontend)
app.use(express.static('public'));
app.use(express.static('.'));

// Initialize PocketBase routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/presets', presetRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check request received');
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Handle image enhancement requests
app.post('/api/enhance', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      logger.warn('Image upload failed: No file uploaded');
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const enhancementParams = req.body.params ? JSON.parse(req.body.params) : {};
    logger.info(`Processing enhancement request`, { 
      filename: req.file.filename, 
      originalname: req.file.originalname,
      filesize: req.file.size,
      parameters: enhancementParams 
    });

    const imagePath = req.file.path;
    const formData = new FormData();
    
    // Read the file and add to form data
    const image = fs.readFileSync(imagePath);
    formData.append('image', new Blob([image]), req.file.originalname);
    
    // Add enhancement parameters if provided
    if (Object.keys(enhancementParams).length > 0) {
      formData.append('params', JSON.stringify(enhancementParams));
    }

    // Send request to enhancement API
    const response = await axios.post(API_URL, formData, {
      headers: {
        'X-API-KEY': API_KEY,
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer'
    });

    // Clean up uploaded file
    fs.unlinkSync(imagePath);
    logger.info(`Enhancement completed successfully`, { 
      filename: req.file.filename, 
      responseSize: response.data.length 
    });

    // Send enhanced image back to client
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    logger.error('Enhancement error', { 
      error: error.message, 
      filename: req.file ? req.file.filename : 'unknown'
    });

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting temporary file', { 
          error: unlinkError.message, 
          path: req.file.path 
        });
      }
    }

    // If API returned an error response
    if (error.response) {
      const errorMessage = error.response.data.toString();
      logger.error('API error response', { 
        status: error.response.status, 
        message: errorMessage 
      });
      return res.status(error.response.status).json({ 
        success: false, 
        message: 'Error enhancing image', 
        details: errorMessage 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error enhancing image', 
      details: error.message 
    });
  }
});

// Handle batch image enhancement
app.post('/api/enhance/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      logger.warn('Batch enhancement failed: No files uploaded');
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const enhancementParams = req.body.params ? JSON.parse(req.body.params) : {};
    logger.info(`Processing batch enhancement request`, { 
      fileCount: req.files.length,
      parameters: enhancementParams 
    });

    const results = [];
    const errors = [];

    // Process each image
    for (const file of req.files) {
      try {
        const imagePath = file.path;
        const formData = new FormData();
        
        // Read file and add to form data
        const image = fs.readFileSync(imagePath);
        formData.append('image', new Blob([image]), file.originalname);
        
        // Add enhancement parameters if provided
        if (Object.keys(enhancementParams).length > 0) {
          formData.append('params', JSON.stringify(enhancementParams));
        }

        // Send request to enhancement API
        const response = await axios.post(API_URL, formData, {
          headers: {
            'X-API-KEY': API_KEY,
            ...formData.getHeaders()
          },
          responseType: 'arraybuffer'
        });

        // Convert enhanced image to base64
        const base64Image = Buffer.from(response.data).toString('base64');
        
        results.push({
          originalName: file.originalname,
          enhanced: `data:${response.headers['content-type']};base64,${base64Image}`
        });

        logger.info(`Enhanced image in batch`, { 
          filename: file.filename, 
          originalname: file.originalname 
        });
      } catch (error) {
        logger.error('Error enhancing image in batch', { 
          error: error.message, 
          filename: file.filename 
        });
        
        errors.push({
          originalName: file.originalname,
          error: error.message
        });
      } finally {
        // Clean up uploaded file
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            logger.error('Error deleting temporary file', { 
              error: unlinkError.message, 
              path: file.path 
            });
          }
        }
      }
    }

    // Return results to client
    res.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : null,
      message: `Batch processing complete. ${results.length} successful, ${errors.length} failed.`
    });
  } catch (error) {
    logger.error('Batch enhancement error', { error: error.message });
    
    // Clean up all uploaded files
    if (req.files) {
      for (const file of req.files) {
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            logger.error('Error deleting temporary file', { 
              error: unlinkError.message, 
              path: file.path 
            });
          }
        }
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error processing batch enhancement', 
      details: error.message 
    });
  }
});

// Catchall route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
  }
  
  res.status(500).json({ 
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`🔍 Health check available at http://localhost:${PORT}/api/health`);
  logger.info(`🎨 Image enhancement API at http://localhost:${PORT}/api/enhance`);
  logger.info(`👥 Authentication API at http://localhost:${PORT}/api/auth`);
  logger.info(`🎨 Presets API at http://localhost:${PORT}/api/presets`);
}); 