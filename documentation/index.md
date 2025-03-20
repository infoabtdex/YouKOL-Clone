# YouKOL Clone Documentation Index

This document serves as the main entry point for all documentation related to the YouKOL Clone project.

## Project Overview

YouKOL Clone is a standalone web application that provides image enhancement capabilities through a user-friendly interface. It leverages external AI-powered image processing APIs while providing a smooth, responsive user experience.

## Core Documentation

- [Product Requirements Document](prd.md) - Core features and requirements
- [Technical Stack](tech-stack.md) - Technologies used in the project
- [Frontend Structure](frontend-structure.md) - Frontend architecture
- [Backend Structure](backend-structure.md) - Backend architecture
- [App Flow](app-flow.md) - User flow and application structure

## Authentication Implementation 

- [PocketBase Authentication Guide](pocketbase-auth-implementation-guide.md) - Comprehensive guide for server-side PocketBase authentication

## Technical Implementation Details

- [Server-Side Implementation](server-side-implementation.md) - Detailed server implementation
- [PocketBase Authentication Steps](../temp/intermediate/pocketbase_auth_implementation_plan.md) - Step-by-step implementation plan
  - [Step 1: Setup PocketBase and Dependencies](../temp/active/step1_pocketbase_setup.md)
  - [Step 2: Create PocketBase Collections](../temp/active/step2_pocketbase_collections.md)
  - [Step 3: Implement PocketBase Service](../temp/active/step3_pocketbase_service.md)
  - [Step 4: Add Session Management](../temp/active/step4_session_management.md)

## Development Guidelines

- [Project Rules](project-rules.md) - Project-specific development rules
- [User Rules](user-rules.md) - Global user rules
- [Changelog](changelog.md) - History of changes and versions

## Getting Started

To get started with the YouKOL Clone application:

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`

## Active Files

The following files are currently being actively developed:

- Server-side PocketBase authentication
- User profile management
- Session management

## Development Status

Current development is focused on implementing PocketBase authentication through a Node.js server proxy. This approach ensures that:

1. All authentication tokens remain server-side
2. The frontend only interacts with the Node.js API
3. User sessions are managed securely with HTTP-only cookies

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

## External Resources

- [Deep Image API Documentation](https://deep-image.ai/docs)
- [PocketBase Documentation](https://pocketbase.io/docs)
- [Alpine.js Documentation](https://alpinejs.dev/start-here)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
