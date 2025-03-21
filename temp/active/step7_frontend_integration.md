# Step 7: Frontend Integration Implementation

## Objective

Connect the frontend to the authentication API, enabling users to register, login, and manage their profiles through the UI.

## Implementation Details

The frontend integration has been implemented using Alpine.js for state management and UI interactions. This implementation follows the existing design patterns of the application and integrates seamlessly with the server-side authentication and profile management features.

### 1. Authentication State Management

The app state has been extended with authentication-related properties:

```javascript
// Authentication state
isAuthenticated: false,
user: null,
authError: null,
authLoading: false,
profileError: null,
profileLoading: false,

// Auth modals
showLoginModal: false,
showRegisterModal: false,
showProfileView: false,

// Form data
loginForm: {
    identity: '',
    password: ''
},
registerForm: {
    email: '',
    username: '',
    password: '',
    passwordConfirm: ''
},
profileForm: {
    displayName: '',
    bio: '',
    preferences: {
        darkMode: false,
        notifications: true
    }
}
```

### 2. Authentication Methods

Several methods have been added to handle authentication operations:

#### Initialization

```javascript
async initApp() {
    // Existing initialization code
    
    // Check authentication status
    await this.checkAuthStatus();
}
```

#### Auth Status Check

```javascript
async checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.authenticated) {
            this.isAuthenticated = true;
            this.user = data.user;
            
            // Check for onboarding
            if (this.user && !this.user.isOnboarded) {
                this.showOnboarding = true;
            }
            
            // Load profile data
            await this.loadProfileForm();
        }
    } catch (error) {
        console.error('Failed to check authentication status:', error);
    }
}
```

#### Login

```javascript
async login() {
    this.authLoading = true;
    this.authError = null;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.loginForm),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.isAuthenticated = true;
            this.user = data.user;
            this.showLoginModal = false;
            
            // Check for onboarding
            if (!data.user.isOnboarded) {
                this.showOnboarding = true;
            }
        } else {
            this.authError = data.message || 'Login failed';
        }
    } catch (error) {
        this.authError = 'An error occurred';
    } finally {
        this.authLoading = false;
    }
}
```

#### Registration

```javascript
async register() {
    // Validate inputs
    if (this.registerForm.password !== this.registerForm.passwordConfirm) {
        this.authError = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.registerForm),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show login form with pre-filled credentials
            this.showRegisterModal = false;
            this.showLoginModal = true;
        } else {
            this.authError = data.message || 'Registration failed';
        }
    } catch (error) {
        this.authError = 'An error occurred';
    }
}
```

#### Logout

```javascript
async logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.isAuthenticated = false;
            this.user = null;
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}
```

### 3. Profile Management

Methods for handling user profile operations:

#### Load Profile

```javascript
async loadProfileForm() {
    if (!this.isAuthenticated) return;
    
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.profile) {
            this.profileForm = {
                displayName: data.profile.displayName || '',
                bio: data.profile.bio || '',
                preferences: data.profile.preferences || {
                    darkMode: false,
                    notifications: true
                }
            };
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}
```

#### Update Profile

```javascript
async updateProfile() {
    this.profileLoading = true;
    this.profileError = null;
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.profileForm),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (this.user) {
                this.user.displayName = data.profile.displayName;
            }
            this.showProfileView = false;
        } else {
            this.profileError = data.message || 'Failed to update profile';
        }
    } catch (error) {
        this.profileError = 'An error occurred';
    } finally {
        this.profileLoading = false;
    }
}
```

### 4. Onboarding Flow

The onboarding flow consists of three steps and allows users to set their preferences:

```javascript
// Onboarding state
showOnboarding: false,
onboardingStep: 1,
onboardingData: {
    displayName: '',
    preferences: {
        darkMode: false,
        notifications: true
    },
    steps: []
}
```

Methods for handling onboarding:

```javascript
nextOnboardingStep() {
    if (this.onboardingStep < 3) {
        this.onboardingStep++;
        this.onboardingData.steps.push(`step-${this.onboardingStep}`);
    } else {
        this.completeOnboarding();
    }
}

previousOnboardingStep() {
    if (this.onboardingStep > 1) {
        this.onboardingStep--;
    }
}

async completeOnboarding() {
    try {
        // Update profile first
        await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                displayName: this.onboardingData.displayName,
                preferences: this.onboardingData.preferences
            }),
            credentials: 'include'
        });
        
        // Mark onboarding as complete
        const response = await fetch('/api/profile/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                completed: true,
                preferences: this.onboardingData.preferences,
                steps: this.onboardingData.steps
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.user.isOnboarded = true;
            this.showOnboarding = false;
        }
    } catch (error) {
        console.error('Failed to complete onboarding:', error);
    }
}
```

### 5. UI Components

The following UI components have been added to the application:

#### Authentication Header

- Login and Sign up buttons for unauthenticated users
- User menu with profile and logout options for authenticated users

#### Authentication Modals

- Login modal with email/username and password fields
- Registration modal with email, username, password, and confirm password fields
- Profile view/edit modal for updating user information and preferences

#### Onboarding Flow

- Multi-step onboarding process with a welcome screen, preferences setup, and completion screen
- Navigation between steps with previous and next buttons
- Option to skip onboarding

### 6. Security Considerations

- All API calls include `credentials: 'include'` to send cookies with cross-origin requests
- Authentication tokens are never exposed to client-side code
- Session management is handled entirely server-side
- User state is checked on application initialization

## Testing

The frontend integration can be tested by:

1. Opening the application in a browser
2. Clicking the "Sign up" button to create a new account
3. Logging in with the created account
4. Going through the onboarding process
5. Updating profile information
6. Logging out and verifying the authentication state changes

## Design Consistency

The implementation follows the existing design patterns of the application:

- Uses the same color scheme and UI components
- Maintains the same look and feel as the rest of the application
- Uses consistent button and form styling
- Follows the same responsive design approach 