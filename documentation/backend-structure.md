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

5. **Session Management**
   - Express-session for server-side session storage
   - Secure, HTTP-only cookies
   - Configurable session lifetime

### API Endpoints

1. **`/api/enhance-image`**
   - Accepts image uploads, URLs, or base64 data
   - Processes images through Deep Image API
   - Returns enhanced image data or URLs

2. **Authentication Endpoints** (to be implemented)
   - User registration
   - User login
   - Session validation
   - Logout

## External API Integration

### Deep Image API
- Handles image enhancement tasks
- Manages authentication with API key
- Processes API responses and error handling

## PocketBase Integration

The server will include integration with PocketBase:
- User authentication and management through server-side proxy
- Data persistence for user profiles and enhancement presets
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

3. **Authentication**
   - Server-side session management
   - Secure HTTP-only cookies
   - CSRF protection

## Environment Configuration

The server uses dotenv for environment configuration with the following key variables:
- **API Keys**: `DEEP_IMAGE_API_KEY`
- **Server Config**: `PORT`, `NODE_ENV`, `SESSION_SECRET`
- **Security**: `ALLOWED_ORIGINS`
- **PocketBase**: `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
- **Logging**: `LOG_LEVEL` 