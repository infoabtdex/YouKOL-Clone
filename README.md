# YouKOL-Clone

A lightweight mobile web app for capturing and sharing moments, inspired by popular social media platforms. This application is built as a single HTML file using Alpine.js for interactivity and Daisy UI/Tailwind CSS for styling.

## Features

- Responsive design optimized for mobile devices (iOS and Android)
- Camera capture functionality (where supported by the browser)
- Multiple image and video upload capability
- Media preview with the ability to remove files
- Post creation with share functionality
- Node.js proxy server for API requests (avoids CORS issues)
- All frontend contained in a single HTML file

## Usage

1. Start the Node.js server (see [Node.js Server Setup](#nodejs-server-setup))
2. Open `index.html` in a mobile browser
3. Use the "Capture" button to take photos with your device camera
4. Use the "Upload" button to select existing images or videos
5. Preview your media and create a post
6. Share your post using your device's native sharing functionality

## Technical Details

- Built with Alpine.js for reactivity and state management
- Styled with Daisy UI (Tailwind CSS)
- All frontend resources loaded via CDN, no build step required
- Uses the Web Share API for native sharing (where supported)
- Camera access via the MediaDevices API
- Node.js/Express backend for API proxy

## Requirements

- Modern mobile browser with JavaScript enabled
- Camera and file system permissions (for capture and upload features)
- Node.js (v14 or higher) for running the server

## Node.js Server Setup

To set up the Node.js proxy server:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy or rename `.env` file
   - Update any API keys or configuration in the `.env` file

3. Start the server:
   ```bash
   # For production
   npm start
   
   # For development (with automatic restart on file changes)
   npm run dev
   ```

4. The server will run on port 3000 by default. You can change this in the `.env` file.

5. Test the server by visiting:
   ```
   http://localhost:3000/api/test
   ```

## Frontend Installation

To serve the frontend locally:

```bash
# Using Python's simple HTTP server
python -m http.server 5500
```

Then navigate to `http://localhost:5500` on your device.

## API Integration

The Node.js server includes a placeholder endpoint for image enhancement:

- `POST /api/enhance-image` - Accepts image file uploads

Refer to `server.js` for implementation details and to add your own API integration.

## Limitations

- Camera access requires HTTPS when deployed to a web server (not required for local testing)
- Web Share API may not be supported on all browsers
- Performance may vary based on device capabilities
- Server must be running for API features to work

## License

MIT 