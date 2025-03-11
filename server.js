const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

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

// Parse JSON body
app.use(express.json());

// Serve static files from the current directory (for development)
app.use(express.static(__dirname));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'API proxy server is running!' 
  });
});

// Placeholder endpoint for image enhancement (will implement API integration later)
app.post('/api/enhance-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No image file uploaded' 
      });
    }

    // For now, just return a success message with the file information
    // This is where you would integrate with your image enhancement API
    res.json({
      status: 'success',
      message: 'Image received successfully',
      fileInfo: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Error in enhance-image endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error processing the image',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test`);
}); 