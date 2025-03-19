# Application Flow

This document outlines the complete flow of the YouKOL Clone application, from user interaction to backend processing and result delivery.

## User Journey

### 1. Application Entry
- User accesses the application via web browser
- Frontend loads with initial state (capture/upload options)
- App initializes and validates API connectivity

### 2. Media Selection
**Path A: Upload**
1. User clicks "Upload" button
2. File browser opens for selection
3. User selects image(s) or video(s)
4. Preview generated and displayed

**Path B: Capture**
1. User clicks "Capture" button
2. Camera access permission requested
3. User captures image or video
4. Preview generated and displayed

### 3. Enhancement Process
1. User views media preview
2. User initiates enhancement (single or batch)
3. Processing indicators displayed
4. Backend processing begins

### 4. Result Delivery
1. Enhanced media displayed
2. Before/after comparison available
3. Download options presented
4. User can share or save results

## Technical Flow

### 1. Frontend Initialization
```
User Access → Load HTML/CSS/JS → Alpine.js initialization → 
State setup → API connectivity check
```

### 2. Media Handling
```
Media Selection → File validation → Preview generation → 
Upload preparation → State transition to preview
```

### 3. API Request Flow
```
Enhancement request → FormData preparation → API endpoint call → 
Server processing → External API proxy → Results handling
```

### 4. Backend Processing
```
Receive request → Validate input → Process file/data → 
Forward to Deep Image API → Process response → Return to client
```

### 5. Data Flow Diagram
```
Client Browser  ↔  Express Server  ↔  Deep Image API
      ↑↓               ↑↓                ↑↓
 User Interface     File Storage     Enhancement Processing
      ↑↓
   PocketBase
  (for authentication)
```

## State Transitions

1. **Initial → Preview**
   - Triggered by: File selection or camera capture
   - Data changes: Media files loaded into application state
   - UI changes: Preview grid displayed, enhancement options available

2. **Preview → Enhancing**
   - Triggered by: Enhancement button click
   - Data changes: Processing flags set, queue initialized
   - UI changes: Loading indicators, progress tracking

3. **Enhancing → Results**
   - Triggered by: Successful API response
   - Data changes: Enhanced media stored, comparison data prepared
   - UI changes: Results display, before/after comparison tools

4. **Any State → Initial**
   - Triggered by: Reset/New button or error condition
   - Data changes: State cleared, temporary files removed
   - UI changes: Return to initial upload/capture options

## Error Handling Flows

1. **API Connectivity Issues**
   - Detection: Failed API health check
   - Response: Error notification, retry options
   - Recovery: Automatic retry with backoff

2. **File Processing Errors**
   - Detection: Invalid file type/size, corrupt data
   - Response: User notification with specific error
   - Recovery: Option to select different file

3. **Enhancement Failures**
   - Detection: Error response from Deep Image API
   - Response: Error notification with details
   - Recovery: Retry options with modified parameters

4. **Permission Issues**
   - Detection: Camera/storage permission denied
   - Response: Clear instructions for enabling permissions
   - Recovery: Alternative capture methods suggested

## Batch Processing Flow

For multiple image enhancement:

1. Queue preparation and prioritization
2. Parallel processing up to configured limit
3. Individual progress tracking
4. Aggregated results handling
5. Comprehensive completion notification

## Authentication Flow (when implemented)

1. **User Registration**
   ```
   Registration form → Validation → Server-side PocketBase registration →
   Session creation → User session start
   ```

2. **User Login**
   ```
   Login form → Credential verification → Server-side PocketBase authentication →
   Session creation → User session start
   ```

3. **Session Management**
   ```
   Server-side session → Token validation → Automatic renewal →
   Session expiration handling
   ``` 