# Test script for profile API

Write-Host "1. Testing registration..." -ForegroundColor Cyan

$regBody = @{
    email = "test4@example.com"
    username = "testuser4"
    password = "password123"
    passwordConfirm = "password123"
} | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/register' -Method POST -Body $regBody -ContentType 'application/json'
    Write-Host "Registration successful. Status: $($regResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($regResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Registration failed: $_" -ForegroundColor Red
}

Write-Host "`n2. Testing login..." -ForegroundColor Cyan

$loginBody = @{
    identity = "test4@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json' -SessionVariable session
    Write-Host "Login successful. Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($loginResponse.Content)" -ForegroundColor Gray
    
    # Save cookies for future requests
    $cookies = $session.Cookies.GetCookies("http://localhost:3000")
    Write-Host "Session cookie: $($cookies | ForEach-Object { "$($_.Name)=$($_.Value)" })" -ForegroundColor Yellow
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
}

Write-Host "`n3. Testing get profile..." -ForegroundColor Cyan

try {
    $profileResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/profile' -Method GET -WebSession $session
    Write-Host "Get profile successful. Status: $($profileResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($profileResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Get profile failed: $_" -ForegroundColor Red
}

Write-Host "`n4. Testing update profile..." -ForegroundColor Cyan

$updateBody = @{
    displayName = "Updated Test User"
    bio = "This is a test bio"
    preferences = @{
        theme = "dark"
        notifications = $true
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/profile' -Method PUT -Body $updateBody -ContentType 'application/json' -WebSession $session
    Write-Host "Update profile successful. Status: $($updateResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($updateResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Update profile failed: $_" -ForegroundColor Red
}

Write-Host "`n5. Testing onboarding completion..." -ForegroundColor Cyan

$onboardingBody = @{
    completed = $true
    preferences = @{
        introSeen = $true
        welcomeTourCompleted = $true
    }
    steps = @("intro", "profile", "preferences")
} | ConvertTo-Json

try {
    $onboardingResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/profile/onboarding' -Method POST -Body $onboardingBody -ContentType 'application/json' -WebSession $session
    Write-Host "Onboarding update successful. Status: $($onboardingResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($onboardingResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Onboarding update failed: $_" -ForegroundColor Red
}

Write-Host "`n6. Testing onboarding status..." -ForegroundColor Cyan

try {
    $statusResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/profile/onboarding/status' -Method GET -WebSession $session
    Write-Host "Onboarding status check successful. Status: $($statusResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($statusResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Onboarding status check failed: $_" -ForegroundColor Red
}

Write-Host "`n7. Testing logout..." -ForegroundColor Cyan

try {
    $logoutResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/logout' -Method POST -WebSession $session
    Write-Host "Logout successful. Status: $($logoutResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($logoutResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Logout failed: $_" -ForegroundColor Red
}

Write-Host "`nAll tests completed." -ForegroundColor Cyan 