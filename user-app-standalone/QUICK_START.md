# 🚀 Quick Start - UbexGo User App

## ✅ What's Done

- ✅ APK installed on emulator (emulator-5554)
- ✅ Metro bundler started in background
- ✅ App ready to run!

## 📱 Open the App Now

### On Emulator:
1. Find the "UbexGoUser" app icon in your emulator
2. Tap to open
3. The app should load successfully!

### On Real Phone:
1. Follow instructions in [INSTALL_APK.md](./INSTALL_APK.md)
2. Install the APK
3. Ensure phone is on same Wi-Fi as your PC
4. Open the app

## 📍 APK Location

```
D:\projects\UberGo\apps\user-app\android\app\build\outputs\apk\debug\app-debug.apk
```

##  Metro Bundler

Metro bundler is running in the background on:
```
http://localhost:8081
http://192.168.1.193:8081  (for real devices on same network)
```

## 🔧 Troubleshooting

### If App Shows "Unable to load script" Error:

**On Emulator**:
1. Press `Ctrl + M` (or shake device)
2. Tap "Reload"

**On Real Phone**:
1. Shake the device
2. Tap "Dev Settings"
3. Tap "Change Bundle Location"
4. Enter: `192.168.1.193:8081` (use your PC's IP)
5. Go back and tap "Reload"

### If Metro Stops:
```bash
cd D:\projects\UberGo\apps\user-app
npm start
```

## 📋 Quick Commands

```bash
# Install APK on emulator
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Install APK on phone (when connected)
adb devices  # Check phone is listed
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Start Metro bundler
npm start

# Build new APK
cd android
.\gradlew.bat assembleDebug
```

## 🎯 Next Steps

1. **Test on Emulator**: Open the app and verify it works
2. **Install on Real Phone**: Follow [INSTALL_APK.md](./INSTALL_APK.md)
3. **Build Release APK**: For standalone APK without Metro (coming soon)

---

**Happy Testing! 🎉**

