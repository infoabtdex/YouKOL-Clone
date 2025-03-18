# PocketBase Setup Guide

This guide will help you set up and run PocketBase for the YouKOL-Clone application.

## Prerequisites

- Windows 10 or higher
- Node.js 14 or higher
- PowerShell

## Setup Steps

### 1. Download and Extract PocketBase

We've already set up a script that downloads and extracts PocketBase for Windows. You can run it with:

```powershell
# From the project root
.\setup-pocketbase.ps1
```

This will:
- Download the latest version of PocketBase for Windows
- Extract it to a directory called `pocketbase_windows`
- Ensure all required directories are created

### 2. Run PocketBase

To run PocketBase manually:

```powershell
# Navigate to the PocketBase directory
cd pocketbase_windows

# Start PocketBase
.\pocketbase.exe serve
```

PocketBase will be accessible at:
- Admin UI: http://127.0.0.1:8090/_/
- API: http://127.0.0.1:8090/api/

### 3. First-time Setup

The first time you run PocketBase, you'll need to create an admin account:

1. Open http://127.0.0.1:8090/_/ in your browser
2. Follow the prompts to create your admin account
3. After logging in, you need to create the following collections:

### Required Collections

#### Users Collection

1. Go to Collections in the admin UI
2. Click "Create Collection"
3. Set name to "users"
4. Select type "Auth collection (API auth)"
5. Add the following fields:
   - `name`: Text field (optional)
   - `isNew`: Boolean field (optional, default to true)
6. Save the collection

#### Preferences Collection

This collection should be created automatically by the migrations, but if not:

1. Go to Collections in the admin UI
2. Click "Create Collection"
3. Set name to "preferences"
4. Select type "Base collection"
5. Add the following fields:
   - `userID`: Relation field (pointing to users collection)
   - `preferences`: JSON field
   - `created`: Date field (auto)
   - `updated`: Date field (auto)
6. Save the collection

### 4. Initialize the Database

We've created a helper script to check and initialize the database:

```powershell
# From the project root
npm run pb:init
```

This will:
- Check if PocketBase is running
- Verify the required collections exist
- Report any issues that need manual intervention

### 5. Start Both PocketBase and the Application

For convenience, we've created a script that starts both PocketBase and the Node.js server:

```powershell
# From the project root
.\start-dev.ps1
```

## Troubleshooting

### Token Validation Errors

If you see errors like `Token validation error: Error: Invalid user identity in token`:

1. Make sure PocketBase is running at http://127.0.0.1:8090
2. Ensure the "users" collection exists in PocketBase
3. Try logging out and logging in again to get a fresh token
4. If you're still seeing issues, run `npm run pb:init` to check your PocketBase setup

### PocketBase Not Starting

If you have issues starting PocketBase:

1. Make sure port 8090 is not in use by another application
2. Check if you have permission to execute the PocketBase executable
3. Look for any error messages in the console

### Database Issues

If you're having database issues:

1. You can reset the PocketBase database by deleting the `pb_data` directory in the `pocketbase_windows` folder
2. Restart PocketBase which will create a fresh database
3. Run through the setup steps again to create your admin account and collections 