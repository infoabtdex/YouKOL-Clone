const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Define the PocketBase URL from environment or use default
const pocketbaseUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@ngmt.com';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin@ngmt.com';

// Create log directory if not exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Setup a basic log file
const logFile = path.join(logDir, 'pocketbase-init.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

/**
 * Check if PocketBase is running
 */
async function checkPocketBaseHealth() {
  try {
    const response = await axios.get(`${pocketbaseUrl}/api/health`);
    if (response.status === 200) {
      log('✅ PocketBase is running');
      return true;
    }
  } catch (error) {
    log(`❌ PocketBase health check failed: ${error.message}`);
  }
  return false;
}

/**
 * Initialize PocketBase Admin
 */
async function initializeAdmin() {
  try {
    // First let's check if PocketBase is in setup mode
    log('Checking if PocketBase needs initial setup...');
    
    try {
      // Try to get a token with the admin credentials
      const response = await axios.post(`${pocketbaseUrl}/api/admins/auth-with-password`, {
        identity: adminEmail,
        password: adminPassword
      });
      
      if (response.status === 200 && response.data && response.data.token) {
        log('✅ Admin account already exists and credentials are valid');
        return response.data.token;
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log('Admin account exists but credentials are invalid');
        throw new Error('Admin account exists but credentials are invalid. Check your .env file.');
      }
      
      // If we get a 404, the admin doesn't exist yet
      if (error.response && error.response.status === 404) {
        log('Admin account does not exist. Checking if we can create it...');
        
        try {
          // Try to access the setup endpoint
          const setupCheckResponse = await axios.get(`${pocketbaseUrl}/api/settings`);
          
          // If we reach here without error, we're not in setup mode
          log('❌ PocketBase is already initialized but the admin account does not match the credentials');
          throw new Error('PocketBase is already initialized. You need to use the existing admin credentials or reset PocketBase.');
        } catch (setupError) {
          // If we get a 404 here, we're likely in setup mode
          if (setupError.response && setupError.response.status === 404) {
            log('PocketBase appears to be in setup mode. Attempting to create the admin account...');
            
            try {
              // Create the admin account
              const setupResponse = await axios.post(`${pocketbaseUrl}/api/admins`, {
                email: adminEmail,
                password: adminPassword,
                passwordConfirm: adminPassword
              });
              
              if (setupResponse.status === 200) {
                log('✅ Admin account created successfully');
                
                // Now authenticate to get the token
                const authResponse = await axios.post(`${pocketbaseUrl}/api/admins/auth-with-password`, {
                  identity: adminEmail,
                  password: adminPassword
                });
                
                if (authResponse.status === 200 && authResponse.data && authResponse.data.token) {
                  log('✅ Authenticated with the new admin account');
                  return authResponse.data.token;
                }
              }
            } catch (createError) {
              log(`❌ Failed to create admin account: ${createError.message}`);
              if (createError.response && createError.response.data) {
                log(`Error details: ${JSON.stringify(createError.response.data)}`);
              }
              throw new Error('Failed to create admin account. PocketBase may not be in setup mode.');
            }
          } else {
            log(`❌ Unexpected error checking setup mode: ${setupError.message}`);
            throw setupError;
          }
        }
      }
    }
    
    throw new Error('Could not initialize admin account');
  } catch (error) {
    log(`❌ Admin initialization failed: ${error.message}`);
    throw error;
  }
}

async function createUserProfilesCollection(token) {
  try {
    log('Creating or updating user_profiles collection...');
    
    // First check if the collection already exists
    try {
      const checkResponse = await axios.get(`${pocketbaseUrl}/api/collections/user_profiles`, {
        headers: { 'Authorization': token }
      });
      
      if (checkResponse.status === 200) {
        log('User profiles collection already exists, skipping creation');
        return;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log('User profiles collection does not exist, creating it now');
      } else {
        throw error;
      }
    }
    
    // Create the collection
    const createResponse = await axios.post(`${pocketbaseUrl}/api/collections`, {
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
    }, {
      headers: { 'Authorization': token }
    });
    
    if (createResponse.status === 200) {
      log('✅ User profiles collection created successfully');
      
      // Configure collection permissions
      const collectionId = createResponse.data.id;
      const permissionsResponse = await axios.patch(`${pocketbaseUrl}/api/collections/${collectionId}`, {
        listRule: '@request.auth.id != ""',        // Only authenticated users can list
        viewRule: '@request.auth.id = user.id',    // Users can only view their own profiles
        createRule: '@request.auth.id != ""',      // Only authenticated users can create
        updateRule: '@request.auth.id = user.id',  // Users can only update their own profiles
        deleteRule: '@request.auth.id = user.id'   // Users can only delete their own profiles
      }, {
        headers: { 'Authorization': token }
      });
      
      if (permissionsResponse.status === 200) {
        log('✅ User profiles permissions configured successfully');
      } else {
        log('❌ Failed to configure user profiles permissions');
      }
    } else {
      log('❌ Failed to create user profiles collection');
    }
  } catch (error) {
    log(`❌ Error creating user profiles collection: ${error.message}`);
    if (error.response && error.response.data) {
      log(`Error details: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function main() {
  try {
    log('Starting PocketBase initialization...');
    
    // Check if PocketBase is running
    const isHealthy = await checkPocketBaseHealth();
    if (!isHealthy) {
      log('❌ PocketBase is not running. Please start PocketBase before running this script.');
      return;
    }
    
    // Initialize admin
    const token = await initializeAdmin();
    if (!token) {
      log('❌ Failed to get admin token');
      return;
    }
    
    // Create collections
    await createUserProfilesCollection(token);
    
    log('✅ PocketBase initialization completed successfully');
  } catch (error) {
    log(`❌ Initialization failed: ${error.message}`);
  } finally {
    logStream.end();
  }
}

// Run the script
main(); 