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

# ImaKOL Documentation Index

This document serves as the entry point for all documentation regarding the ImaKOL application.

## Documentation Structure

### Project Planning
- [Project Requirements Document (PRD)](./prd.md)
- [Technical Stack](./tech_stack.md)
- [Application Flow](./app_flow.md)

### Architecture
- [Frontend Structure](./frontend_structure.md)
- [Backend Structure](./backend_structure.md)
- [Server-Side Pocketbase Implementation](./pocketbase_server_implementation.md)

### Implementation Guides
- [Server-Side Implementation Structure](./server-side-implementation.md)
- [Server-Side Authentication Flow](./server-side-auth-flow.md)
- [Package.json Example](./package-json-example.md)

### Project Management
- [User Rules](./user_rules.md)
- [Project Rules](./project_rules.md)
- [Changelog](./changelog.md)

## Key Features

1. **Image Enhancement**: Automatic and manual enhancement of images using AI technology
2. **Server-Side Authentication**: Secure user authentication using Express.js and Pocketbase
3. **Enhancement Presets**: Save and manage enhancement settings for future use
4. **Social Sharing**: Share enhanced images on social media platforms

## Implementation Approach

ImaKOL uses a server-side approach for authentication and data management:

```
Client (Browser) <---> Node.js Server <---> Pocketbase
```

This architecture enhances security by:
- Keeping authentication tokens and sensitive operations server-side
- Using session-based authentication with secure cookies
- Preventing direct client access to the database
- Centralizing business logic on the server

## Getting Started

To set up the development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run start:all`

## Contributing

Please refer to [Project Rules](./project_rules.md) for contribution guidelines and coding standards.
