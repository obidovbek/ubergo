# Setup Android SDK for UbexGo User App
# This script configures the Android SDK path

Write-Host "======================================" -ForegroundColor Green
Write-Host "   Android SDK Setup Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Common Android SDK locations
$commonPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT"
)

Write-Host "Searching for Android SDK..." -ForegroundColor Cyan

$sdkPath = $null

# Check common paths
foreach ($path in $commonPaths) {
    if ($path -and (Test-Path $path)) {
        Write-Host "Found Android SDK at: $path" -ForegroundColor Green
        $sdkPath = $path
        break
    }
}

# If not found, ask user
if (-not $sdkPath) {
    Write-Host ""
    Write-Host "Android SDK not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please enter the path to your Android SDK:" -ForegroundColor Yellow
    Write-Host "Example: C:\Users\YourName\AppData\Local\Android\Sdk" -ForegroundColor Gray
    Write-Host ""
    
    $sdkPath = Read-Host "SDK Path"
    
    if (-not (Test-Path $sdkPath)) {
        Write-Host ""
        Write-Host "✗ Invalid path: $sdkPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please ensure Android SDK is installed:" -ForegroundColor Yellow
        Write-Host "1. Install Android Studio from https://developer.android.com/studio" -ForegroundColor Gray
        Write-Host "2. Or install Android Command Line Tools" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "Using Android SDK: $sdkPath" -ForegroundColor Cyan

# Escape backslashes for properties file
$escapedPath = $sdkPath -replace '\\', '\\'

# Create local.properties file
$localPropertiesPath = "$PSScriptRoot\android\local.properties"
$content = @"
## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the android SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.
sdk.dir=$escapedPath
"@

$content | Out-File -FilePath $localPropertiesPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✓ Created local.properties file" -ForegroundColor Green

# Check for required Android SDK components
Write-Host ""
Write-Host "Checking Android SDK components..." -ForegroundColor Cyan

$platformsPath = Join-Path $sdkPath "platforms\android-35"
$buildToolsPath = Join-Path $sdkPath "build-tools\35.0.0"

$missingComponents = @()

if (-not (Test-Path $platformsPath)) {
    $missingComponents += "Android SDK Platform 35"
}

if (-not (Test-Path $buildToolsPath)) {
    $missingComponents += "Android SDK Build-Tools 35.0.0"
}

if ($missingComponents.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠ Missing required components:" -ForegroundColor Yellow
    foreach ($component in $missingComponents) {
        Write-Host "  - $component" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Install missing components using Android Studio SDK Manager" -ForegroundColor Yellow
    Write-Host "or run: sdkmanager 'platforms;android-35' 'build-tools;35.0.0'" -ForegroundColor Gray
} else {
    Write-Host "✓ All required components are installed" -ForegroundColor Green
}

# Set environment variable if not set
if (-not $env:ANDROID_HOME) {
    Write-Host ""
    Write-Host "Setting ANDROID_HOME environment variable..." -ForegroundColor Cyan
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    $env:ANDROID_HOME = $sdkPath
    Write-Host "✓ ANDROID_HOME set to: $sdkPath" -ForegroundColor Green
    Write-Host "  (Restart your terminal for changes to take effect)" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✓ ANDROID_HOME is already set: $env:ANDROID_HOME" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\build-apk.ps1" -ForegroundColor Gray
Write-Host "2. Or: cd android && .\gradlew.bat assembleDebug" -ForegroundColor Gray
Write-Host ""



