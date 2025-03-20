# Step 2: Create PocketBase Collections - Implementation

This document provides detailed information about the implementation of Step 2: Create PocketBase Collections for the YouKOL Clone project.

## Overview

For the authentication system, we've set up the following collections:

1. **Users** (extended PocketBase's built-in collection)
2. **User Profiles** (created a custom collection with relation to Users)

## Implementation Details

### 1. Created a Collections Setup Script

We've created a script at `setup/collections.js` that programmatically sets up all required collections. The script:

- Connects to the PocketBase instance
- Authenticates as an administrator
- Updates the Users collection with an avatar field
- Creates a User Profiles collection with all necessary fields
- Configures appropriate permissions for the collections

### 2. Users Collection Customization

The built-in Users collection has been extended with:

- **avatar** (file field): Allows users to upload profile pictures
  - Max file size: 5MB
  - Allowed types: jpg, jpeg, png, gif

### 3. User Profiles Collection

A new User Profiles collection has been created with the following fields:

- **user** (relation field to Users collection)
  - One-to-one relationship with cascade delete
  - Required field
- **display_name** (text field)
  - Required
  - Min length: 1
  - Max length: 100
- **bio** (text field)
  - Optional
  - Max length: 500
- **onboarding_completed** (boolean field)
  - Required
  - Default: false
- **usage_frequency** (select field)
  - Options: daily, weekly, monthly, rarely
  - Optional
- **content_types** (json field)
  - For storing user's preferred content types
  - Optional
- **preferences** (json field)
  - For storing user's enhancement preferences
  - Optional

### 4. Collection Permissions

Permissions have been configured to ensure data security:

- **Users Collection** (default PocketBase permissions)
  - Public authentication
  - Users can only view and update their own records

- **User Profiles Collection**
  - Only authenticated users can create profiles
  - Users can only view, update, and delete their own profiles
  - The relation ensures cascade delete if a user is deleted

## Running the Setup

To set up the collections, run:

```bash
npm run setup-collections
```

This command executes the setup script which creates and configures all the necessary collections in PocketBase.

## Verification

You can verify the collections were created correctly by:

1. Checking the logs in `logs/collections-setup.log`
2. Visiting the PocketBase Admin UI at `http://127.0.0.1:8090/_/`
3. Viewing the collections in the Admin UI
4. Checking that all fields and permissions are correctly configured

## Next Steps

After setting up the PocketBase collections, proceed to [Step 3: Implement PocketBase Service](./step3_pocketbase_service.md) to expand the service layer with complete authentication methods. 