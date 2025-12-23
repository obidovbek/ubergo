# Fix Metro Port Configuration for Both Apps
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Metro Port Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check device connection
Write-Host "Checking device connection..." -ForegroundColor Yellow
$deviceCheck = adb devices 2>&1 | Select-String "device$"
if (-not $deviceCheck) {
    Write-Host "X No device connected!" -ForegroundColor Red
    Write-Host "Please connect your device via USB and enable USB debugging" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK Device connected" -ForegroundColor Green
Write-Host ""

# Setup ADB reverse
Write-Host "Setting up ADB reverse port forwarding..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082
Write-Host "OK ADB reverse configured" -ForegroundColor Green
Write-Host ""

# Set Metro port for User App
Write-Host "Configuring User App Metro port (8081)..." -ForegroundColor Yellow
adb shell "run-as com.obidovbek94.UbexGoUser sh -c 'mkdir -p /data/data/com.obidovbek94.UbexGoUser/files && echo localhost:8081 > /data/data/com.obidovbek94.UbexGoUser/files/metro_host'"
Write-Host "OK User App configured for port 8081" -ForegroundColor Green
Write-Host ""

# Set Metro port for Driver App
Write-Host "Configuring Driver App Metro port (8082)..." -ForegroundColor Yellow
adb shell "run-as com.obidovbek94.UbexGoDriver sh -c 'mkdir -p /data/data/com.obidovbek94.UbexGoDriver/files && echo localhost:8082 > /data/data/com.obidovbek94.UbexGoDriver/files/metro_host'"
Write-Host "OK Driver App configured for port 8082" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Metro is running for both apps" -ForegroundColor White
Write-Host "2. Open User App on device - should connect to port 8081" -ForegroundColor White
Write-Host "3. Open Driver App on device - should connect to port 8082" -ForegroundColor White
Write-Host ""
Write-Host "If apps are still stuck, try:" -ForegroundColor Yellow
Write-Host "- Shake device -> Dev Menu -> Reload" -ForegroundColor White
Write-Host "- Or force stop both apps and reopen them" -ForegroundColor White
Write-Host ""
