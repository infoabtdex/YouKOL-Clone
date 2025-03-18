/**
 * Script to manually create the PocketBase schema with proper permissions
 * This helps fix issues with collections not having the right rules
 */

// IMPORTANT: Run this script only after logging in as admin to PocketBase

// Use dynamic import for PocketBase
async function createSchema() {
  try {
    // Import PocketBase
    const PocketBaseModule = await import('pocketbase');
    const PocketBase = PocketBaseModule.default;
    
    console.log('Starting PocketBase schema setup...');
    
    // Connect to PocketBase
    const pb = new PocketBase('http://127.0.0.1:8090');
    
    // Check connection
    try {
      await pb.health.check();
      console.log('✅ PocketBase connection successful');
    } catch (error) {
      console.error('❌ Failed to connect to PocketBase:', error);
      return;
    }
    
    // First, try to authenticate as admin
    const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.PB_ADMIN_PASSWORD || 'your-password-here';
    
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated as admin');
    } catch (error) {
      console.error('❌ Failed to authenticate as admin:', error);
      console.error('Please update the admin credentials in this script or set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables.');
      console.error('Then open the PocketBase admin UI at http://127.0.0.1:8090/_/ and log in.');
      return;
    }
    
    // Check if users collection exists
    try {
      const usersCollection = await pb.collections.getOne('users');
      console.log('✅ Users collection exists');
      
      // Update the users collection with proper rules
      await pb.collections.update(usersCollection.id, {
        name: 'users',
        type: 'auth',
        listRule: '',  // Only admins can list
        viewRule: '@request.auth.id = id', // Users can view only themselves
        createRule: '', // Only admins can create 
        updateRule: '@request.auth.id = id', // Users can update only themselves
        deleteRule: '@request.auth.id = id', // Users can delete only themselves
      });
      
      console.log('✅ Updated users collection rules');
    } catch (error) {
      console.error('❌ Error with users collection:', error);
      // Don't continue if users collection is missing
      return;
    }
    
    // Now handle preferences collection
    try {
      // Check if preferences collection exists
      let prefsCollection;
      try {
        prefsCollection = await pb.collections.getOne('preferences');
        console.log('✅ Preferences collection exists');
      } catch (error) {
        // Collection doesn't exist, create it
        console.log('Creating preferences collection...');
        
        prefsCollection = await pb.collections.create({
          name: 'preferences',
          type: 'base',
          schema: [
            {
              name: 'userId',
              type: 'relation',
              required: true,
              options: {
                collectionId: 'users',
                cascadeDelete: true,
                maxSelect: 1,
                minSelect: 1
              }
            },
            {
              name: 'preferences',
              type: 'json',
            }
          ],
          listRule: '@request.auth.id != ""', // Any authenticated user can list
          viewRule: '@request.auth.id = userId', // Users can view only their preferences
          createRule: '@request.auth.id = userId', // Users can create only their preferences
          updateRule: '@request.auth.id = userId', // Users can update only their preferences
          deleteRule: '@request.auth.id = userId', // Users can delete only their preferences
        });
        
        console.log('✅ Created preferences collection with proper rules');
      }
      
      // If collection already exists, update its rules
      if (prefsCollection) {
        await pb.collections.update(prefsCollection.id, {
          listRule: '@request.auth.id != ""', // Any authenticated user can list
          viewRule: '@request.auth.id = userId', // Users can view only their preferences
          createRule: '@request.auth.id = userId', // Users can create only their preferences
          updateRule: '@request.auth.id = userId', // Users can update only their preferences
          deleteRule: '@request.auth.id = userId', // Users can delete only their preferences
        });
        
        console.log('✅ Updated preferences collection rules');
      }
    } catch (error) {
      console.error('❌ Error setting up preferences collection:', error);
    }
    
    console.log('\nPocketBase schema setup complete!');
    console.log('You should now be able to use the application without permission errors.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createSchema(); 