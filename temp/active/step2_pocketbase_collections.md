# Step 2: Create PocketBase Collections

This document provides detailed instructions for creating and configuring the necessary PocketBase collections for the YouKOL Clone project.

## Collection Structure Overview

For the authentication system, we need to set up the following collections:

1. **Users** (extends PocketBase's built-in collection)
2. **User Profiles** (custom collection with relation to Users)

## 1. Configure Users Collection

PocketBase already has a built-in Users collection, but we'll customize it for our needs.

### Required Fields (Already Present)

- **id** (system field)
- **created** (system field)
- **updated** (system field)
- **username** (text field)
- **email** (text field)
- **emailVisibility** (boolean field)
- **verified** (boolean field)

### Custom Fields to Add

- **avatar** (file field, optional) - For user profile pictures

## 2. Create User Profiles Collection

The User Profiles collection will store additional information about users.

### Collection Schema

- **id** (system field)
- **created** (system field)
- **updated** (system field)
- **user** (relation field to Users collection, required)
- **display_name** (text field, required) - User's display name
- **bio** (text field, optional) - User's bio or description
- **onboarding_completed** (boolean field, default: false) - Track if the user has completed onboarding
- **usage_frequency** (select field, options: daily, weekly, monthly, rarely)
- **content_types** (json field) - Types of content the user works with
- **preferences** (json field) - User's enhancement preferences

## Collection Setup Instructions

There are two ways to create these collections:

1. Through the PocketBase Admin UI (recommended for development)
2. Programmatically using PocketBase's Admin API (for production deployment)

### Option 1: Using PocketBase Admin UI

1. Start your PocketBase instance
2. Access the Admin UI at `http://127.0.0.1:8090/_/`
3. Log in with your admin credentials
4. Navigate to the "Collections" section

#### Customize Users Collection

1. Click on the "users" collection
2. Go to the "Schema" tab
3. Add a new field:
   - Name: "avatar"
   - Type: File
   - Required: No
   - Options: Max file size: 5MB, Allow only images
4. Click "Save Changes"

#### Create User Profiles Collection

1. Click "Create Collection"
2. Name: "user_profiles"
3. Type: Base Collection
4. Click "Create"
5. Add the following fields:

   **user** (relation to Users)
   - Type: Relation
   - Required: Yes
   - Options:
     - Collection: users
     - Relation Type: One-to-One

   **display_name**
   - Type: Text
   - Required: Yes
   - Min length: 1
   - Max length: 100

   **bio**
   - Type: Text
   - Required: No
   - Max length: 500

   **onboarding_completed**
   - Type: Boolean
   - Required: Yes
   - Default: false

   **usage_frequency**
   - Type: Select
   - Required: No
   - Options: daily, weekly, monthly, rarely

   **content_types**
   - Type: JSON
   - Required: No

   **preferences**
   - Type: JSON
   - Required: No

6. Click "Save Changes"

### Option 2: Programmatic Setup using Admin API

Create a script to programmatically set up the collections:

```javascript
// setup/collections.js
const PocketBase = require('pocketbase/cjs');
const dotenv = require('dotenv');

dotenv.config();

async function setupCollections() {
  const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
  
  // Admin authentication
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
    console.log('Admin authenticated');
    
    // Update Users collection
    await updateUsersCollection(pb);
    
    // Create User Profiles collection
    await createUserProfilesCollection(pb);
    
    console.log('Collections setup completed successfully');
  } catch (error) {
    console.error('Failed to set up collections:', error);
  }
}

async function updateUsersCollection(pb) {
  try {
    const usersCollection = await pb.collections.getOne('users');
    
    // Prepare schema updates for Users collection
    const schema = [...usersCollection.schema];
    
    // Check if avatar field already exists
    const avatarFieldExists = schema.some(field => field.name === 'avatar');
    
    if (!avatarFieldExists) {
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
      
      console.log('Users collection updated with avatar field');
    } else {
      console.log('Avatar field already exists in Users collection');
    }
  } catch (error) {
    console.error('Failed to update Users collection:', error);
    throw error;
  }
}

async function createUserProfilesCollection(pb) {
  try {
    // Check if collection already exists
    try {
      await pb.collections.getOne('user_profiles');
      console.log('User Profiles collection already exists');
      return;
    } catch (error) {
      // Collection doesn't exist, proceed with creation
    }
    
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
    
    console.log('User Profiles collection created successfully');
  } catch (error) {
    console.error('Failed to create User Profiles collection:', error);
    throw error;
  }
}

// Run the setup function
setupCollections().then(() => {
  console.log('Setup completed');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
```

## 3. Configure Collection Permissions

Set the appropriate permissions for each collection:

### Users Collection (Default Permissions)

- **Authenticate with password** - Public
- **Create/signup** - Public
- **View own record** - Authenticated users
- **Update own record** - Authenticated users
- **Delete own record** - Authenticated users

### User Profiles Collection

- **Create** - Authenticated users
- **View own** - Authenticated users
- **Update own** - Authenticated users
- **Delete own** - Authenticated users

## 4. Create an NPM Script to Run the Collection Setup

Update the `package.json` file to include a script to run the collection setup:

```json
{
  "scripts": {
    // ...existing scripts
    "setup-collections": "node setup/collections.js"
  }
}
```

## Next Steps

After setting up the PocketBase collections, proceed to [Step 3: Implement PocketBase Service](./step3_pocketbase_service.md) to create the necessary service methods for authentication and user management. 