# Driver App - Quick Reference

## ⚡ Build Commands

```powershell
# Interactive build
.\build-apk.ps1

# Direct builds
cd android
.\gradlew.bat assembleDebug     # Debug APK
.\gradlew.bat assembleRelease   # Release APK
.\gradlew.bat bundleRelease     # AAB for Play Store
.\gradlew.bat clean             # Clean build
```

## 📍 APK Locations

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔑 Keystore (Dev Only)

- File: `android/app/ubexgo-driver-release.keystore`
- Password: `driver123`
- Alias: `ubexgo-driver-key`

## 📱 Install APK

```bash
adb devices
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 📋 First Build

```bash
# Already done:
# - npm install ✓
# - npx expo prebuild ✓
# - Signing configured ✓

# Just build:
.\build-apk.ps1
```

## 🔧 Troubleshooting

```bash
cd android && .\gradlew.bat clean  # Clean build
```

---

**Package**: `com.obidovbek94.UbexGoDriver` | **Standalone Project** ✨
