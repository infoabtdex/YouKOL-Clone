# YouKOL Clone

A clone of YouKOL with image enhancement capabilities and user authentication using server-side session management.

## Features

- 🔐 Secure server-side authentication
- 🖼️ Image enhancement via API
- 🎨 User enhancement presets
- 🚀 Fast response times
- 📱 Mobile-friendly UI

## Project Structure

```
/
├── documentation/     # Project documentation
├── public/            # Static files for the frontend
├── server/            # Server-side code
│   ├── config/        # Configuration files
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   └── utils/         # Utility functions
├── pocketbase/        # PocketBase database (installed via setup)
└── uploads/           # Temporary folder for image uploads
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/youkol-clone.git
   cd youkol-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the project root:
   ```
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-session-secret
   API_KEY=your-image-enhancement-api-key
   API_URL=your-image-enhancement-api-url
   POCKETBASE_URL=http://127.0.0.1:8090
   ```

4. Install PocketBase:
   ```bash
   npm run setup
   ```

## Running the Application

### Development Mode

Run both the Node.js server and PocketBase together:

```bash
npm run dev
```

This will start:
- Node.js server on http://localhost:3000
- PocketBase on http://localhost:8090

### Running Components Separately

To run the Node.js server only:

```bash
npm run server
```

To run PocketBase only:

```bash
npm run pocketbase
```

## PocketBase Admin

Access the PocketBase admin interface at http://127.0.0.1:8090/_/ to manage your database.

On first run, you'll need to create an admin account.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and create a session
- `GET /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/preferences` - Save user preferences

### Enhancement Presets

- `GET /api/presets` - Get all presets for current user
- `POST /api/presets` - Create a new preset
- `GET /api/presets/:id` - Get a specific preset
- `PUT /api/presets/:id` - Update a preset
- `DELETE /api/presets/:id` - Delete a preset

### Image Enhancement

- `POST /api/enhance` - Enhance a single image
- `POST /api/enhance/batch` - Enhance multiple images

## Authentication Flow

1. User registers or logs in via the API
2. Server creates a session and stores token server-side
3. Session ID is sent to client via HTTP-only cookie
4. Client includes cookie in subsequent requests
5. Server validates session on protected routes

## Folder Structure

- `public/` - Static files for the frontend including HTML, CSS, and client-side JavaScript
- `server/config/` - Configuration files for Express and session management
- `server/middleware/` - Authentication and error handling middleware
- `server/routes/` - API route definitions
- `server/services/` - Service layer for database and external API interactions
- `server/utils/` - Utility functions like logging and validation

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository. 