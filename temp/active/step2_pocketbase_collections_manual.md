# Step 2: Create PocketBase Collections - Manual Implementation

Since we're having some issues with the programmatic setup, let's implement the collections manually through the PocketBase Admin UI.

## Overview

For the authentication system, we need to set up the following collections:

1. **Users** (extend PocketBase's built-in collection)
2. **User Profiles** (create a custom collection with relation to Users)

## Manual Implementation Steps

### 1. Access the PocketBase Admin UI

1. Ensure PocketBase is running
2. Access the Admin UI at `http://127.0.0.1:8090/_/`
3. Log in with your admin credentials

### 2. Customize Users Collection

1. Click on the "users" collection in the left sidebar
2. Go to the "Schema" tab
3. Click "Add field" and add a new field:
   - Name: "avatar"
   - Type: File
   - Required: No
   - Max file size: 5MB
   - Allow only images (mime types: image/jpg, image/jpeg, image/png, image/gif)
4. Click "Save changes"

### 3. Create User Profiles Collection

1. Click the "New collection" button in the left sidebar
2. Name: "user_profiles"
3. Type: Base Collection
4. Click "Create"
5. In the Schema tab, add the following fields:

   **user** (relation to Users)
   - Type: Relation
   - Required: Yes
   - Collection: users
   - Cascade delete: Yes
   - Max select: 1
   - Min select: 1

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

6. Click "Save changes"

### 4. Configure Collection Permissions

1. Click on the "user_profiles" collection
2. Go to the "Rules" tab
3. Set the following rules:
   - List rule: `@request.auth.id != ""`
   - View rule: `@request.auth.id = user.id`
   - Create rule: `@request.auth.id != ""`
   - Update rule: `@request.auth.id = user.id`
   - Delete rule: `@request.auth.id = user.id`
4. Click "Save changes"

## Verification

After creating the collections manually, you can verify they were set up correctly by:

1. Checking that all fields exist with the correct types and options
2. Verifying the relation between the Users and User Profiles collections
3. Confirming the permission rules are set correctly

## Next Steps

After manually setting up the PocketBase collections, proceed to [Step 3: Implement PocketBase Service](./step3_pocketbase_service.md) to expand the service layer with complete authentication methods. 