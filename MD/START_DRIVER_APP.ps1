# Start Driver App with Metro on Port 8082
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting UbexGo Driver App (Port 8082)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to driver app directory
Set-Location -Path "driver-app-standalone"

# Setup ADB ports
Write-Host "Setting up ADB port forwarding..." -ForegroundColor Yellow
node scripts/setup-ports.js

Write-Host ""
Write-Host "Starting Metro Bundler on port 8082..." -ForegroundColor Yellow
Write-Host "Keep this window open!" -ForegroundColor Green
Write-Host ""

# Start Metro
$env:PORT = "8082"
$env:RCT_METRO_PORT = "8082"
npm run start:dev-client

