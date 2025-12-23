# Running Both UbexGo Apps Simultaneously - Complete Solution

## 🎯 The Problem

When running both `user-app-standalone` and `driver-app-standalone` on a real Android device:
- First app runs successfully
- Second app gets stuck on splash screen (regardless of order)
- Port conflicts and Metro connection issues

## ✅ The Solution

**Key Insight**: Each app needs its own Metro Bundler running on a different port, and the device needs ADB reverse port forwarding to connect to both.

---

## 🚀 Quick Start (Recommended)

### 1. Install Both Apps
```powershell
.\INSTALL_BOTH_APPS.ps1
```

### 2. Start Metro for Both Apps
**Window 1:**
```powershell
.\START_USER_APP.ps1
```

**Window 2:**
```powershell
.\START_DRIVER_APP.ps1
```

### 3. Open Apps on Device
- Open **UbexGoUser**
- Open **UbexGoDriver**

Done! Both apps should work simultaneously.

---

## 📚 Detailed Guides

- **[QUICK_START_BOTH_APPS.md](./QUICK_START_BOTH_APPS.md)** - Step-by-step quick start guide
- **[RUN_BOTH_APPS_NEW_APPROACH.md](./RUN_BOTH_APPS_NEW_APPROACH.md)** - Detailed explanation and troubleshooting
- **[SIMULTANEOUS_APPS_SETUP.md](./SIMULTANEOUS_APPS_SETUP.md)** - Technical details of all changes made

---

## 🔧 What Was Changed

### Configuration Files Modified:

1. **`app.json`** (both apps)
   - User: `slug: "ubexgo-user"`
   - Driver: `slug: "ubexgo-driver"`

2. **`metro.config.js`** (both apps)
   - User: Port 8081
   - Driver: Port 8082

3. **`android/app/build.gradle`** (both apps)
   - User: `resValue "integer", "react_native_dev_server_port", "8081"`
   - Driver: `resValue "integer", "react_native_dev_server_port", "8082"`

4. **`package.json`** (both apps)
   - Added `setup-ports` script
   - Added `start:dev-client` script
   - Added `android:clean` script

### New Files Created:

1. **`scripts/setup-ports.js`** (both apps)
   - Sets up ADB reverse port forwarding

2. **`scripts/run-android.js`** (both apps)
   - Configures environment and runs Android build

3. **PowerShell Scripts** (root)
   - `START_USER_APP.ps1` - Start User App Metro
   - `START_DRIVER_APP.ps1` - Start Driver App Metro
   - `INSTALL_BOTH_APPS.ps1` - Install both apps

---

## 🎓 How It Works

### The Three-Layer Configuration:

1. **Metro Config** (`metro.config.js`)
   - Tells Metro which port to listen on

2. **Environment Variables** (`scripts/run-android.js`)
   - Sets `RCT_METRO_PORT`, `PORT`, etc.

3. **Android Native** (`build.gradle`)
   - Hardcodes Metro port at build time
   - **This is the critical fix!**

### ADB Reverse Port Forwarding:

```
Device (localhost:8081) → Computer (localhost:8081) → User App Metro
Device (localhost:8082) → Computer (localhost:8082) → Driver App Metro
```

Without ADB reverse, the device can't access `localhost` on your computer.

---

## 🐛 Troubleshooting

### App Stuck on Splash Screen

**Check 1: Is Metro running?**
```powershell
# You should see "Metro waiting on..." in both Metro windows
```

**Check 2: Is ADB reverse set up?**
```powershell
adb reverse --list
# Should show tcp:8081 and tcp:8082
```

**Check 3: Is app connecting to correct port?**
- Shake device → Dev Menu → Settings
- User App: `localhost:8081`
- Driver App: `localhost:8082`

### Port Conflicts

```powershell
# Kill existing Metro processes
npx kill-port 8081 8082

# Restart Metro
.\START_USER_APP.ps1
.\START_DRIVER_APP.ps1
```

### Clean Rebuild

```powershell
# User App
cd user-app-standalone/android
.\gradlew clean
cd ../..

# Driver App
cd driver-app-standalone/android
.\gradlew clean
cd ../..

# Reinstall
.\INSTALL_BOTH_APPS.ps1
```

---

## 📋 Command Reference

### Setup & Installation
```powershell
# Install both apps
.\INSTALL_BOTH_APPS.ps1

# Or manually:
cd user-app-standalone
npm run setup-ports
cd android && .\gradlew installDebug && cd ../..

cd driver-app-standalone
npm run setup-ports
cd android && .\gradlew installDebug && cd ../..
```

### Start Metro
```powershell
# Automated
.\START_USER_APP.ps1  # Window 1
.\START_DRIVER_APP.ps1  # Window 2

# Or manually:
cd user-app-standalone && npm run start:dev-client  # Window 1
cd driver-app-standalone && npm run start:dev-client  # Window 2
```

### ADB Commands
```powershell
# Check device
adb devices

# Setup reverse
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082

# List reverse
adb reverse --list

# Remove reverse
adb reverse --remove-all
```

### Clean Build
```powershell
# User App
cd user-app-standalone/android && .\gradlew clean

# Driver App
cd driver-app-standalone/android && .\gradlew clean
```

---

## ✨ Success Checklist

Before running both apps, ensure:

- [ ] Device connected via USB (`adb devices` shows device)
- [ ] ADB reverse configured (`adb reverse --list` shows ports)
- [ ] User App Metro running on port 8081
- [ ] Driver App Metro running on port 8082
- [ ] Both apps installed on device
- [ ] USB debugging enabled on device

---

## 💡 Key Takeaways

1. **Always start Metro BEFORE launching apps**
2. **Each app needs its own Metro instance**
3. **ADB reverse is required for device to connect to localhost**
4. **Metro port must be configured at Android native level** (build.gradle)
5. **Use Dev Menu to verify/change Metro port if needed**

---

## 🎯 Daily Workflow

Your typical development session:

```powershell
# Morning setup (2 minutes)
1. .\START_USER_APP.ps1  # Window 1
2. .\START_DRIVER_APP.ps1  # Window 2
3. Open both apps on device
4. Start coding! 🚀

# Keep Metro windows open all day
# Apps will hot-reload as you make changes
```

---

## 📞 Still Having Issues?

If you're still experiencing problems:

1. Read **[RUN_BOTH_APPS_NEW_APPROACH.md](./RUN_BOTH_APPS_NEW_APPROACH.md)** for detailed troubleshooting
2. Check Metro terminal output for error messages
3. Use `adb logcat` to see Android logs
4. Verify ADB reverse is working: `adb reverse --list`
5. Try clean rebuild of both apps

---

## 🎉 Success!

Once set up correctly, you can:
- ✅ Run both apps simultaneously
- ✅ Hot reload works for both apps
- ✅ Debug both apps independently
- ✅ No port conflicts
- ✅ Stable development experience

Happy coding! 🚀

