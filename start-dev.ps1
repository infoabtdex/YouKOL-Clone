# PowerShell script to start PocketBase and the Node.js server

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int] $Port
    )
    
    $result = netstat -ano | Select-String "[:.]$Port\s+.*LISTENING"
    return $null -ne $result
}

# Check if PocketBase is already running
$pbPortInUse = Test-PortInUse -Port 8090
if ($pbPortInUse) {
    Write-Host "PocketBase is already running on port 8090" -ForegroundColor Green
} else {
    # Start PocketBase in a new window
    Write-Host "Starting PocketBase..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\pocketbase_windows'; .\pocketbase.exe serve"
    
    # Wait for PocketBase to start
    Write-Host "Waiting for PocketBase to start..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 30
    $pbStarted = $false
    
    while (-not $pbStarted -and $attempts -lt $maxAttempts) {
        $attempts++
        Start-Sleep -Seconds 1
        $pbPortInUse = Test-PortInUse -Port 8090
        if ($pbPortInUse) {
            $pbStarted = $true
        }
    }
    
    if ($pbStarted) {
        Write-Host "PocketBase started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to detect PocketBase startup after $maxAttempts attempts." -ForegroundColor Red
        Write-Host "Please check if PocketBase is running manually." -ForegroundColor Red
    }
}

# Initialize PocketBase collections
Write-Host "Initializing PocketBase collections..." -ForegroundColor Yellow
npm run pb:init

# Start the Node.js server
Write-Host "Starting Node.js server..." -ForegroundColor Yellow
npm run dev 