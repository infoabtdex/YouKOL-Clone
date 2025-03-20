# YouKOL Clone - Project Rules

This document outlines specific guidelines and rules for the YouKOL Clone project, supplementing the global user rules. These project-specific instructions ensure consistency, quality, and efficiency across the codebase.

## File Structure Guidelines

### Active and Dormant File Management

- **Active Files**: Store works-in-progress in `/temp/active/`
- **Dormant Files**: Move temporarily unused files to `/temp/dormant/`
- **File States**: Document file status in the index.md file

### Directory Structure

```
/
├── documentation/     # Project documentation
├── public/            # Static assets served directly
├── server/            # Server-side implementation
│   ├── routes/        # API routes
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic
│   ├── config/        # Configuration
│   └── utils/         # Utility functions
├── uploads/           # Temporary storage for uploaded files
├── logs/              # Application logs
├── pocketbase/        # PocketBase executable and database
├── temp/              # Temporary working files
│   ├── active/        # Currently active work files
│   └── dormant/       # Temporarily unused files
├── node_modules/      # Dependencies (not tracked in git)
└── index.html         # Main frontend entry point
```

## Coding Standards

### Frontend Development

1. **JavaScript Conventions**
   - Use Alpine.js directives for DOM manipulation
   - Avoid jQuery or other unnecessary libraries
   - Maintain clean separation of concerns
   - Use ES6+ features with appropriate fallbacks

2. **CSS Guidelines**
   - Use Tailwind utility classes as primary styling method
   - Custom CSS only for complex components not covered by Tailwind
   - Maintain consistent color scheme as defined in tailwind.config
   - Use BEM naming convention for custom CSS classes

3. **HTML Structure**
   - Semantic HTML elements for accessibility
   - Maintain proper heading hierarchy
   - Include appropriate ARIA attributes
   - Ensure mobile-first responsive design

### Backend Development

1. **Express.js Patterns**
   - Use modular route handlers
   - Implement middleware for cross-cutting concerns
   - Follow RESTful API design principles
   - Use async/await for asynchronous operations

2. **Error Handling**
   - Centralized error handling middleware
   - Consistent error response format
   - Detailed logging with appropriate levels
   - User-friendly error messages

3. **Security Practices**
   - No hard-coded secrets (use .env)
   - Validate and sanitize all inputs
   - Implement proper CORS configuration
   - Follow principle of least privilege

### PocketBase Integration

1. **Authentication Guidelines**
   - Use the PocketBase SDK for authentication operations through server-side
   - All authentication tokens remain server-side only
   - Use Express session with HTTP-only cookies for client sessions
   - Support remember-me functionality for persistent sessions

2. **Database Schema Practices**
   - Document all collection schemas in code and documentation
   - Use consistent naming conventions for fields
   - Implement proper relations between collections
   - Include validation rules for all fields

3. **Data Access Patterns**
   - Use the appropriate PocketBase methods for CRUD operations
   - Implement proper error handling for database operations
   - Cache frequently accessed data when appropriate
   - Use transactions for related operations

4. **User Data Security**
   - Implement proper authorization rules in PocketBase Admin UI
   - Validate permissions on both client and server side
   - Follow the principle of least privilege for collection access
   - Apply proper sanitization for user-generated content

## File Naming Conventions

1. **Documentation Files**
   - Use kebab-case for all documentation files (e.g., `server-side-auth-flow.md`)
   - Use descriptive names that clearly indicate the file's content
   - Group related files with common prefixes when appropriate

2. **Code Files**
   - JavaScript files: Use kebab-case (e.g., `auth-middleware.js`)
   - CSS files: Use kebab-case (e.g., `component-styles.css`)
   - HTML files: Use kebab-case (e.g., `user-profile.html`)

3. **Configuration Files**
   - Use standard naming conventions for configuration files (e.g., `.env`, `package.json`)
   - Use kebab-case for custom configuration files (e.g., `webpack-config.js`)

## Development Workflow

### Feature Development Process

1. **Planning Phase**
   - Document feature requirements
   - Create technical design in `/temp/active/`
   - Define acceptance criteria

2. **Implementation Phase**
   - Follow the established code conventions
   - Add appropriate logging
   - Include error handling
   - Document any API changes

3. **Testing Phase**
   - Verify functionality against requirements
   - Test edge cases and error conditions
   - Ensure responsive design works on all targets
   - Validate API integration

4. **Documentation Phase**
   - Update relevant documentation
   - Document API changes if applicable
   - Add comments for complex logic
   - Update changelog.md

### API Integration Guidelines

1. **Deep Image API**
   - Follow rate limiting guidelines
   - Implement proper error handling
   - Cache responses when appropriate
   - Document any API-specific behavior

2. **PocketBase API**
   - Use the official SDK for all operations
   - Implement proper authentication flow
   - Handle realtime subscriptions efficiently
   - Document custom endpoints and hooks

## User Authentication Workflow

1. **Registration Process**
   - Collect minimal required information
   - Implement proper validation for all fields
   - Handle email verification if enabled
   - Create user profile upon successful registration

2. **Login Process**
   - Support both email and username login
   - Implement proper error messages for failed attempts
   - Include "Remember Me" functionality
   - Handle password reset flow

3. **Session Management**
   - Securely store authentication tokens server-side only
   - Implement token refresh mechanism on the server
   - Handle session expiration gracefully
   - Support multiple device logins

4. **User Profile Management**
   - Allow users to update profile information
   - Support avatar uploads and management
   - Implement preference saving for enhancement settings
   - Provide account deletion functionality

## Enhancement Preferences Management

1. **Preset Structure**
   - Create named presets for enhancement settings
   - Support default preset selection
   - Allow preset duplication and editing
   - Implement preset sharing (optional feature)

2. **Enhancement Settings**
   - Standardize setting format across enhancement types
   - Support intensity levels for each enhancement
   - Implement enable/disable toggle for each setting
   - Provide visual previews when possible

3. **User Experience**
   - Autosave changes to preferences
   - Provide one-click application of presets
   - Support A/B comparison between presets
   - Implement preset organization features

## Documentation Requirements

1. **Code Documentation**
   - JSDoc comments for functions
   - Inline comments for complex logic
   - README updates for new features
   - API documentation for new endpoints

2. **User Documentation**
   - Update user guides for new features
   - Document known limitations
   - Provide troubleshooting guidance
   - Include screenshots for UI changes

3. **Schema Documentation**
   - Document all PocketBase collections
   - Include field types and validations
   - Document relations between collections
   - Update when schema changes 