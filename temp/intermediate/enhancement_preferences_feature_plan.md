# Enhancement Preferences Feature Plan

## Overview
This document outlines the plan for implementing user-configurable image enhancement preferences. Users will be able to select their preferred image enhancement options (e.g., whiter teeth, paler skin, bigger eyes, slimmer face) that will be stored in their profile.

## Requirements
1. Store user enhancement preferences in the PocketBase `user_profiles` collection
2. Allow users to select preferences during onboarding (with option to skip)
3. Enable users to edit preferences from their profile page
4. Provide a UI for managing these preferences similar to Twitter/YouTube Music

## Data Model Changes
The `user_profiles` collection will need to store enhancement preferences:

```json
{
  "preferences": {
    "enhancements": {
      "whiterTeeth": true,
      "palerSkin": false,
      "biggerEyes": true,
      "slimmerFace": true,
      // other enhancement options...
    },
    // existing preference fields
    "darkMode": true,
    "enableNotifications": true
  }
}
```

## User Flow
1. **New User Registration**:
   - After account creation, include enhancement preferences in the onboarding flow
   - Show options with visual examples of each enhancement
   - Allow users to skip this step
   - Mark onboarding as complete after this step

2. **Existing Users**:
   - Access via Profile page
   - Edit enhancement preferences
   - Save changes to PocketBase

## UI Components
1. **Onboarding Enhancement Preferences Screen**:
   - Grid of enhancement options with toggle switches
   - Visual examples for each option
   - Skip/Continue buttons

2. **Profile Enhancement Preferences Section**:
   - Similar grid in the profile editor
   - Save button to update preferences

## API Endpoints
Will utilize existing profile update endpoints:
- `PUT /api/profile` - Update user preferences including enhancement options

## Integration Points
1. Integration with existing profile management
2. Integration with onboarding flow

## Implementation Phases
1. Update PocketBase schema to support enhancement preferences
2. Create UI for onboarding enhancement selection
3. Add enhancement preferences to profile editor 