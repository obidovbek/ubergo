# FINAL SOLUTION - Running Both Apps Simultaneously

## ✅ The Real Problem

Both apps were trying to connect to port 8081 by default. The driver app needs to connect to port 8082.

## 🚀 Complete Solution (Follow These Steps)

### Step 1: Fix Metro Port Configuration

Run this command in PowerShell (in project root):

```powershell
.\FIX_METRO_PORTS.ps1
```

This will:
- Setup ADB reverse port forwarding
- Configure User App to use port 8081
- Configure Driver App to use port 8082

### Step 2: Start Metro for Both Apps

**PowerShell Window 1 - User App:**
```powershell
.\START_USER_APP.ps1
```

**PowerShell Window 2 - Driver App:**
```powershell
.\START_DRIVER_APP.ps1
```

Wait until both show "Metro waiting on..."

### Step 3: Open Apps on Device

- Open **UbexGoUser** app (should connect to port 8081)
- Open **UbexGoDriver** app (should connect to port 8082)

Both apps should now work!

---

## 🔧 If Driver App Still Gets Stuck

### Manual Fix via Dev Menu:

1. **Open Driver App** on your device
2. **Shake the device** to open Dev Menu
3. Tap **"Settings"**
4. Tap **"Debug server host & port for device"**
5. Enter: `localhost:8082`
6. Tap **OK**
7. Go back and tap **"Reload"**

The app should now connect to port 8082 and work!

### For User App (if needed):

Same steps, but enter: `localhost:8081`

---

## 📋 Quick Commands

```powershell
# Fix port configuration
.\FIX_METRO_PORTS.ps1

# Check current configuration
.\CHECK_METRO_PORTS.ps1

# Start User App Metro
.\START_USER_APP.ps1

# Start Driver App Metro
.\START_DRIVER_APP.ps1

# Install both apps
.\INSTALL_BOTH_APPS.ps1
```

---

## 🎯 Daily Workflow

After initial setup:

1. Open 2 PowerShell windows
2. Window 1: `.\START_USER_APP.ps1`
3. Window 2: `.\START_DRIVER_APP.ps1`
4. Open both apps on device
5. Done! 🎉

---

## 🐛 Troubleshooting

### Check if configuration is correct:
```powershell
.\CHECK_METRO_PORTS.ps1
```

### If apps are stuck:
```powershell
# Run fix script
.\FIX_METRO_PORTS.ps1

# Force stop both apps on device
# Reopen them
```

### If still not working:
1. Shake device on stuck app
2. Dev Menu → Settings
3. Set port manually:
   - User App: `localhost:8081`
   - Driver App: `localhost:8082`
4. Reload

---

## ✨ Why This Works

1. **ADB Reverse**: Device can access localhost:8081 and localhost:8082 on your computer
2. **Metro Port Config**: Each app is configured to connect to its specific port
3. **Separate Metro Instances**: Each app has its own Metro bundler
4. **No Conflicts**: Apps don't fight over the same port

---

## 🎉 Success!

Once configured:
- ✅ Both apps run simultaneously
- ✅ No port conflicts
- ✅ Hot reload works for both
- ✅ Independent debugging
- ✅ Stable development experience

Happy coding! 🚀

