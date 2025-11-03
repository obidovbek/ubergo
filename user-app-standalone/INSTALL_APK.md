# How to Install APK on Your Devices

## ✅ APK Successfully Installed on Emulator!

The debug APK has been installed on your Android emulator (emulator-5554).

## 📱 Install on Your Real Phone

### Method 1: Using ADB (Recommended)

1. **Enable USB Debugging on your phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your phone via USB**

3. **Check if phone is detected:**
   ```bash
   adb devices
   ```
   You should see your phone listed.

4. **Install the APK:**
   ```bash
   adb install -r "D:\projects\UberGo\apps\user-app\android\app\build\outputs\apk\debug\app-debug.apk"
   ```

### Method 2: Manual Transfer

1. **Copy the APK to your phone:**
   - Connect phone to PC via USB
   - Copy the APK file from:
     `D:\projects\UberGo\apps\user-app\android\app\build\outputs\apk\debug\app-debug.apk`
   - Paste it to your phone's Download folder

2. **Install on phone:**
   - Open File Manager on your phone
   - Navigate to Downloads folder
   - Tap on `app-debug.apk`
   - Allow "Install from Unknown Sources" if prompted
   - Tap "Install"

### Method 3: Share via Cloud/Email

1. **Upload APK to:**
   - Google Drive
   - Dropbox
   - Or email it to yourself

2. **On your phone:**
   - Download the APK
   - Tap to install
   - Enable "Unknown Sources" if needed

## 📍 APK Location

The APK file is located at:
```
D:\projects\UberGo\apps\user-app\android\app\build\outputs\apk\debug\app-debug.apk
```

**File Size**: ~50 MB

## 🔧 Install Multiple Devices at Once

If you have both emulator and real phone connected:

```bash
# List all devices
adb devices

# Install on ALL connected devices
adb install -r "D:\projects\UberGo\apps\user-app\android\app\build\outputs\apk\debug\app-debug.apk"

# Or install on specific device
adb -s <device-id> install -r "path/to/app-debug.apk"
```

## ⚠️ Important Notes

### This is a DEBUG APK
- **Requires Metro Bundler**: The app needs the Metro bundler running to work
- **Start Metro**: Before opening the app, run:
  ```bash
  cd D:\projects\UberGo\apps\user-app
  npm start
  ```
- **Connect to Metro**: Make sure your phone and PC are on the same Wi-Fi network

### For Standalone APK (No Metro Required)
To build a standalone APK that doesn't need Metro bundler, you would need to build a release APK. However, there's currently an issue with the monorepo structure preventing release builds.

## 🚀 Running the App

### On Emulator:
1. The app is already installed
2. Start Metro bundler:
   ```bash
   cd D:\projects\UberGo\apps\user-app
   npm start
   ```
3. Open the app on the emulator

### On Real Phone:
1. Install APK using one of the methods above
2. Ensure phone is on same Wi-Fi as PC
3. Start Metro bundler:
   ```bash
   cd D:\projects\UberGo\apps\user-app
   npm start
   ```
4. Open the app
5. If you see "Unable to load script" error:
   - Shake the device
   - Tap "Dev Settings"
   - Tap "Change Bundle Location"
   - Enter your PC's IP address (e.g., `192.168.1.193:8081`)

## 🔍 Find Your PC's IP Address

**Windows (PowerShell)**:
```powershell
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter.

**Alternative**: Metro bundler will show the URL when it starts (e.g., `http://192.168.1.193:8081`)

## 📋 Quick Commands Reference

```bash
# List devices
adb devices

# Install APK
adb install -r app-debug.apk

# Uninstall app
adb uninstall com.obidovbek94.UbexGoUser

# Start app
adb shell am start -n com.obidovbek94.UbexGoUser/.MainActivity

# View logs
adb logcat

# Clear app data
adb shell pm clear com.obidovbek94.UbexGoUser
```

---

**App Package**: `com.obidovbek94.UbexGoUser`  
**APK Type**: Debug (requires Metro bundler)  
**Last Built**: November 3, 2025

