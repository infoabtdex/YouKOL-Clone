# Sample package.json for Server-side Implementation

This file provides a starter `package.json` configuration for the Node.js server-side implementation that communicates with Pocketbase.

```json
{
  "name": "imakol-server",
  "version": "1.0.0",
  "description": "Server-side implementation for ImaKOL using Node.js and Pocketbase",
  "main": "server/server.js",
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "pb:start": "cd pocketbase && ./pocketbase serve",
    "start:all": "concurrently \"npm run dev\" \"npm run pb:start\"",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "helmet": "^7.1.0",
    "multer": "^1.4.5-lts.1",
    "pocketbase": "^0.18.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "author": "ImaKOL Team",
  "license": "MIT"
}
```

## Installation

After creating the `package.json` file, install the dependencies:

```bash
npm install
```

## Setting up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret-key-here

# PocketBase configuration
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=secure-admin-password

# Client configuration
CLIENT_URL=http://localhost:8080
```

## Running the Application

To start the Node.js server:

```bash
npm run dev
```

To start PocketBase (after downloading the executable):

```bash
npm run pb:start
```

To run both concurrently:

```bash
npm run start:all
```

## Dependencies Explained

- **express**: Web framework for creating the API server
- **express-session**: Session management middleware
- **pocketbase**: Official PocketBase SDK
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Load environment variables from .env file
- **axios**: HTTP client for making API requests
- **helmet**: Security middleware for Express
- **multer**: Middleware for handling file uploads
- **winston**: Logging library

## Dev Dependencies

- **nodemon**: Auto-reload server on code changes
- **concurrently**: Run multiple commands concurrently
- **jest & supertest**: Testing frameworks 