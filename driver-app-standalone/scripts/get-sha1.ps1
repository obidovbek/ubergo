# PowerShell Script to Get SHA-1 Fingerprint for Firebase
# This script helps you get the SHA-1 certificate fingerprint needed for Google Sign-In
# Run this script in PowerShell and add the SHA-1 to Firebase Console

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Firebase SHA-1 Fingerprint Generator" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Find Java keytool
$javaPaths = @(
    "C:\Program Files\Java\jdk-21\bin\keytool.exe",
    "C:\Program Files\Java\jdk-17\bin\keytool.exe",
    "C:\Program Files\Java\jdk-11\bin\keytool.exe",
    "C:\Program Files\Java\jdk1.8.0_*\bin\keytool.exe",
    "C:\Program Files (x86)\Java\jdk1.8.0_*\bin\keytool.exe"
)

$keytoolPath = $null
foreach ($path in $javaPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $keytoolPath = $resolved.Path
        break
    }
}

if (-not $keytoolPath) {
    Write-Host "❌ Java keytool not found!" -ForegroundColor Red
    Write-Host "`nPlease install Java JDK:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.oracle.com/java/technologies/downloads/`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found keytool at: $keytoolPath`n" -ForegroundColor Green

# Debug keystore path
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEBUG BUILD SHA-1 (for development)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (Test-Path $debugKeystore) {
    Write-Host "📍 Debug keystore location:" -ForegroundColor Yellow
    Write-Host "   $debugKeystore`n" -ForegroundColor Gray
    
    $output = & $keytoolPath -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android 2>&1
    
    $sha1Line = $output | Select-String "SHA1:"
    if ($sha1Line) {
        $sha1 = $sha1Line.Line -replace ".*SHA1:\s*", ""
        Write-Host "✅ DEBUG SHA-1 Fingerprint:" -ForegroundColor Green
        Write-Host "   $sha1`n" -ForegroundColor White -BackgroundColor DarkGreen
        
        Write-Host "`n📋 Copy this SHA-1 to Firebase Console:" -ForegroundColor Cyan
        Write-Host "   1. Go to https://console.firebase.google.com/" -ForegroundColor Gray
        Write-Host "   2. Select your project: ubexgo-ae910" -ForegroundColor Gray
        Write-Host "   3. Go to Project Settings → Your apps" -ForegroundColor Gray
        Write-Host "   4. Find: com.obidovbek94.UbexGoDriver" -ForegroundColor Gray
        Write-Host "   5. Click 'Add Fingerprint'" -ForegroundColor Gray
        Write-Host "   6. Paste the SHA-1 above" -ForegroundColor Gray
        Write-Host "   7. Download new google-services.json`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Could not extract SHA-1 from keystore" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Debug keystore not found at:" -ForegroundColor Red
    Write-Host "   $debugKeystore" -ForegroundColor Gray
    Write-Host "`n💡 Create it by running:" -ForegroundColor Yellow
    Write-Host "   cd apps/user-app" -ForegroundColor Gray
    Write-Host "   npx expo run:android`n" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RELEASE BUILD SHA-1 (for production)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "To get your release keystore SHA-1:" -ForegroundColor Yellow
Write-Host "1. Locate your release keystore file" -ForegroundColor Gray
Write-Host "2. Run this command:" -ForegroundColor Gray
Write-Host "   & '$keytoolPath' -list -v -keystore 'PATH_TO_YOUR_RELEASE_KEYSTORE' -alias YOUR_ALIAS`n" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "After adding SHA-1 to Firebase:" -ForegroundColor Yellow
Write-Host "1. ✓ Enable Google Sign-In in Firebase Authentication" -ForegroundColor Gray
Write-Host "2. ✓ Download new google-services.json" -ForegroundColor Gray
Write-Host "3. ✓ Replace apps/user-app/google-services.json" -ForegroundColor Gray
Write-Host "4. ✓ Rebuild your app" -ForegroundColor Gray
Write-Host "`nSee GOOGLE_SIGNIN_FIX.md for complete instructions.`n" -ForegroundColor Cyan

Write-Host "========================================`n" -ForegroundColor Cyan

