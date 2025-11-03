# UbexGo Driver App - Standalone Build

This is a standalone version of the UbexGo Driver App, configured for local APK building with Gradle.

## 🚀 Quick Start

### Build APK
```powershell
.\build-apk.ps1
```

### Install on Device
```bash
# List devices
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 📦 APK Locations

- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`

## 🔐 Signing Configuration (Development)

- **Keystore**: `android/app/ubexgo-driver-release.keystore`
- **Passwords**: `driver123`

⚠️ **Generate your own secure keystore for production!**

## 📚 Documentation

- **[BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md)** - Complete build guide
- **[BUILD_APK_QUICK_REFERENCE.md](./BUILD_APK_QUICK_REFERENCE.md)** - Quick commands
- **[APK_BUILD_SUMMARY.md](./APK_BUILD_SUMMARY.md)** - Setup summary

## 📱 App Details

- **Package**: `com.obidovbek94.UbexGoDriver`
- **Version**: 1.0.0
- **React Native**: 0.81.4
- **Expo**: 54.0.21

## 🎯 Build Commands

```bash
# Debug APK
cd android && .\gradlew.bat assembleDebug

# Release APK
cd android && .\gradlew.bat assembleRelease

# Clean
cd android && .\gradlew.bat clean
```

---

**Standalone - No Metro bundler required for release builds! 🚀**

