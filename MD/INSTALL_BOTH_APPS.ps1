# Install Both Apps on Connected Device
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Both Apps on Device" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check device connection
Write-Host "Checking device connection..." -ForegroundColor Yellow
adb devices
Write-Host ""

# Setup ADB reverse for both apps
Write-Host "Setting up ADB port forwarding..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082
adb reverse tcp:8097 tcp:8097
adb reverse tcp:8098 tcp:8098
Write-Host "✓ ADB reverse configured" -ForegroundColor Green
Write-Host ""

# Install User App
Write-Host "Installing User App..." -ForegroundColor Yellow
Set-Location -Path "user-app-standalone/android"
.\gradlew installDebug
Set-Location -Path "../.."
Write-Host "✓ User App installed" -ForegroundColor Green
Write-Host ""

# Install Driver App
Write-Host "Installing Driver App..." -ForegroundColor Yellow
Set-Location -Path "driver-app-standalone/android"
.\gradlew installDebug
Set-Location -Path "../.."
Write-Host "✓ Driver App installed" -ForegroundColor Green
Write-Host ""

# Configure Metro ports for both apps
Write-Host "Configuring Metro ports..." -ForegroundColor Yellow
adb shell "run-as com.obidovbek94.UbexGoUser sh -c 'mkdir -p /data/data/com.obidovbek94.UbexGoUser/files && echo \"localhost:8081\" > /data/data/com.obidovbek94.UbexGoUser/files/metro_host'" 2>$null
adb shell "run-as com.obidovbek94.UbexGoDriver sh -c 'mkdir -p /data/data/com.obidovbek94.UbexGoDriver/files && echo \"localhost:8082\" > /data/data/com.obidovbek94.UbexGoDriver/files/metro_host'" 2>$null
Write-Host "✓ Metro ports configured" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open PowerShell window 1: Run .\START_USER_APP.ps1" -ForegroundColor White
Write-Host "2. Open PowerShell window 2: Run .\START_DRIVER_APP.ps1" -ForegroundColor White
Write-Host "3. Open both apps on your device" -ForegroundColor White
Write-Host ""
Write-Host "If apps get stuck, run: .\FIX_METRO_PORTS.ps1" -ForegroundColor Yellow
Write-Host ""

