# Frontend Structure

The YouKOL Clone frontend is built using a lightweight stack of HTML, CSS, Alpine.js, and vanilla JavaScript. The application follows a single-page architecture (SPA) pattern managed through Alpine.js state management.

## Core Files

- **index.html** - The main entry point and UI structure
- **styles.css** - Custom styling and visual enhancements

## Application Structure

### Main Components

1. **App Container (`#app`)**
   - Houses the entire application
   - Initialized with the Alpine.js `appState()` function
   - Manages the application's lifecycle via `initApp()`

2. **Header Section**
   - Contains the application logo and tagline
   - Uses Tailwind CSS for styling

3. **Main Content Area**
   - Dynamically changes based on the current application state
   - Uses Alpine.js `x-show` directives to toggle visibility

4. **Footer Section**
   - Contains app information and developer credits

### Application States

The application uses a state-based architecture with the following main states:

1. **Initial State**
   - Capture and upload buttons
   - Entry point for user interaction

2. **Preview State**
   - Displays selected media files
   - Provides enhancement options
   - Batch enhancement capabilities

3. **Enhancing State**
   - Progress indicators
   - Loading animations

4. **Results State**
   - Displays enhanced media
   - Provides download options
   - Before/after comparison

5. **Fullscreen View**
   - Larger preview of selected media
   - Navigation controls

## Core Functionality

1. **Media Capture**
   - Direct device camera access via `captureMedia()` function
   - Support for both image and video capture

2. **File Upload**
   - Multiple file selection support
   - Drag and drop functionality
   - Format validation

3. **Image Enhancement**
   - Single image enhancement
   - Batch processing capabilities
   - Progress tracking

4. **Media Management**
   - Preview generation
   - Before/after comparison
   - Download functionality

## State Management

The application state is managed through Alpine.js with the following key functions:

1. **appState()** - The primary state container that initializes:
   - Application variables
   - Media handling functions
   - Enhancement workflows

2. **initApp()** - Handles application initialization:
   - Environment setup
   - API connectivity checks
   - Device capability detection

3. **State Transitions** - Various functions control movement between states:
   - `captureMedia()`
   - `handleFileUpload()`
   - `processEnhancement()`
   - `resetApp()`

## Responsive Design

- Mobile-first approach using Tailwind CSS
- Responsive grid system for media previews
- Adaptive UI components based on screen size
- Touch-friendly controls for mobile devices

## Styling

The application uses a combination of:
- Tailwind CSS utility classes
- DaisyUI components
- Custom CSS for specialized components
- CSS variables for theme consistency

## Integration with Backend

- API requests for enhancement handled through Axios
- File uploads managed with FormData
- Error handling and retry mechanisms
- Progress tracking for long-running operations
