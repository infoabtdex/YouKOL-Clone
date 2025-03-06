# YouKOL-Clone

A lightweight mobile web app for capturing and sharing moments, inspired by popular social media platforms. This application is built as a single HTML file using Alpine.js for interactivity and Daisy UI/Tailwind CSS for styling.

## Features

- Responsive design optimized for mobile devices (iOS and Android)
- Camera capture functionality (where supported by the browser)
- Multiple image and video upload capability
- Media preview with the ability to remove files
- Post creation with share functionality
- All contained in a single HTML file

## Usage

1. Open `index.html` in a mobile browser
2. Use the "Capture" button to take photos with your device camera
3. Use the "Upload" button to select existing images or videos
4. Preview your media and create a post
5. Share your post using your device's native sharing functionality

## Technical Details

- Built with Alpine.js for reactivity and state management
- Styled with Daisy UI (Tailwind CSS)
- All resources loaded via CDN, no build step required
- Uses the Web Share API for native sharing (where supported)
- Camera access via the MediaDevices API

## Requirements

- Modern mobile browser with JavaScript enabled
- Camera and file system permissions (for capture and upload features)

## Installation

No installation required! Simply open the `index.html` file in a mobile browser.

```bash
# To serve locally with a simple HTTP server:
python -m http.server 8000
```

Then navigate to `http://localhost:8000` on your device.

## Limitations

- Camera access requires HTTPS when deployed to a web server (not required for local testing)
- Web Share API may not be supported on all browsers
- Performance may vary based on device capabilities

## License

MIT 