# Metro Bundler Fix Script for UbexGo User App
# This script fixes common Metro bundler issues

Write-Host "🔧 UbexGo User App - Metro Bundler Fix" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$appPath = Split-Path -Parent $scriptPath
Set-Location $appPath

Write-Host "📍 Working directory: $appPath" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if Metro is running and kill it
Write-Host "⏹️  Step 1: Stopping any running Metro processes..." -ForegroundColor Yellow
$metroProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*expo*" }
if ($metroProcesses) {
    $metroProcesses | Stop-Process -Force
    Write-Host "   ✅ Stopped running Metro processes" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No Metro processes found" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Set up ADB reverse proxy
Write-Host "🔌 Step 2: Setting up ADB reverse proxy..." -ForegroundColor Yellow
try {
    # Get list of connected devices
    $devices = & adb devices | Select-String "device$" | ForEach-Object { $_.Line.Split()[0] } | Where-Object { $_ -ne "List" }
    
    if ($devices.Count -eq 0) {
        Write-Host "   ⚠️  No devices/emulators connected" -ForegroundColor Red
        Write-Host "      Please start an Android emulator or connect a device" -ForegroundColor Gray
    } elseif ($devices.Count -eq 1) {
        & adb reverse tcp:8081 tcp:8081
        Write-Host "   ✅ ADB reverse proxy set for $($devices[0])" -ForegroundColor Green
    } else {
        # Multiple devices - set up for all
        Write-Host "   ℹ️  Found $($devices.Count) devices/emulators" -ForegroundColor Yellow
        foreach ($device in $devices) {
            & adb -s $device reverse tcp:8081 tcp:8081
            Write-Host "   ✅ ADB reverse proxy set for $device" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ⚠️  Could not set ADB reverse (device might not be connected)" -ForegroundColor Red
    Write-Host "      Make sure your Android device/emulator is connected" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Clear Metro cache and Android build
Write-Host "🧹 Step 3: Clearing Metro bundler cache and Android build..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
    Write-Host "   ✅ Cleared .expo directory" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared Android .gradle directory" -ForegroundColor Green
}
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared Android app build directory" -ForegroundColor Green
}
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared Android build directory" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clear watchman (if installed)
Write-Host "👁️  Step 4: Clearing Watchman cache (if available)..." -ForegroundColor Yellow
try {
    & watchman watch-del-all 2>$null
    Write-Host "   ✅ Watchman cache cleared" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️  Watchman not installed (optional)" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Start Metro with clean cache
Write-Host "🚀 Step 5: Starting Metro bundler with clean cache..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "   Metro will start now..." -ForegroundColor Cyan
Write-Host "   Press 'a' to run on Android" -ForegroundColor Cyan
Write-Host "   Press 'r' to reload" -ForegroundColor Cyan
Write-Host "   Press 'Ctrl+C' to stop" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Start Metro
& npx expo start --clear

Write-Host ""
Write-Host "✨ Metro bundler fix script completed!" -ForegroundColor Green

