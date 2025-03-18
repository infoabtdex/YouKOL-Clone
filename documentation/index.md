# YouKOL Clone - Project Documentation

## Overview

YouKOL Clone is a standalone web application that provides image enhancement capabilities through a proxy server, built with Express.js and vanilla JavaScript. This application allows users to capture, upload, enhance, and share images with a clean, intuitive interface.

## Documentation Index

### Project Documentation

- [Product Requirements Document](prd.md) - Core requirements and specifications
- [Tech Stack](tech_stack.md) - Technology stack and dependencies
- [Frontend Structure](frontend_structure.md) - Frontend architecture and components
- [Backend Structure](backend_structure.md) - Backend architecture and API endpoints
- [Application Flow](app_flow.md) - User journey and data flow
- [Project Rules](user_rules.md) - Development guidelines and conventions
- [Changelog](changelog.md) - History of changes and versions

### Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run `npm install` to install dependencies
4. Run `npm run dev` for development or `npm start` for production

### Current Project Status

- **Version**: 1.0.0
- **Status**: Active Development
- **Next Milestone**: User Authentication Integration

### Active Files

- `server.js` - Main server implementation
- `index.html` - Main frontend application
- `styles.css` - Custom styling
- `logger.js` - Logging configuration

### Known Issues

- Deep Image API rate limiting on free tier may affect batch processing
- Mobile camera capture has compatibility issues on some browsers
- Large files (>10MB) may experience timeout issues

### External Resources

- [Deep Image API Documentation](https://deep-image.ai/docs)
- [PocketBase Documentation](https://pocketbase.io/docs)
- [Alpine.js Documentation](https://alpinejs.dev/start-here)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Project Roadmap

### Short-term Goals

- Complete user authentication integration
- Add additional enhancement styles
- Implement shareable links for enhanced images

### Mid-term Goals

- Create mobile app wrapper with Capacitor
- Add collaborative editing features
- Implement advanced enhancement customization

### Long-term Goals

- Create premium subscription model
- Develop plugin system for third-party enhancements
- Add AI-powered automatic enhancement suggestions
