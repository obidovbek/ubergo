# Quick Start: Running Both Apps Simultaneously

## 🚀 Fastest Way to Run Both Apps

### Step 1: Install Both Apps (One Time)

Open PowerShell in the project root and run:

```powershell
.\INSTALL_BOTH_APPS.ps1
```

This will:
- Setup ADB port forwarding
- Install User App on your device
- Install Driver App on your device

**Wait for installation to complete!**

---

### Step 2: Start Metro for Both Apps

**PowerShell Window 1 - User App Metro:**
```powershell
.\START_USER_APP.ps1
```

**PowerShell Window 2 - Driver App Metro:**
```powershell
.\START_DRIVER_APP.ps1
```

**Keep both windows open!**

---

### Step 3: Open Apps on Device

Go to your device and open:
1. **UbexGoUser** app
2. **UbexGoDriver** app

Both apps should load and work simultaneously!

---

## 🔧 If Apps Get Stuck

### Quick Fix:
1. Shake your device to open Dev Menu
2. Tap "Settings"
3. Check "Debug server host & port for device":
   - User App: Should be `localhost:8081`
   - Driver App: Should be `localhost:8082`
4. If wrong, change it and tap "Reload"

### Full Reset:
```powershell
# Close both Metro windows (Ctrl+C)
# Then run:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082

# Restart Metro windows:
.\START_USER_APP.ps1  # Window 1
.\START_DRIVER_APP.ps1  # Window 2

# Reopen apps on device
```

---

## 📝 Manual Method (If Scripts Don't Work)

### Terminal 1 - User App:
```powershell
cd user-app-standalone
npm run setup-ports
npm run start:dev-client
```

### Terminal 2 - Driver App:
```powershell
cd driver-app-standalone
npm run setup-ports
npm run start:dev-client
```

### Terminal 3 - Install User App:
```powershell
cd user-app-standalone/android
.\gradlew installDebug
```

### Terminal 4 - Install Driver App:
```powershell
cd driver-app-standalone/android
.\gradlew installDebug
```

Then open both apps on your device.

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Both Metro windows show "Metro waiting on exp://..."
- ✅ Both apps open without getting stuck
- ✅ You can see Metro logs when interacting with each app
- ✅ Both apps respond to changes (hot reload works)

---

## 🐛 Troubleshooting

### "Cannot connect to Metro"
```powershell
adb reverse --list
# Should show:
# tcp:8081 -> tcp:8081
# tcp:8082 -> tcp:8082

# If not, run:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082
```

### "App stuck on splash screen"
1. Check Metro is running (look at the terminal)
2. Check ADB reverse (see above)
3. Shake device → Dev Menu → Settings → Verify port
4. Reload app

### "Port already in use"
```powershell
# Kill any existing Metro processes
npx kill-port 8081 8082

# Restart Metro windows
.\START_USER_APP.ps1
.\START_DRIVER_APP.ps1
```

---

## 💡 Pro Tips

1. **Always start Metro BEFORE opening the apps**
2. **Keep Metro windows visible** so you can see connection logs
3. **Use Dev Menu** (shake device) to check/change Metro port
4. **One Metro per app** - never share Metro between apps
5. **ADB reverse must be set up** for device to connect to localhost

---

## 🎯 Daily Workflow

After initial setup, your daily workflow is:

1. Open 2 PowerShell windows
2. Run `.\START_USER_APP.ps1` in window 1
3. Run `.\START_DRIVER_APP.ps1` in window 2
4. Wait for both Metro instances to start
5. Open both apps on your device
6. Develop! 🎉

That's it!

