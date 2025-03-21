# User Enhancement Preferences Feature Documentation

## Overview
The Enhancement Preferences feature allows users to personalize their image enhancement experience by selecting which image enhancements they prefer. This creates a more tailored user experience similar to preference systems used by platforms like Twitter and YouTube Music.

## Feature Details

### Core Functionality
1. **Personalized Enhancement Selection**: Users can select which facial and image enhancements they prefer
2. **Onboarding Integration**: New users are prompted to set preferences during account setup
3. **Profile Management**: Users can modify preferences at any time through their profile
4. **Preference Storage**: Selected enhancements are stored in the user profile for future reference

### Enhancement Options
The following enhancement options will be available to users:

| Enhancement | Description | Default |
|-------------|-------------|---------|
| Whiter Teeth | Brighten and whiten teeth in facial images | Off |
| Paler Skin | Lighten skin tone slightly for a brighter look | Off |
| Bigger Eyes | Subtly enlarge eyes for a more expressive look | Off |
| Slimmer Face | Apply gentle facial contouring | Off |
| Smoother Skin | Reduce appearance of blemishes and imperfections | On |
| Enhanced Lighting | Improve image lighting and shadows | On |
| Vibrant Colors | Increase color saturation for more vivid images | On |
| Remove Red Eye | Automatically detect and fix red eye | On |

### Data Structure
Enhancement preferences will be stored in the existing `user_profiles` collection in PocketBase, within the `preferences` object:

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
    "darkMode": false,
    "enableNotifications": true
  }
}
```

## User Experience

### Onboarding Flow
1. User creates an account
2. After completing the initial profile setup (name, bio), users proceed to the enhancement preferences step
3. Users are presented with a grid of enhancement options, each with:
   - Descriptive name
   - Visual example (before/after)
   - Toggle switch for selection
4. Users can select their preferred enhancements or press "Skip for now"
5. Onboarding is marked as complete regardless of whether the user sets preferences or skips

### Profile Management
1. Users access their profile via the profile button in the header
2. The profile edit modal includes an "Enhancement Preferences" tab or section
3. The preferences interface matches the onboarding screen design
4. Changes are saved when the user clicks "Save Changes"

## UI Design Guidelines

### Onboarding Enhancement Screen
- **Layout**: Grid of enhancement options, 2 columns on mobile, 3-4 on desktop
- **Card Design**: Each enhancement option displayed as a card with:
  - Visual example (before/after split image)
  - Enhancement name
  - Brief description
  - Toggle switch (right-aligned)
- **Navigation**: 
  - "Skip for now" (secondary button)
  - "Save Preferences" (primary button)
- **Visual Style**: Consistent with the existing UI, emphasis on before/after visual examples

### Profile Enhancement Section
- **Tab/Section**: Dedicated area in profile settings labeled "Enhancement Preferences"
- **Layout**: Same grid layout as onboarding but integrated into profile UI
- **Responsive Design**: Adjusts to available width in the profile modal

## Technical Implementation

### PocketBase Schema Updates
The existing `user_profiles` collection already has a `preferences` JSON field that we'll extend to include the `enhancements` object.

### API Integration
- **Retrieving Preferences**: Leverage existing `/api/profile` GET endpoint
- **Updating Preferences**: Use existing `/api/profile` PUT endpoint

## Implementation Considerations

### Privacy and Ethical Considerations
- Default settings are minimal to promote authenticity
- Clear labeling to ensure users understand what each enhancement does
- Option to disable all enhancements at once
- Clearly communicate that preferences are stored in their profile

### Performance Optimizations
- Caching preferences client-side to reduce API calls
- Lazy-loading enhancement examples to improve page load time

### Accessibility
- Ensure toggle switches are keyboard navigable
- Provide alt text for enhancement examples
- High contrast mode for enhancement cards

## Testing Procedures
1. **Unit Tests**: Verify that preference storage and retrieval work correctly
2. **UI Tests**: Validate that the UI correctly displays and updates preferences
3. **User Flow Tests**: Test the complete onboarding and profile editing experiences

## Future Enhancements
- **Enhancement Level Control**: Allow users to adjust the intensity of each enhancement
- **Preset Profiles**: Let users create and switch between enhancement preset groups
- **AI-Suggested Preferences**: Analyze user feedback to suggest optimal enhancement settings
- **A/B Testing**: Show users before/after to let them select preferred result 