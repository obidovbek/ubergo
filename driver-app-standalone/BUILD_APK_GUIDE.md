# UbexGo Driver App - APK Build Guide

Complete guide for building Android APK files locally for the UbexGo Driver App.

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18+) - https://nodejs.org/
2. **JDK** (v17+) - https://adoptium.net/
3. **Android SDK** - via Android Studio or Command Line Tools
4. **Android SDK Components**:
   - Android SDK Platform 36
   - Android SDK Build-Tools 36.0.0

### Environment Variables

Set `ANDROID_HOME` to your Android SDK location:
- Windows: `C:\Users\YourName\AppData\Local\Android\Sdk`
- Mac: `~/Library/Android/sdk`
- Linux: `~/Android/Sdk`

## 🚀 Build APK

### Method 1: Interactive Script (Recommended)

```powershell
.\build-apk.ps1
```

Choose:
1. Debug APK (~50MB, includes debugging)
2. Release APK (~25MB, optimized)
3. Both APKs

### Method 2: Direct Gradle Commands

```bash
# Debug APK
cd android
.\gradlew.bat assembleDebug

# Release APK
cd android
.\gradlew.bat assembleRelease

# Clean
cd android
.\gradlew.bat clean
```

## 📦 Output Locations

- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`

## 🔐 Signing Configuration

### Development Keystore (Current)

| Property | Value |
|----------|-------|
| **Keystore** | `android/app/ubexgo-driver-release.keystore` |
| **Store Password** | `driver123` |
| **Key Alias** | `ubexgo-driver-key` |
| **Key Password** | `driver123` |

⚠️ **For production, generate a secure keystore!**

### Generate Production Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore production.keystore \
  -alias production-key \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Update `android/app/build.gradle`:
```gradle
release {
    storeFile file('production.keystore')
    storePassword 'YOUR_SECURE_PASSWORD'
    keyAlias 'production-key'
    keyPassword 'YOUR_SECURE_PASSWORD'
}
```

## 📱 Install APK

### Using ADB

```bash
# List devices
adb devices

# Install debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Install release
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Replace existing
adb install -r <path-to-apk>

# Uninstall
adb uninstall com.obidovbek94.UbexGoDriver
```

### Manual Installation

1. Copy APK to device
2. Enable "Install from Unknown Sources"
3. Tap APK file → Install

## 🛠️ Build Configuration

### App Version

Update in `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // Semantic version
}
```

### Build Optimizations

- ✅ **Hermes Engine**: Enabled
- ✅ **New Architecture**: Enabled
- ✅ **Edge-to-Edge**: Enabled
- ✅ **Firebase**: Integrated
- ✅ **Google Sign-In**: Configured

### Target Architectures

Default: `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`

Build for specific architecture:
```bash
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

## 🐛 Troubleshooting

### ANDROID_HOME not set
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\Bekzod\AppData\Local\Android\Sdk', 'User')
```

### SDK location not found
Create `android/local.properties`:
```properties
sdk.dir=C:\\Users\\Bekzod\\AppData\\Local\\Android\\Sdk
```

### Build failed
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### Missing SDK components
Install via Android Studio SDK Manager:
- Android SDK Platform 36
- Android SDK Build-Tools 36.0.0

### Out of memory
Increase heap in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## 📊 Build Variants

| Type | Size | Build Time | Purpose |
|------|------|------------|---------|
| **Debug** | ~50MB | ~4-5 min | Development, Testing |
| **Release** | ~25MB | ~5-6 min | Production, Distribution |

## 🎯 For Google Play Store

### Build AAB (Recommended)
```bash
cd android
.\gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Checklist
- [ ] Production keystore
- [ ] Update version code/name
- [ ] Enable ProGuard/R8
- [ ] Test thoroughly
- [ ] Build AAB (not APK)

## 📚 Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Android Developer Guide](https://developer.android.com/)
- [Gradle Build Tool](https://gradle.org/)

---

**Ready to build! Run `.\build-apk.ps1` 🚀**

