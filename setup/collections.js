// setup/collections.js
const PocketBase = require('pocketbase/cjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Define the PocketBase URL from environment or use default
const pocketbaseUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

// Create log directory if not exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Setup a basic log file
const logFile = path.join(logDir, 'collections-setup.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

async function setupCollections() {
  log('Starting PocketBase collections setup...');
  
  const pb = new PocketBase(pocketbaseUrl);
  
  try {
    // Check if PocketBase is available
    log('Checking PocketBase connection...');
    await pb.health.check();
    log('✅ PocketBase is running and accessible');
    
    // Authenticate as admin
    if (!adminEmail || !adminPassword) {
      throw new Error('Admin credentials not found in environment variables');
    }
    
    log(`Authenticating as admin (${adminEmail})...`);
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    log('✅ Admin authentication successful');
    
    // Update Users collection
    await updateUsersCollection(pb);
    
    // Create User Profiles collection
    await createUserProfilesCollection(pb);
    
    log('✅ PocketBase collections setup completed successfully');
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    if (error.data) {
      log(`Error details: ${JSON.stringify(error.data)}`);
    }
    process.exit(1);
  } finally {
    logStream.end();
  }
}

async function updateUsersCollection(pb) {
  try {
    log('Updating Users collection...');
    const usersCollection = await pb.collections.getOne('users');
    
    // Create a copy of the existing schema
    const schema = [...usersCollection.schema];
    
    // Check if avatar field already exists
    const avatarFieldExists = schema.some(field => field.name === 'avatar');
    
    if (!avatarFieldExists) {
      log('Adding avatar field to Users collection...');
      // Add avatar field
      schema.push({
        name: 'avatar',
        type: 'file',
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
        }
      });
      
      // Update the collection
      await pb.collections.update('users', {
        schema
      });
      
      log('✅ Users collection updated with avatar field');
    } else {
      log('✅ Avatar field already exists in Users collection');
    }
  } catch (error) {
    log(`❌ Failed to update Users collection: ${error.message}`);
    throw error;
  }
}

async function createUserProfilesCollection(pb) {
  try {
    // Check if collection already exists
    let collectionExists = false;
    try {
      await pb.collections.getOne('user_profiles');
      collectionExists = true;
      log('User Profiles collection already exists');
    } catch (error) {
      // Collection doesn't exist, we'll create it
      log('User Profiles collection does not exist, creating...');
    }
    
    if (!collectionExists) {
      // Create User Profiles collection
      await pb.collections.create({
        name: 'user_profiles',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: true,
              maxSelect: 1,
              minSelect: 1
            }
          },
          {
            name: 'display_name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100
            }
          },
          {
            name: 'bio',
            type: 'text',
            required: false,
            options: {
              max: 500
            }
          },
          {
            name: 'onboarding_completed',
            type: 'bool',
            required: true,
            options: {
              default: false
            }
          },
          {
            name: 'usage_frequency',
            type: 'select',
            required: false,
            options: {
              values: ['daily', 'weekly', 'monthly', 'rarely']
            }
          },
          {
            name: 'content_types',
            type: 'json',
            required: false
          },
          {
            name: 'preferences',
            type: 'json',
            required: false
          }
        ]
      });
      
      log('✅ User Profiles collection created successfully');
      
      // Configure collection permissions
      await configureUserProfilesPermissions(pb);
    } else {
      // Collection exists, we may want to update its schema if needed
      log('Checking if User Profiles collection needs updates...');
      // Additional update logic could go here
    }
  } catch (error) {
    log(`❌ Failed to create User Profiles collection: ${error.message}`);
    throw error;
  }
}

async function configureUserProfilesPermissions(pb) {
  try {
    log('Configuring User Profiles collection permissions...');
    
    const collection = await pb.collections.getOne('user_profiles');
    
    // Set up permissions for User Profiles collection
    await pb.collections.update(collection.id, {
      listRule: '@request.auth.id != ""',        // Only authenticated users can list
      viewRule: '@request.auth.id = user.id',    // Users can only view their own profiles
      createRule: '@request.auth.id != ""',      // Only authenticated users can create
      updateRule: '@request.auth.id = user.id',  // Users can only update their own profiles
      deleteRule: '@request.auth.id = user.id'   // Users can only delete their own profiles
    });
    
    log('✅ User Profiles permissions configured successfully');
  } catch (error) {
    log(`❌ Failed to configure User Profiles permissions: ${error.message}`);
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupCollections().then(() => {
    log('Collections setup process completed');
    process.exit(0);
  }).catch(error => {
    log(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { setupCollections }; 