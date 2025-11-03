# Build APK Script for UbexGo User App
# This script builds both debug and release APKs

Write-Host "======================================" -ForegroundColor Green
Write-Host "   UbexGo User App APK Build Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Navigate to android directory
Set-Location -Path "$PSScriptRoot\android"

# Check if gradlew exists
if (-not (Test-Path ".\gradlew.bat")) {
    Write-Host "Error: gradlew.bat not found!" -ForegroundColor Red
    Write-Host "Run 'npx expo prebuild --platform android' first to generate native files." -ForegroundColor Yellow
    exit 1
}

# Display menu
Write-Host "Select build type:" -ForegroundColor Yellow
Write-Host "1. Debug APK (faster, for testing)"
Write-Host "2. Release APK (optimized, for distribution)"
Write-Host "3. Both Debug and Release APKs"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

function Build-DebugAPK {
    Write-Host ""
    Write-Host "Building Debug APK..." -ForegroundColor Cyan
    .\gradlew.bat assembleDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Debug APK built successfully!" -ForegroundColor Green
        Write-Host "Location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
        
        $apkSize = (Get-Item "app\build\outputs\apk\debug\app-debug.apk").Length / 1MB
        Write-Host "Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✗ Debug APK build failed!" -ForegroundColor Red
        exit 1
    }
}

function Build-ReleaseAPK {
    Write-Host ""
    Write-Host "Building Release APK..." -ForegroundColor Cyan
    .\gradlew.bat assembleRelease
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Release APK built successfully!" -ForegroundColor Green
        Write-Host "Location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow
        
        $apkSize = (Get-Item "app\build\outputs\apk\release\app-release.apk").Length / 1MB
        Write-Host "Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✗ Release APK build failed!" -ForegroundColor Red
        exit 1
    }
}

function Clean-Build {
    Write-Host ""
    Write-Host "Cleaning previous builds..." -ForegroundColor Cyan
    .\gradlew.bat clean
}

# Execute based on choice
switch ($choice) {
    "1" {
        Clean-Build
        Build-DebugAPK
    }
    "2" {
        Clean-Build
        Build-ReleaseAPK
    }
    "3" {
        Clean-Build
        Build-DebugAPK
        Build-ReleaseAPK
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "   Build Process Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Return to project root
Set-Location -Path $PSScriptRoot



