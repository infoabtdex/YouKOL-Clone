# YouKOL Clone - Project Documentation

## Overview

YouKOL Clone is a standalone web application that provides image enhancement capabilities through a proxy server, built with Express.js and Alpine.js. This application allows users to capture, upload, enhance, and share images with a clean, intuitive interface.

## Documentation Index

### Project Planning
- [Product Requirements Document (PRD)](./prd.md) - Core requirements and specifications
- [Technical Stack](./tech-stack.md) - Technology stack and dependencies
- [Application Flow](./app-flow.md) - User journey and data flow

### Architecture
- [Frontend Structure](./frontend-structure.md) - Frontend architecture and components
- [Backend Structure](./backend-structure.md) - Backend architecture and API endpoints
- [Server-Side Implementation](./server-side-implementation.md) - Implementation details for the server

### Authentication
- [Comprehensive PocketBase Authentication Guide](./pocketbase-authentication-guide.md) - Complete guide for authentication implementation, frontend integration, and user onboarding

### Project Management
- [Project Rules](./project-rules.md) - Development guidelines and conventions
- [User Rules](./user-rules.md) - Global user rules
- [Changelog](./changelog.md) - History of changes and versions
- [Package.json Example](./package-json-example.md) - Sample configuration

### Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run `npm install` to install dependencies
4. Run `npm run dev` for development

### Current Project Status

- **Version**: 1.0.0
- **Status**: Active Development
- **Next Milestone**: User Authentication Integration

### External Resources

- [Deep Image API Documentation](https://deep-image.ai/docs)
- [PocketBase Documentation](https://pocketbase.io/docs)
- [Alpine.js Documentation](https://alpinejs.dev/start-here)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Key Features

1. **Image Enhancement**: Automatic and manual enhancement of images using AI technology
2. **Media Capture & Upload**: Capture from camera or upload from device
3. **Enhancement Presets**: Save and manage enhancement settings
4. **Before/After Comparison**: Compare original and enhanced images
5. **Batch Processing**: Enhance multiple images at once

## Implementation Approach

YouKOL Clone uses a server-side approach for authentication and data management:

```
Client (Browser) <---> Node.js Server <---> PocketBase
```

This architecture enhances security by:
- Keeping authentication tokens and sensitive operations server-side
- Using session-based authentication with secure cookies
- Preventing direct client access to the database
- Centralizing business logic on the server
