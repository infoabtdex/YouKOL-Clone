# PocketBase Setup Script for Windows

# Variables
$pocketbaseVersion = "0.25.9"
$downloadUrl = "https://github.com/pocketbase/pocketbase/releases/download/v$pocketbaseVersion/pocketbase_${pocketbaseVersion}_windows_amd64.zip"
$zipFile = "pocketbase_windows.zip"
$extractDir = "pocketbase_windows"

# Create extraction directory if it doesn't exist
if (-not (Test-Path $extractDir)) {
    New-Item -ItemType Directory -Force -Path $extractDir
    Write-Host "Created directory: $extractDir"
}

# Download PocketBase
Write-Host "Downloading PocketBase v$pocketbaseVersion..."
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Download complete!"
} catch {
    Write-Host "Failed to download PocketBase: $_"
    exit 1
}

# Extract the ZIP file
Write-Host "Extracting PocketBase..."
try {
    Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force
    Write-Host "Extraction complete!"
} catch {
    Write-Host "Failed to extract PocketBase: $_"
    exit 1
}

# Ensure the pb_data and pb_migrations directories exist
if (-not (Test-Path "pb_data")) {
    New-Item -ItemType Directory -Force -Path "pb_data"
    Write-Host "Created directory: pb_data"
}

if (-not (Test-Path "pb_migrations")) {
    New-Item -ItemType Directory -Force -Path "pb_migrations"
    Write-Host "Created directory: pb_migrations"
}

# Copy pb_data and pb_migrations if they already exist in the project root
if (Test-Path "pb_data") {
    Copy-Item -Path "pb_data\*" -Destination "$extractDir\pb_data\" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Copied existing pb_data directory"
}

if (Test-Path "pb_migrations") {
    Copy-Item -Path "pb_migrations\*" -Destination "$extractDir\pb_migrations\" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Copied existing pb_migrations directory"
}

Write-Host "`nPocketBase setup complete!`n"
Write-Host "To start PocketBase, run the following command:"
Write-Host "cd $extractDir"
Write-Host ".\pocketbase.exe serve"
Write-Host "`nPocketBase will be accessible at http://127.0.0.1:8090" 