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

// API Keys - Securely loaded from environment variables
const DEEP_IMAGE_API_KEY = process.env.DEEP_IMAGE_API_KEY || '1ae78530-b772-11ef-af6d-2989c59e815d';
const GROK_API_KEY = process.env.GROK_API_KEY;

// Log API key status (truncated for security)
console.log('\n🔑 API Key Configuration:');
console.log(`Deep Image API Key: ${DEEP_IMAGE_API_KEY ? DEEP_IMAGE_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);
console.log(`Grok API Key: ${GROK_API_KEY ? GROK_API_KEY.substring(0, 8) + '...' : 'NOT SET ⚠️'}`);

// Setup CORS for cross-origin requests
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*']; // Default to allow all origins if not specified

console.log('\n📋 CORS Configuration:');
if (allowedOrigins.includes('*')) {
  console.log('⚠️ All origins allowed - this is not recommended for production');
  console.log('\nTo configure allowed origins, update the ALLOWED_ORIGINS variable in your .env file');
} else {
  console.log('✅ CORS configured to allow only the following origins:');
  allowedOrigins.forEach(origin => console.log(`  - ${origin}`));
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
      console.error(`❌ ${msg}`);
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

// Parse JSON body
app.use(express.json({ limit: '10mb' }));  // Increased limit for base64 images

// Serve static files from the current directory (for development)
app.use(express.static(__dirname));

// Serve index.html at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Enhanced endpoint for image enhancement that proxies to Deep Image API
app.post('/api/enhance-image', async (req, res) => {
  try {
    // Check if we have base64 image data
    if (req.body && req.body.image_base64) {
      console.log('Received base64 image data');
      
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
      console.log(`Created temporary file from base64 data: ${tempFilePath}`);
      
      // Set the file path for the API call
      req.tempFilePath = tempFilePath;
      await handleDeepImageAPICall(req, res);
    } 
    // Check if we have imageUrl in the request body
    else if (req.body && req.body.imageUrl) {
      console.log('Received image URL via JSON');
      await handleDeepImageAPICall(req, res);
    } else {
      // For form uploads, use multer
      upload.single('image')(req, res, async function(err) {
        if (err) {
          console.error('Error in file upload:', err);
          return res.status(400).json({ 
            status: 'error', 
            message: err.message 
          });
        }
        
        if (!req.file) {
          console.error('No file uploaded, no image_base64, and no imageUrl in request body');
          return res.status(400).json({ 
            status: 'error', 
            message: 'Please provide either imageUrl, image_base64, or upload a file' 
          });
        }
        
        console.log('File uploaded successfully:', req.file.path);
        
        // Set the file path for the API call
        req.tempFilePath = req.file.path;
        await handleDeepImageAPICall(req, res);
      });
    }
  } catch (error) {
    console.error('Error in enhance-image endpoint:', error);
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
    console.log('Starting enhancement workflow with Deep Image API...');
    const apiKey = DEEP_IMAGE_API_KEY;
    const apiEndpoint = 'https://deep-image.ai/rest_api/process_result';
    
    // Step 1: Get or generate an image URL (this is the simplified workflow)
    let imageUrl;
    let tempFilePath;
    
    // If we already have an image URL in the request, use it directly
    if (req.body && req.body.imageUrl) {
      console.log('Using provided image URL:', req.body.imageUrl);
      imageUrl = req.body.imageUrl;
    }
    // If we have a local file (either uploaded or created from base64), we need to convert it to a URL
    else if (req.tempFilePath) {
      console.log('Creating a proper URL for the local file:', req.tempFilePath);
      tempFilePath = req.tempFilePath;
      
      // Generate a proper URL for the temporary file using the /temp-uploads route
      const fileName = path.basename(req.tempFilePath);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/temp-uploads/${fileName}`;
      
      console.log('Created proper URL for local file:', imageUrl);
    } else {
      throw new Error('No valid image source provided (no URL or file)');
    }
    
    // Step 2: Prepare the JSON payload for the API call (following the documentation example)
    const jsonPayload = {
      url: imageUrl,
      max_length: 4096,
      enhancements: [
        'denoise',
        'face_enhance', 
        'deblur',
        'color',
        'light',
        'white_balance',
        'exposure_correction'
      ],
      light_parameters: {
        type: 'hdr_light_advanced',
        level: 1
      },
      color_parameters: {
        type: 'contrast',
        level: 0.5
      },
      white_balance_parameters: {
        level: 0.25
      },
      deblur_parameters: {
        type: 'v2'
      },
      denoise_parameters: {
        type: 'v2'
      },
      output_format: 'jpg'
    };
    
    // Step 3: Make the API call using JSON (the documented approach)
    console.log('Sending image URL to Deep Image API via JSON payload');
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
    console.log('Received response from Deep Image API with status:', response.status);
    console.log('Response details:', JSON.stringify(response.data, null, 2));
    
    // Handle the response
    if (response.data.result_url) {
      console.log('Found image URL in result_url, fetching:', response.data.result_url);
      const imageResponse = await axios.get(response.data.result_url, {
        responseType: 'arraybuffer'
      });
      
      // Convert to base64
      const enhancedImageData = Buffer.from(imageResponse.data, 'binary').toString('base64');
      console.log('Successfully fetched and converted enhanced image');
      
      // Return the enhanced image data
      res.json({
        status: 'success',
        result: {
          image_base64: enhancedImageData,
          response_data: response.data
        }
      });
    } else {
      console.error('No result_url in API response:', response.data);
      throw new Error('No enhanced image URL in API response');
    }
    
    // Clean up temporary file after use
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file deleted:', tempFilePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Error calling Deep Image API:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
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
    
    console.log('Sending request to Grok Vision API...');
    
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
      console.error('Invalid response format from Grok API:', response.data);
      return res.status(500).json({
        status: 'error',
        message: 'Invalid response format from Grok API'
      });
    }
    
    console.log('Caption generated successfully');
    
    // Return the generated caption
    res.json({
      status: 'success',
      result: {
        caption: response.data.choices[0].message.content.trim()
      }
    });
    
  } catch (error) {
    console.error('Error in generate-caption endpoint:', error);
    
    let statusCode = 500;
    let errorMessage = 'Server error generating caption';
    
    // Handle different error types
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `Grok API error: ${error.response.status} ${error.response.statusText}`;
      console.error('Grok API response:', error.response.data);
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
  
  console.log(`\n🚀 Server running on port ${PORT}`);
  
  console.log(`\n🌐 Access your application at:`);
  console.log(`  http://localhost:${PORT}`);
  
  if (addresses.length > 0) {
    console.log(`\n📱 Network access (same WiFi/LAN):`);
    addresses.forEach(address => {
      console.log(`  http://${address}:${PORT}`);
    });
  }
  
  console.log(`\n⚙️ Configuration tips:`);
  console.log(`  - CORS is ${allowedOrigins.includes('*') ? 'allowing all origins' : 'restricted to specific origins'}`);
  console.log(`  - Deep Image API ${DEEP_IMAGE_API_KEY ? 'key is configured' : 'key is MISSING'}`);
  console.log(`  - Grok Vision API ${GROK_API_KEY ? 'key is configured' : 'key is MISSING'}`);
  console.log(`  - The server can be configured in the .env file`);
}); 