# ImaKOL

A lightweight mobile web app for capturing and sharing moments. This application features a clean, modern UI and allows users to capture photos and videos directly from their device.

## Features

- Modern responsive design optimized for mobile devices
- Camera capture functionality
- Multiple image and video upload capability
- Media preview with gallery view
- AI-assisted caption generation
- Native sharing integration
- Simple Node.js backend handling both API requests and serving the frontend

## Quick Start

1. Configure your environment:
   ```bash
   # Copy example configuration
   cp .env.example .env
   
   # Edit .env file if needed (change port)
   ```

2. Start the server:
   ```bash
   npm install
   npm start
   ```

3. Access the application:
   - Open `http://localhost:PORT` in your browser (replace PORT with the value in your .env file)
   - For mobile access on the same network, use your computer's IP address shown in the console

### Alternative Frontend Setup

If you prefer to serve the frontend separately, you can use any HTTP server:

**Using Python:**
```bash
# Replace PORT with any port number of your choice
python -m http.server PORT
```

**Using Node.js:**
```bash
# Install serve once
npm install -g serve

# Replace PORT with any port number of your choice
serve -p PORT
```

### Configuration Notes

- The application can run on any port of your choice (configure in .env)
- By default, the server allows requests from any origin (ALLOWED_ORIGINS=*)
- For better security, configure specific allowed origins in `.env`
- The server will display all available access URLs when started

## Requirements

- Modern browser with JavaScript enabled
- Camera and file system permissions (for capture and upload features)
- Node.js (v14 or higher) for running the server

## License

MIT 