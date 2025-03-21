# Enhancement Preferences Implementation Steps

This document outlines the specific steps to implement the enhancement preferences feature based on the plan in `enhancement_preferences_feature_plan.md`.

## 1. Create Example Images

First, we need to create example images for each enhancement option. These will be used in the UI to show before/after examples.

- [ ] Create before/after images for each enhancement option:
  - [ ] Whiter Teeth
  - [ ] Paler Skin
  - [ ] Bigger Eyes
  - [ ] Slimmer Face
  - [ ] Smoother Skin
  - [ ] Enhanced Lighting
  - [ ] Vibrant Colors
  - [ ] Remove Red Eye
- [ ] Add these images to `/uploads/enhancement-examples/` directory

## 2. Update HTML Components

### 2.1 Update Profile Modal

Modify the profile modal to include an enhancements tab:

- [ ] Add tab navigation in the profile modal
- [ ] Create enhancement preferences UI component in the profile modal
- [ ] Link the UI to the Alpine.js state

### 2.2 Add Onboarding Step

Modify the onboarding flow to include the enhancement preferences step:

- [ ] Change the existing "All Set!" step to step 4
- [ ] Add a new enhancement preferences step as step 3
- [ ] Update the navigation logic to handle 4 steps instead of 3

## 3. Update Alpine.js State and Methods

### 3.1 Update State

- [ ] Add enhancement options array to define available options
- [ ] Update `profileForm` to include enhancement preferences
- [ ] Update `onboardingData` to include enhancement preferences

### 3.2 Update Methods

- [ ] Modify `loadProfileForm()` to load enhancement preferences
- [ ] Update `updateProfile()` to save enhancement preferences
- [ ] Add `skipEnhancementPreferences()` method for onboarding
- [ ] Add `getEnhancementExampleImage()` helper method for loading example images
- [ ] Update `nextOnboardingStep()` and `previousOnboardingStep()` to handle the new step
- [ ] Update `completeOnboarding()` to include enhancement preferences

## 4. Testing

- [ ] Test onboarding flow with enhancement preferences step
- [ ] Test profile editing with enhancement preferences tab
- [ ] Test saving and loading enhancement preferences
- [ ] Test skipping enhancement preferences during onboarding

## 5. Documentation Updates

- [ ] Update main documentation to reflect the new feature
- [ ] Create comprehensive documentation for enhancement preferences
- [ ] Create a guide for adding new enhancement options in the future 