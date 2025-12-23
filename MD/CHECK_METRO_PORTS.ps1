# Check which ports are configured for each app
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Metro Port Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check User App
Write-Host "User App Metro Configuration:" -ForegroundColor Yellow
$userPort = adb shell "run-as com.obidovbek94.UbexGoUser cat /data/data/com.obidovbek94.UbexGoUser/files/metro_host 2>/dev/null"
if ($userPort) {
    Write-Host "  Port: $userPort" -ForegroundColor Green
} else {
    Write-Host "  Port: Not configured (will use default 8081)" -ForegroundColor Yellow
}
Write-Host ""

# Check Driver App
Write-Host "Driver App Metro Configuration:" -ForegroundColor Yellow
$driverPort = adb shell "run-as com.obidovbek94.UbexGoDriver cat /data/data/com.obidovbek94.UbexGoDriver/files/metro_host 2>/dev/null"
if ($driverPort) {
    Write-Host "  Port: $driverPort" -ForegroundColor Green
} else {
    Write-Host "  Port: Not configured (will use default 8081)" -ForegroundColor Yellow
}
Write-Host ""

# Check ADB reverse
Write-Host "ADB Reverse Configuration:" -ForegroundColor Yellow
$reverseList = adb reverse --list
if ($reverseList -match "8081") {
    Write-Host "  ✓ Port 8081 forwarded" -ForegroundColor Green
} else {
    Write-Host "  ❌ Port 8081 NOT forwarded" -ForegroundColor Red
}
if ($reverseList -match "8082") {
    Write-Host "  ✓ Port 8082 forwarded" -ForegroundColor Green
} else {
    Write-Host "  ❌ Port 8082 NOT forwarded" -ForegroundColor Red
}
Write-Host ""

# Check if Metro is running
Write-Host "Checking if Metro is running:" -ForegroundColor Yellow
$port8081 = netstat -ano | Select-String ":8081.*LISTENING"
$port8082 = netstat -ano | Select-String ":8082.*LISTENING"

if ($port8081) {
    Write-Host "  ✓ Metro running on port 8081" -ForegroundColor Green
} else {
    Write-Host "  ❌ Metro NOT running on port 8081" -ForegroundColor Red
}

if ($port8082) {
    Write-Host "  ✓ Metro running on port 8082" -ForegroundColor Green
} else {
    Write-Host "  ❌ Metro NOT running on port 8082" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
if ($userPort -match "8081" -and $driverPort -match "8082" -and $port8081 -and $port8082) {
    Write-Host "✓ Everything looks good!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some issues detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To fix, run: .\FIX_METRO_PORTS.ps1" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

