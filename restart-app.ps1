# PowerShell script to completely restart the application
Write-Host "=== RESTARTING THE APPLICATION ===" -ForegroundColor Cyan
Write-Host "This script will perform a clean restart of the application" -ForegroundColor Cyan

# Stop any running processes
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean the node_modules directory
Write-Host "Cleaning node_modules directory..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Test direct HTTP connection to PocketBase
Write-Host "Testing HTTP connection to PocketBase..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8090/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "PocketBase HTTP connection successful!" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to PocketBase via HTTP. Make sure it's running at http://127.0.0.1:8090" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Ask user if they want to start PocketBase
    $startPB = Read-Host "Do you want to start PocketBase now? (y/n)"
    if ($startPB -eq "y") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\pocketbase_windows'; .\pocketbase.exe serve"
        Write-Host "Waiting for PocketBase to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "Skipping PocketBase startup. Please start it manually." -ForegroundColor Yellow
    }
}

# Initialize PocketBase
Write-Host "Initializing PocketBase..." -ForegroundColor Yellow
npm run pb:init

# Start the application
Write-Host "Starting the application..." -ForegroundColor Green
npm run dev 