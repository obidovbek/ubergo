# Start User App with Metro on Port 8081
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting UbexGo User App (Port 8081)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to user app directory
Set-Location -Path "user-app-standalone"

# Setup ADB ports
Write-Host "Setting up ADB port forwarding..." -ForegroundColor Yellow
node scripts/setup-ports.js

Write-Host ""
Write-Host "Starting Metro Bundler on port 8081..." -ForegroundColor Yellow
Write-Host "Keep this window open!" -ForegroundColor Green
Write-Host ""

# Start Metro
$env:PORT = "8081"
$env:RCT_METRO_PORT = "8081"
npm run start:dev-client

