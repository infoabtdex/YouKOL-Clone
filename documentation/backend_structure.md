# Backend Structure

The YouKOL Clone backend is built on Node.js and Express.js, functioning as both a static file server and an API proxy to handle image enhancement requests. This architecture helps avoid CORS issues while providing additional functionality like logging, error handling, and file management.

## Core Files

- **server.js** - Main application entry point and server logic
- **logger.js** - Custom logging configuration using Winston
- **install.js** - Setup script for initial configuration

## Server Architecture

### Express.js Application

The server is built around an Express.js application that:
- Serves static files (HTML, CSS, JS)
- Provides API endpoints for image processing
- Handles file uploads and management
- Proxies requests to external APIs

### Middleware Stack

1. **CORS Middleware**
   - Configurable via environment variables
   - Supports multiple allowed origins
   - Detailed error reporting for rejected origins

2. **Static File Serving**
   - Serves the main application files
   - Provides temporary URL access to uploaded files

3. **Multer File Upload**
   - Handles multipart/form-data uploads
   - Configures file storage and naming
   - Validates file types and sizes

4. **JSON Body Parser**
   - Processes JSON request bodies
   - Supports increased payload size for base64 images

### API Endpoints

1. **`/api/enhance-image`**
   - Accepts image uploads, URLs, or base64 data
   - Processes images through Deep Image API
   - Returns enhanced image data or URLs

2. **Additional Utility Endpoints**
   - Health check endpoint
   - API key verification
   - Version information

## External API Integration

### Deep Image API
- Handles image enhancement tasks
- Manages authentication with API key
- Processes API responses and error handling

### Grok Vision API
- Provides AI-powered image analysis
- Integrates with the enhancement workflow

## PocketBase Integration

The server includes optional integration with PocketBase:
- User authentication and management
- Data persistence
- Configuration stored in environment variables

## File Management

1. **Upload Directory**
   - Configurable path for file storage
   - Automatic directory creation
   - Unique filename generation

2. **File Cleanup**
   - Temporary file removal after processing
   - Scheduled cleanup for orphaned files

## Error Handling and Logging

1. **Centralized Error Handling**
   - Consistent error response format
   - Detailed error logging
   - Client-friendly error messages

2. **Winston Logging System**
   - Multiple log levels (error, warn, info, debug)
   - File and console transports
   - Log rotation and management

## Security Features

1. **Environment-based Configuration**
   - API keys and secrets stored in .env
   - Development/production mode toggling
   - Configurable security parameters

2. **Request Validation**
   - File type and size validation
   - Input sanitization
   - Rate limiting (configurable)

3. **JWT Authentication**
   - Token-based authentication
   - Configurable secret and expiration
   - Role-based access control

## Environment Configuration

The server uses dotenv for environment configuration with the following key variables:
- **API Keys**: `DEEP_IMAGE_API_KEY`, `GROK_API_KEY`
- **Server Config**: `PORT`, `NODE_ENV`
- **Security**: `ALLOWED_ORIGINS`, `JWT_SECRET`
- **PocketBase**: `POCKETBASE_URL`, `POCKETBASE_TIMEOUT`
- **Logging**: `LOG_LEVEL`
