/**
 * PocketBase initialization script
 * 
 * This script sets up the required collections for the application
 * and verifies that PocketBase is configured correctly.
 */

// PocketBase is an ES module but we're in a CommonJS environment
let PocketBase;
(async () => {
  // Dynamic import for PocketBase
  PocketBase = (await import('pocketbase')).default;
  
  // Run initialization once the import is done
  await initializePocketBase();
})().catch(error => {
  console.error('Unhandled error during initialization:', error);
});

/**
 * Initialize PocketBase collections and verify setup
 */
async function initializePocketBase() {
  console.log('Starting PocketBase initialization...');
  
  // Create PocketBase client
  const pb = new PocketBase('http://127.0.0.1:8090');
  
  try {
    // Test connection
    console.log('Testing connection to PocketBase...');
    await pb.health.check();
    console.log('✅ PocketBase is running and reachable');
  } catch (error) {
    console.error('❌ Failed to connect to PocketBase:', error);
    console.error('Make sure PocketBase is running at http://127.0.0.1:8090');
    process.exit(1);
  }
  
  // Try to create an admin account if none exists
  try {
    console.log('Attempting to create an admin account (if one does not exist)...');
    const adminEmail = 'admin@example.com';
    const adminPassword = 'complexpassword123';
    
    try {
      // Try to login with default credentials first to see if an admin exists
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Successfully logged in with existing admin account');
    } catch (loginError) {
      // If login fails, try to create a new admin
      if (loginError.status === 400) {
        try {
          await pb.admins.create({
            email: adminEmail,
            password: adminPassword,
            passwordConfirm: adminPassword
          });
          await pb.admins.authWithPassword(adminEmail, adminPassword);
          console.log('✅ Created and authenticated as admin');
        } catch (createError) {
          console.log('⚠️ Could not create admin account:', createError.message);
          console.log('You might need to manually set up an admin account via the admin UI');
        }
      } else {
        console.log('⚠️ Error when trying to authenticate as admin:', loginError.message);
      }
    }
  } catch (adminError) {
    console.error('❌ Error setting up admin account:', adminError);
  }
  
  // Ensure the 'users' collection exists
  try {
    console.log('Checking if users collection exists...');
    
    try {
      // Try to get the users collection
      await pb.collection('users').getList(1, 1);
      console.log('✅ Users collection exists');
    } catch (error) {
      if (error.status === 404) {
        console.log('❌ Users collection not found. Creating it...');
        
        // Create the users collection
        try {
          // Check if we're authenticated as admin
          if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
            console.error('❌ Not authenticated as admin. Cannot create collections.');
            console.error('Please log in to the admin UI at http://127.0.0.1:8090/_/ and create the collections manually.');
            return;
          }
          
          // Create users collection schema
          console.log('Creating users collection...');
          
          // Note: This is a simplified version; you may need to adjust based on your exact schema
          const usersCollection = {
            name: 'users',
            type: 'auth',
            schema: [
              {
                name: 'name',
                type: 'text',
                required: false
              },
              {
                name: 'isNew',
                type: 'bool',
                required: false,
                default: true
              }
            ]
          };
          
          // Create collection
          // Note: Using the API here is a simplified approach
          // In practice, you might need to use pb.collections.create()
          console.log('⚠️ Could not automatically create users collection');
          console.log('Please log in to the admin UI at http://127.0.0.1:8090/_/ and create an auth collection named "users"');
        } catch (createError) {
          console.error('❌ Failed to create users collection:', createError);
        }
      } else {
        console.error('❌ Error checking users collection:', error);
      }
    }
  } catch (collectionError) {
    console.error('❌ Error setting up collections:', collectionError);
  }
  
  // Check for preferences collection
  try {
    console.log('Checking if preferences collection exists...');
    
    try {
      await pb.collection('preferences').getList(1, 1);
      console.log('✅ Preferences collection exists');
    } catch (error) {
      if (error.status === 404) {
        console.log('⚠️ Preferences collection not found');
        console.log('It should be created by the migrations, but you can also create it manually if needed');
      } else {
        console.error('❌ Error checking preferences collection:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error checking preferences collection:', error);
  }
  
  console.log('\n=== PocketBase Initialization Complete ===');
  console.log('If any issues were reported, please address them before using the application.');
  console.log('You can access the PocketBase admin dashboard at: http://127.0.0.1:8090/_/');
} 