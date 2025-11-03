# UbexGo User App - Quick APK Build Reference

## ⚡ Quick Commands

### Build APK (Interactive)
```powershell
# Windows
.\build-apk.ps1

# Linux/Mac
./build-apk.sh
```

### Build APK (Direct Commands)
```bash
# Debug APK
cd android && gradlew.bat assembleDebug    # Windows
cd android && ./gradlew assembleDebug      # Linux/Mac

# Release APK
cd android && gradlew.bat assembleRelease  # Windows
cd android && ./gradlew assembleRelease    # Linux/Mac

# AAB for Play Store
cd android && gradlew.bat bundleRelease    # Windows
cd android && ./gradlew bundleRelease      # Linux/Mac
```

## 📍 APK Output Locations

- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔑 Keystore Info (Development Only)

- **File**: `android/app/ubexgo-release.keystore`
- **Store Password**: `ubexgo123`
- **Key Alias**: `ubexgo-release-key`
- **Key Password**: `ubexgo123`

⚠️ **Generate your own keystore for production!**

## 📋 Prerequisites Checklist

- [ ] Node.js installed (v18+)
- [ ] JDK installed (v17+)
- [ ] Android SDK installed
- [ ] ANDROID_HOME environment variable set
- [ ] Dependencies installed (`npm install`)
- [ ] Native files generated (`npx expo prebuild --platform android`)

## 🚀 First Time Build

```bash
# 1. Install dependencies
npm install

# 2. Generate native Android files (if not done)
npx expo prebuild --platform android

# 3. Set up Android SDK (if needed)
.\setup-android.ps1  # Windows
./setup-android.sh   # Linux/Mac

# 4. Build APK
.\build-apk.ps1  # Windows
./build-apk.sh   # Linux/Mac
```

## 🔧 Build Types

| Type | Build Time | Size | Purpose |
|------|-----------|------|---------|
| **Debug** | ~3-4 min | ~50MB | Testing, Development |
| **Release** | ~4-6 min | ~25MB | Production, Distribution |
| **AAB** | ~4-6 min | ~20MB | Google Play Store |

## 📱 Install APK on Device

```bash
# Using ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Replace existing
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Or transfer to device and install manually
```

## 🐛 Quick Troubleshooting

### Build Failed?
```bash
cd android
gradlew.bat clean  # Windows
./gradlew clean    # Linux/Mac
```

### ANDROID_HOME not set?
```bash
# Check
echo $env:ANDROID_HOME  # Windows PowerShell
echo $ANDROID_HOME      # Linux/Mac

# Set (Windows)
.\setup-android.ps1

# Set (Linux/Mac)
./setup-android.sh
```

### Native files missing?
```bash
npx expo prebuild --platform android
```

### Clean rebuild needed?
```bash
npx expo prebuild --clean --platform android
```

## 📚 Full Documentation

See [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md) for comprehensive documentation.

---

**Ready to build? Run `.\build-apk.ps1` now! 🚀**



