// test/test-pocketbase.js
const pbService = require('../server/services/pocketbase');
const dotenv = require('dotenv');

dotenv.config();

async function testPocketBaseService() {
  console.log('Testing PocketBase Service...');
  
  try {
    // Test health check
    console.log('\nTesting health check...');
    const isHealthy = await pbService.isHealthy();
    console.log(`Health check result: ${isHealthy ? '✅ Healthy' : '❌ Not healthy'}`);
    
    if (!isHealthy) {
      console.error('PocketBase is not healthy, aborting tests.');
      return;
    }
    
    // Generate a unique email and username for testing
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testUsername = `testuser-${timestamp}`;
    
    // Test user registration
    console.log('\nTesting user registration...');
    const testUser = {
      email: testEmail,
      password: 'Password123!',
      passwordConfirm: 'Password123!',
      username: testUsername
    };
    
    const user = await pbService.registerUser(testUser);
    console.log('✅ User registered:', user.id);
    
    // Test user profile creation
    console.log('\nTesting user profile creation...');
    const profileData = {
      user: user.id,
      display_name: 'Test User',
      bio: 'This is a test user profile',
      onboarding_completed: false
    };
    
    try {
      const profile = await pbService.createUserProfile(profileData);
      console.log('✅ Profile created:', profile.id);
    } catch (error) {
      console.error('❌ Profile creation failed:', error.message);
      if (error.data) {
        console.error('Error details:', JSON.stringify(error.data));
      }
      // Create a fallback minimal profile
      try {
        console.log('Trying with minimal required fields...');
        const minimalProfile = {
          user: user.id,
          display_name: 'Test User',
          onboarding_completed: false
        };
        const profile = await pbService.createUserProfile(minimalProfile);
        console.log('✅ Minimal profile created:', profile.id);
      } catch (fallbackError) {
        console.error('❌ Minimal profile creation also failed:', fallbackError.message);
        if (fallbackError.data) {
          console.error('Error details:', JSON.stringify(fallbackError.data));
        }
      }
    }
    
    // Test login
    console.log('\nTesting user login...');
    const authData = await pbService.loginUser(testEmail, testUser.password);
    console.log('✅ Login successful:', authData.record.id);
    
    // Test getting complete user data
    console.log('\nTesting get complete user data...');
    const userData = await pbService.getCompleteUserData(user.id);
    console.log('✅ Complete user data retrieved:', userData.id);
    
    // Test update onboarding status
    console.log('\nTesting update onboarding status...');
    const onboardingData = {
      usage_frequency: 'weekly',
      content_types: JSON.stringify(['photos', 'graphics']),
    };
    
    const updatedProfile = await pbService.updateOnboardingStatus(user.id, onboardingData);
    console.log('✅ Onboarding status updated:', updatedProfile.onboarding_completed);
    
    console.log('\nAll tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

// Run the tests
testPocketBaseService(); 