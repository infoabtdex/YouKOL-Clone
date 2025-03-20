// test/check-pocketbase.js
const PocketBase = require('pocketbase/cjs');
const dotenv = require('dotenv');

dotenv.config();

async function checkPocketBase() {
  console.log('Checking PocketBase setup...');
  
  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  console.log(`PocketBase URL: ${pbUrl}`);
  
  const pb = new PocketBase(pbUrl);
  
  try {
    // Check connection
    console.log('\nTesting connection...');
    await pb.health.check();
    console.log('✅ Connected to PocketBase successfully');
    
    // Check if admin account exists
    console.log('\nChecking admin authentication...');
    try {
      const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
      const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        console.log('❌ Admin credentials missing from env variables');
      } else {
        console.log(`Admin Email (from env): ${adminEmail}`);
        
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('✅ Admin authentication successful');
      }
    } catch (error) {
      console.error('❌ Admin authentication failed:', error.message);
      if (error.status === 404) {
        console.error('The admin account does not exist. You need to create it first.');
        console.error('Visit http://127.0.0.1:8090/_/ and follow the setup instructions');
      }
      if (error.data) {
        console.error('Error details:', error.data);
      }
    }
    
    // Check collections
    console.log('\nChecking collections...');
    try {
      const collections = await pb.collections.getFullList();
      console.log(`Found ${collections.length} collections:`);
      collections.forEach(collection => {
        console.log(`- ${collection.name} (${collection.id})`);
      });
      
      // Check user_profiles collection specifically
      const userProfilesCollection = collections.find(c => c.name === 'user_profiles');
      if (userProfilesCollection) {
        console.log('\nUser profiles collection exists with schema:');
        userProfilesCollection.schema.forEach(field => {
          console.log(`- ${field.name} (${field.type}): ${field.required ? 'Required' : 'Optional'}`);
        });
      } else {
        console.log('\n❌ User profiles collection does not exist');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve collections:', error.message);
      if (error.data) {
        console.error('Error details:', error.data);
      }
    }
  } catch (error) {
    console.error('❌ Failed to connect to PocketBase:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

// Run the check
checkPocketBase(); 