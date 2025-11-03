# UbexGo User App - Local APK Build Guide

This guide explains how to build Android APK files locally for the UbexGo User App using Gradle.

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Java Development Kit (JDK)** (v17 or higher)
   - Download from: https://adoptium.net/
   - Set `JAVA_HOME` environment variable
   - Verify: `java -version`

3. **Android SDK**
   - Install via Android Studio: https://developer.android.com/studio
   - Or use Android Command Line Tools

4. **Android SDK Components** (Required)
   - Android SDK Platform 35
   - Android SDK Build-Tools 35.0.0
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

5. **Environment Variables**
   - `ANDROID_HOME` pointing to your Android SDK location
   - Example (Windows): `C:\Users\YourName\AppData\Local\Android\Sdk`
   - Example (Mac): `~/Library/Android/sdk`
   - Example (Linux): `~/Android/Sdk`

### First-Time Setup

If you don't have the native Android folder yet, run:

```bash
npx expo prebuild --platform android
```

This will generate the native Android project files from your Expo configuration.

## 🚀 Quick Start

### Method 1: Using Build Scripts (Recommended)

#### Windows (PowerShell)
```powershell
.\build-apk.ps1
```

#### Linux/Mac
```bash
chmod +x build-apk.sh
./build-apk.sh
```

The script will prompt you to choose:
1. **Debug APK** - Faster build, includes debugging symbols (~50MB)
2. **Release APK** - Optimized, minified, production-ready (~25MB)
3. **Both APKs** - Build both debug and release versions

### Method 2: Using Gradle Commands Directly

#### Build Debug APK
```bash
cd android
./gradlew assembleDebug        # Linux/Mac
gradlew.bat assembleDebug      # Windows
```

#### Build Release APK
```bash
cd android
./gradlew assembleRelease       # Linux/Mac
gradlew.bat assembleRelease     # Windows
```

#### Clean Build
```bash
cd android
./gradlew clean
```

## 📦 Output Locations

After a successful build, find your APK files at:

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

## 🔐 Signing Configuration

### Release Keystore Details (Development)

The project includes a pre-configured release keystore for development:

| Property | Value |
|----------|-------|
| **Keystore file** | `android/app/ubexgo-release.keystore` |
| **Keystore password** | `ubexgo123` |
| **Key alias** | `ubexgo-release-key` |
| **Key password** | `ubexgo123` |

⚠️ **IMPORTANT**: For production releases to Google Play Store, you MUST generate your own secure keystore!

### Generate Production Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-production.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Then update `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('my-production.keystore')
        storePassword 'YOUR_SECURE_PASSWORD'
        keyAlias 'my-key-alias'
        keyPassword 'YOUR_SECURE_PASSWORD'
    }
}
```

⚠️ **Keep your keystore safe!** If you lose it, you cannot update your app on Google Play!

## 🛠️ Build Configuration

### App Version

Update in `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId 'com.obidovbek94.UbexGoUser'
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // User-visible version
}
```

### Build Optimizations

The project is configured with:
- ✅ **Hermes Engine**: Enabled (faster startup, smaller bundle)
- ✅ **New Architecture**: Enabled (React Native's new architecture)
- ✅ **Edge-to-Edge**: Enabled (modern UI)
- ✅ **Firebase**: Integrated with `google-services.json`
- ✅ **Parallel Builds**: Enabled for faster compilation

### Target Architectures

By default, builds for all architectures:
- **armeabi-v7a** (32-bit ARM) - Most devices
- **arm64-v8a** (64-bit ARM) - Modern devices (required by Google Play)
- **x86** (32-bit Intel/AMD) - Emulators
- **x86_64** (64-bit Intel/AMD) - Emulators

To build for specific architectures (smaller APK):

```bash
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

## 🐛 Troubleshooting

### Issue 1: "ANDROID_HOME is not set"

**Solution**: Set the ANDROID_HOME environment variable.

**Windows (PowerShell)**:
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourName\AppData\Local\Android\Sdk', 'User')
```

**Linux/Mac**:
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Issue 2: "SDK location not found"

**Solution**: Run the setup script or manually create `android/local.properties`:

```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

Or run:
```bash
.\setup-android.ps1  # Windows
./setup-android.sh   # Linux/Mac
```

### Issue 3: "Failed to install Android SDK packages"

**Solution**: Install required SDK components via Android Studio:
1. Open Android Studio → SDK Manager
2. Install:
   - Android SDK Platform 35
   - Android SDK Build-Tools 35.0.0

Or use command line:
```bash
sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

### Issue 4: "Execution failed for task ':app:mergeDebugAssets'"

**Solution**: Clean and rebuild:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue 5: "Java heap space" or "Out of memory"

**Solution**: Increase heap size in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Issue 6: Build is very slow

**Solutions**:
- Gradle daemon is already enabled
- Parallel builds are enabled
- Build for specific architecture only:
  ```bash
  ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
  ```

### Issue 7: "No native project found" or "Android folder missing"

**Solution**: Generate native files first:
```bash
npx expo prebuild --platform android
```

### Issue 8: Firebase/Google Services Error

**Solution**: Ensure `google-services.json` is in the project root and properly configured in `app.json`:
```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

## 📱 Installing the APK

### On Physical Device

1. **Enable Developer Options**:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging

3. **Install via ADB**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Or Transfer Manually**:
   - Copy APK to device via USB, email, or cloud
   - Enable "Install from Unknown Sources"
   - Open APK file and tap "Install"

### Using ADB Commands

```bash
# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Replace existing installation
adb install -r path/to/app.apk

# Uninstall app
adb uninstall com.obidovbek94.UbexGoUser
```

## 🔍 Verifying the APK

### Check APK Signature
```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

### Inspect APK Contents
```bash
# Using Android Studio
# Build → Analyze APK → Select your APK

# Or command line
aapt dump badging android/app/build/outputs/apk/release/app-release.apk
```

### Check APK Size
```bash
# Windows
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Linux/Mac
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

## 📊 Build Variants Comparison

| Variant | Purpose | Build Time | Size | Optimization | Debugging |
|---------|---------|-----------|------|--------------|-----------|
| **Debug** | Development & Testing | ~3-4 min | ~50MB | Minimal | ✅ Enabled |
| **Release** | Production Distribution | ~4-6 min | ~25MB | Full | ❌ Disabled |

## 🎯 Expo-Specific Notes

### Rebuilding After Config Changes

After modifying `app.json` or adding native modules, regenerate native files:

```bash
# Clean and regenerate
npx expo prebuild --clean --platform android
```

### Using EAS Build (Alternative)

For cloud builds, you can use Expo's EAS Build service:

```bash
# Preview build (APK)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

See `eas.json` for build profiles.

## 🚀 Building for Google Play Store

### Generate AAB (Android App Bundle)

Google Play requires AAB format (smaller downloads for users):

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Play Store Checklist

- [ ] Use production keystore (not development keystore!)
- [ ] Update `versionCode` and `versionName`
- [ ] Enable ProGuard/R8 for optimization
- [ ] Test release build thoroughly
- [ ] Build AAB instead of APK
- [ ] Sign with upload key (or app signing key)

### Enable ProGuard/R8

In `android/gradle.properties`:
```properties
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

## 📚 Additional Resources

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)
- [Gradle Build Tool](https://gradle.org/guides/)
- [Publishing to Google Play](https://reactnative.dev/docs/signed-apk-android)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 💡 Best Practices

1. **Version Management**
   - Increment `versionCode` for each release
   - Use semantic versioning for `versionName` (e.g., 1.2.3)

2. **Security**
   - Never commit keystores to version control
   - Use environment variables for sensitive data
   - Keep separate keystores for dev/staging/production

3. **Testing**
   - Always test release builds before distribution
   - Test on multiple devices and Android versions
   - Use ProGuard mapping files for crash reports

4. **Optimization**
   - Enable ProGuard/R8 for production
   - Remove unused resources
   - Optimize images and assets
   - Monitor APK/AAB size

5. **Firebase Integration**
   - Ensure `google-services.json` is up to date
   - Test push notifications in release builds
   - Configure Firebase app distribution for beta testing

## 🎓 Common Commands Reference

```bash
# Setup
npx expo prebuild --platform android
.\setup-android.ps1

# Build
.\build-apk.ps1                                    # Interactive build
cd android && .\gradlew.bat assembleDebug         # Debug APK
cd android && .\gradlew.bat assembleRelease       # Release APK
cd android && .\gradlew.bat bundleRelease         # Release AAB

# Clean
cd android && .\gradlew.bat clean

# Install
adb install android/app/build/outputs/apk/release/app-release.apk

# Info
adb devices                                        # List devices
aapt dump badging app-release.apk                 # APK info
```

---

**Ready to build? Run `.\build-apk.ps1` now! 🚀**

For quick reference, see [BUILD_APK_QUICK_REFERENCE.md](./BUILD_APK_QUICK_REFERENCE.md)



