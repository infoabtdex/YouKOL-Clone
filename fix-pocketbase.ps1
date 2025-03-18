# PowerShell script to fix all PocketBase issues
Write-Host "=== FIXING POCKETBASE INTEGRATION ===" -ForegroundColor Cyan
Write-Host "This script will fix known issues with PocketBase" -ForegroundColor Cyan

# Check if PocketBase is running
function Test-PortInUse {
    param(
        [int] $Port
    )
    
    $result = netstat -ano | Select-String "[:.]$Port\s+.*LISTENING"
    return $null -ne $result
}

# Step 1: Check PocketBase connection
$pbRunning = Test-PortInUse -Port 8090
if (-not $pbRunning) {
    Write-Host "❌ PocketBase is not running on port 8090" -ForegroundColor Red
    
    # Ask if they want to start PocketBase
    $startPB = Read-Host "Do you want to start PocketBase now? (y/n)"
    if ($startPB -eq "y") {
        Write-Host "Starting PocketBase..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\pocketbase_windows'; .\pocketbase.exe serve"
        
        # Wait for PocketBase to start
        Write-Host "Waiting for PocketBase to start..." -ForegroundColor Yellow
        $attempts = 0
        $maxAttempts = 10
        $pbStarted = $false
        
        while (-not $pbStarted -and $attempts -lt $maxAttempts) {
            $attempts++
            Start-Sleep -Seconds 1
            $pbStarted = Test-PortInUse -Port 8090
        }
        
        if ($pbStarted) {
            Write-Host "✅ PocketBase started successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start PocketBase" -ForegroundColor Red
            Write-Host "Please start PocketBase manually and try again" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please start PocketBase manually and try again" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ PocketBase is running on port 8090" -ForegroundColor Green
}

# Step 2: Test HTTP connection
Write-Host "`nTesting HTTP connection to PocketBase..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8090/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ PocketBase HTTP connection successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to PocketBase via HTTP" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please check if PocketBase is running correctly and try again" -ForegroundColor Red
    exit 1
}

# Step 3: Setup PocketBase Admin in the UI
Write-Host "`nPocketBase Admin Setup Instructions" -ForegroundColor Yellow
Write-Host "1. Open http://127.0.0.1:8090/_/" -ForegroundColor White
Write-Host "2. Create or log in to your admin account" -ForegroundColor White
Write-Host "3. When logged in, press any key to continue..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 4: Update schema with correct permissions
Write-Host "`nUpdating PocketBase schema with correct permissions..." -ForegroundColor Yellow
Write-Host "Running schema setup script..." -ForegroundColor Yellow

# Get admin credentials
$adminEmail = Read-Host "Enter your PocketBase admin email"
$adminPassword = Read-Host "Enter your PocketBase admin password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variables for the script
$env:PB_ADMIN_EMAIL = $adminEmail
$env:PB_ADMIN_PASSWORD = $plainPassword

# Run the schema setup script
try {
    npm run pb:schema
    Write-Host "✅ PocketBase schema updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update PocketBase schema" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Clear sensitive variables
$env:PB_ADMIN_EMAIL = $null
$env:PB_ADMIN_PASSWORD = $null
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# Step 5: Restart the Node.js server
Write-Host "`nRestarting the Node.js server..." -ForegroundColor Yellow
try {
    # Stop any running Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Start the server
    Write-Host "Starting the server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Write-Host "✅ Server started successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart the server" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nAll fixes have been applied. The application should now work correctly." -ForegroundColor Green
Write-Host "If you still experience issues, please check the logs for more information." -ForegroundColor White 