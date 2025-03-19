# ImaKOL Technical Stack

This document outlines the technologies used in the ImaKOL application.

## Frontend

- **HTML/CSS/JavaScript**: Core web technologies
- **Alpine.js**: Lightweight JavaScript framework for interactivity
- **Tailwind CSS**: Utility-first CSS framework for styling

## Backend

- **Node.js**: JavaScript runtime for server-side code
- **Express.js**: Web framework for creating the API server
- **PocketBase**: Database and authentication backend
- **Express-session**: Session management for authentication

## Authentication

- **Server-side session management**: Using Express-session with secure cookies
- **PocketBase authentication**: Leveraged through Node.js server as a proxy
- **HTTP-only cookies**: For secure token storage

## Data Storage

- **PocketBase (SQLite)**: Main database for users and preferences
- **Server-side file storage**: For temporary processing of images

## APIs and Services

- **Deep Image API**: For AI-powered image enhancement
- **Node.js REST API**: Custom API layer between client and PocketBase

## DevOps

- **npm**: Package management
- **Nodemon**: Development server with hot reloading
- **Concurrently**: Run multiple processes simultaneously (Node.js + PocketBase)

## Security

- **HTTP-only cookies**: Prevent client-side access to authentication tokens
- **CORS**: Configure Cross-Origin Resource Sharing for API security
- **Helmet**: Express middleware for securing HTTP headers
- **Server-side validation**: Validate all inputs on the server

## Deployment Options

- **VPS/Cloud**: Deploy Node.js server and PocketBase on a VPS or cloud provider
- **Docker**: Containerize the application for easier deployment
- **Static Hosting + Serverless**: Option for static frontend with serverless backend

## Development Tools

- **VS Code**: Recommended code editor
- **Chrome DevTools**: For debugging and testing
- **Postman/Insomnia**: For API testing

## Build and Bundling

- **Webpack**: Bundle JavaScript for production
- **PostCSS**: Process Tailwind CSS
- **Babel**: JavaScript compatibility for older browsers

This stack provides a lightweight yet powerful foundation for the ImaKOL application, focusing on performance, maintainability, and developer experience.
