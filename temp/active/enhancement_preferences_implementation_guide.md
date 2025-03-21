# Enhancement Preferences Implementation Guide

This guide provides developers with technical instructions for implementing the User Enhancement Preferences feature. The feature allows users to customize their preferred image enhancement options during onboarding and through their profile settings.

## Implementation Steps

### 1. PocketBase Schema Update

The existing `user_profiles` collection already contains a `preferences` JSON field. No schema changes are required, as we'll extend the existing JSON structure.

The enhancement preferences will be stored in this structure:

```json
{
  "preferences": {
    "enhancements": {
      "whiterTeeth": false,
      "palerSkin": false,
      "biggerEyes": false,
      "slimmerFace": false,
      "smootherSkin": true,
      "enhancedLighting": true,
      "vibrantColors": true,
      "removeRedEye": true
    },
    // existing preferences remain unchanged
    "darkMode": false,
    "enableNotifications": true
  }
}
```

### 2. Frontend Components

#### 2.1 Enhancement Preference Card Component

Create a reusable component for each enhancement option:

```html
<!-- Enhancement Option Card -->
<div class="enhancement-option-card">
  <div class="enhancement-example">
    <img :src="getEnhancementExampleImage(option.id)" alt="${option.name} example" class="enhancement-image">
  </div>
  <div class="enhancement-details">
    <h3 class="enhancement-name">${option.name}</h3>
    <p class="enhancement-description">${option.description}</p>
  </div>
  <div class="enhancement-toggle">
    <label class="toggle-switch">
      <input 
        type="checkbox" 
        x-model="profileForm.preferences.enhancements[option.id]">
      <span class="toggle-slider"></span>
    </label>
  </div>
</div>
```

#### 2.2 Onboarding Enhancement Step

Add a new step to the onboarding flow:

```html
<!-- Enhancements Onboarding Step -->
<div x-show="onboardingStep === 3" class="onboarding-step">
  <h2 class="text-xl font-bold text-center mb-6">Customize Your Enhancements</h2>
  <p class="text-center text-gray-600 mb-6">
    Choose which enhancements you'd like applied to your images.
  </p>
  
  <div class="enhancement-options-grid">
    <template x-for="option in enhancementOptions" :key="option.id">
      <!-- Enhancement Option Card Component -->
    </template>
  </div>

  <div class="flex justify-between mt-8">
    <button 
      @click="previousOnboardingStep" 
      class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
      Back
    </button>
    <div>
      <button 
        @click="skipEnhancementPreferences" 
        class="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
        Skip for now
      </button>
      <button 
        @click="saveEnhancementPreferences" 
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Save Preferences
      </button>
    </div>
  </div>
</div>
```

#### 2.3 Profile Enhancement Preferences Tab

Add an enhancement preferences section to the profile modal:

```html
<!-- Profile Edit Modal -->
<div x-show="showProfileView" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div @click.away="showProfileView = false" class="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
    
    <!-- Tab Navigation -->
    <div class="border-b mb-6">
      <nav class="flex space-x-4">
        <button 
          @click="activeProfileTab = 'general'" 
          :class="{'text-blue-500 border-b-2 border-blue-500': activeProfileTab === 'general'}"
          class="py-2 px-1">
          General
        </button>
        <button 
          @click="activeProfileTab = 'enhancements'" 
          :class="{'text-blue-500 border-b-2 border-blue-500': activeProfileTab === 'enhancements'}"
          class="py-2 px-1">
          Enhancement Preferences
        </button>
        <button 
          @click="activeProfileTab = 'notifications'" 
          :class="{'text-blue-500 border-b-2 border-blue-500': activeProfileTab === 'notifications'}"
          class="py-2 px-1">
          Notifications
        </button>
      </nav>
    </div>
    
    <!-- General Tab Content -->
    <div x-show="activeProfileTab === 'general'">
      <!-- Existing profile form fields -->
    </div>
    
    <!-- Enhancements Tab Content -->
    <div x-show="activeProfileTab === 'enhancements'">
      <h3 class="text-lg font-semibold mb-4">Image Enhancement Preferences</h3>
      <p class="text-gray-600 mb-4">
        Choose which enhancements you'd like applied to your images by default.
      </p>
      
      <div class="enhancement-options-grid">
        <template x-for="option in enhancementOptions" :key="option.id">
          <!-- Enhancement Option Card Component -->
        </template>
      </div>
    </div>
    
    <!-- Notifications Tab Content -->
    <div x-show="activeProfileTab === 'notifications'">
      <!-- Notification settings -->
    </div>
    
    <!-- Form actions (sticky at bottom) -->
    <div class="mt-6 pt-4 border-t flex justify-end">
      <button 
        @click="showProfileView = false" 
        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">
        Cancel
      </button>
      <button 
        @click="updateProfile()" 
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        :disabled="profileLoading">
        <span x-show="!profileLoading">Save Changes</span>
        <span x-show="profileLoading">Saving...</span>
      </button>
    </div>
  </div>
</div>
```

### 3. Alpine.js State and Methods

Update the Alpine.js data object:

```javascript
Alpine.data('app', () => ({
  // Existing state...
  
  // New state
  activeProfileTab: 'general',
  enhancementOptions: [
    {
      id: 'whiterTeeth',
      name: 'Whiter Teeth',
      description: 'Brighten and whiten teeth in facial images',
      defaultValue: false
    },
    {
      id: 'palerSkin',
      name: 'Paler Skin',
      description: 'Lighten skin tone slightly for a brighter look',
      defaultValue: false
    },
    {
      id: 'biggerEyes',
      name: 'Bigger Eyes',
      description: 'Subtly enlarge eyes for a more expressive look',
      defaultValue: false
    },
    {
      id: 'slimmerFace',
      name: 'Slimmer Face',
      description: 'Apply gentle facial contouring',
      defaultValue: false
    },
    {
      id: 'smootherSkin',
      name: 'Smoother Skin',
      description: 'Reduce appearance of blemishes and imperfections',
      defaultValue: true
    },
    {
      id: 'enhancedLighting',
      name: 'Enhanced Lighting',
      description: 'Improve image lighting and shadows',
      defaultValue: true
    },
    {
      id: 'vibrantColors',
      name: 'Vibrant Colors',
      description: 'Increase color saturation for more vivid images',
      defaultValue: true
    },
    {
      id: 'removeRedEye',
      name: 'Remove Red Eye',
      description: 'Automatically detect and fix red eye',
      defaultValue: true
    }
  ],
  
  // Update profile form initialization
  initProfileForm() {
    this.profileForm = {
      displayName: '',
      bio: '',
      preferences: {
        darkMode: false,
        enableNotifications: true,
        enhancements: {}
      }
    };
    
    // Initialize enhancement preferences with defaults
    this.enhancementOptions.forEach(option => {
      this.profileForm.preferences.enhancements[option.id] = option.defaultValue;
    });
  },
  
  // Update loadProfileForm method
  async loadProfileForm() {
    this.profileLoading = true;
    
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.profile) {
        this.profileForm = {
          displayName: data.profile.displayName || '',
          bio: data.profile.bio || '',
          preferences: {
            darkMode: data.profile.preferences?.darkMode || false,
            enableNotifications: data.profile.preferences?.enableNotifications || true,
            enhancements: {}
          }
        };
        
        // Load saved enhancement preferences, or use defaults if not set
        this.enhancementOptions.forEach(option => {
          this.profileForm.preferences.enhancements[option.id] = 
            data.profile.preferences?.enhancements?.[option.id] !== undefined ? 
            data.profile.preferences.enhancements[option.id] : 
            option.defaultValue;
        });
      }
      
      this.profileLoading = false;
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.profileLoading = false;
    }
  },
  
  // Skip enhancement preferences method for onboarding
  skipEnhancementPreferences() {
    // Use default values for all enhancements
    this.enhancementOptions.forEach(option => {
      this.profileForm.preferences.enhancements[option.id] = option.defaultValue;
    });
    
    this.completeOnboarding();
  },
  
  // Save enhancement preferences method for onboarding
  saveEnhancementPreferences() {
    this.completeOnboarding();
  },
  
  // Helper method to get example image for enhancement
  getEnhancementExampleImage(enhancementId) {
    return `/images/enhancement-examples/${enhancementId}.jpg`;
  }
}));
```

### 4. Onboarding Flow Update

Modify the onboarding flow to include the enhancement preferences step:

```javascript
// Onboarding state
onboardingStep: 1,
onboardingData: {
  steps: ['intro'],
  preferences: {}
},

// Initialize onboarding
initOnboarding() {
  this.onboardingStep = 1;
  this.onboardingData = {
    steps: ['intro'],
    preferences: {
      darkMode: false,
      notifications: true,
      enhancements: {}
    }
  };
  
  // Initialize with default enhancement values
  this.enhancementOptions.forEach(option => {
    this.onboardingData.preferences.enhancements[option.id] = option.defaultValue;
  });
},

// Next onboarding step
nextOnboardingStep() {
  if (this.onboardingStep < 3) {
    this.onboardingStep++;
    
    if (this.onboardingStep === 2) {
      this.onboardingData.steps.push('profile');
    } else if (this.onboardingStep === 3) {
      this.onboardingData.steps.push('enhancements');
    }
  } else {
    this.completeOnboarding();
  }
},

// Update complete onboarding method
async completeOnboarding() {
  // Initialize loading state
  this.onboardingLoading = true;
  
  try {
    // Ensure user profile exists
    if (!this.userProfile) {
      this.userProfile = {
        displayName: '',
        bio: '',
        preferences: {
          darkMode: this.onboardingData.preferences.darkMode,
          enableNotifications: this.onboardingData.preferences.notifications,
          enhancements: this.onboardingData.preferences.enhancements
        }
      };
    }
    
    // ... existing onboarding completion code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

## Testing Plan

1. **PocketBase Schema Validation**:
   - Verify that the `preferences` field in `user_profiles` can store the enhanced JSON structure

2. **Onboarding Flow**:
   - Test that enhancement preferences step appears correctly
   - Verify that skipping preferences uses defaults
   - Confirm that onboarding completes successfully with custom preferences

3. **Profile Management**:
   - Test loading saved preferences in the profile edit modal
   - Verify that changes to preferences are saved correctly
   - Confirm that switching tabs in the profile modal works

4. **Cross-browser Testing**:
   - Verify UI rendering in Chrome, Firefox, Safari, and Edge
   - Test responsive layout on mobile and tablet devices

## Deployment

1. Deploy in stages:
   - First implement the profile preference UI
   - Then add onboarding flow integration

2. Monitor for errors in:
   - PocketBase data consistency
   - API responses
   - Client-side script errors

## Resources

- Example enhancement images to be placed in `/images/enhancement-examples/` 