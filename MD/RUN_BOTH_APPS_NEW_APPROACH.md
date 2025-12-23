# Running Both Apps Simultaneously - NEW APPROACH

## Problem Analysis

The issue is that when running `npm run android` directly, Expo tries to start Metro automatically, and both apps may conflict or the second app may connect to the wrong Metro instance.

## Solution: Start Metro FIRST, Then Connect Apps

This approach ensures each app has its own Metro instance running before the app launches.

---

## Step-by-Step Instructions

### Step 1: Setup ADB Port Forwarding (One Time)

Open PowerShell and run:

```powershell
# For User App
cd user-app-standalone
npm run setup-ports

# For Driver App  
cd driver-app-standalone
npm run setup-ports
```

This sets up ADB reverse port forwarding so your device can connect to localhost:8081 and localhost:8082.

---

### Step 2: Start Metro Bundlers (Keep These Running)

**Terminal 1 - User App Metro:**
```powershell
cd user-app-standalone
npm run start:dev-client
```

Wait until you see:
```
Metro waiting on exp://...
```

**Terminal 2 - Driver App Metro:**
```powershell
cd driver-app-standalone
npm run start:dev-client
```

Wait until you see:
```
Metro waiting on exp://...
```

**IMPORTANT: Keep both terminals running!**

---

### Step 3: Launch the Apps (Only After Metro is Running)

Now that both Metro instances are running, launch the apps:

**Option A: If apps are already installed on device**

Just open them from your device's app drawer:
- UbexGoUser
- UbexGoDriver

They should connect to their respective Metro instances automatically.

**Option B: Build and install the apps**

**Terminal 3 - User App:**
```powershell
cd user-app-standalone
cd android
.\gradlew installDebug
```

**Terminal 4 - Driver App:**
```powershell
cd driver-app-standalone
cd android
.\gradlew installDebug
```

Then open the apps from your device.

---

## Alternative: Use the Automated Script

If you want to use `npm run android`, follow this order:

### Terminal 1 - User App
```powershell
cd user-app-standalone
npm run setup-ports
npm run start:dev-client
```
Wait for Metro to start, then in a new terminal:
```powershell
cd user-app-standalone
.\gradlew installDebug
# OR
expo run:android --no-bundler
```

### Terminal 2 - Driver App
```powershell
cd driver-app-standalone
npm run setup-ports
npm run start:dev-client
```
Wait for Metro to start, then in a new terminal:
```powershell
cd driver-app-standalone
.\gradlew installDebug
# OR
expo run:android --no-bundler
```

---

## Debugging: Check Metro Connection

If an app is stuck on splash screen:

### 1. Check if Metro is running
Look at the Metro terminal - you should see connection logs when the app tries to connect.

### 2. Check ADB reverse
```powershell
adb reverse --list
```

You should see:
```
tcp:8081 -> tcp:8081
tcp:8082 -> tcp:8082
```

### 3. Manually setup ADB reverse
```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082
```

### 4. Check device connection
```powershell
adb devices
```

Should show your device as `device` (not `unauthorized` or `offline`).

### 5. Shake device to open Dev Menu
- Shake your phone
- Select "Settings"
- Check "Debug server host & port"
- User App should show: `localhost:8081`
- Driver App should show: `localhost:8082`

If it shows the wrong port, manually change it and reload.

---

## Clean Rebuild (If Nothing Works)

```powershell
# User App
cd user-app-standalone
cd android
.\gradlew clean
cd ..
npm run setup-ports
npm run start:dev-client
# Wait for Metro, then in new terminal:
cd user-app-standalone/android
.\gradlew installDebug

# Driver App
cd driver-app-standalone
cd android
.\gradlew clean
cd ..
npm run setup-ports
npm run start:dev-client
# Wait for Metro, then in new terminal:
cd driver-app-standalone/android
.\gradlew installDebug
```

---

## Key Points

1. **Always start Metro BEFORE launching the app**
2. **Use `npm run setup-ports` to configure ADB reverse**
3. **Keep Metro terminals running** while using the apps
4. **Use Dev Menu** to verify/change Metro port if needed
5. **One Metro instance per app** - never share Metro between apps

---

## Quick Commands Reference

```powershell
# Setup ports
npm run setup-ports

# Start Metro with dev client
npm run start:dev-client

# Install app without starting Metro
cd android && .\gradlew installDebug

# Check ADB reverse
adb reverse --list

# Manual ADB reverse setup
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082

# Clean build
cd android && .\gradlew clean
```

---

## Why This Approach Works

1. **Separate Metro instances**: Each app has its own Metro bundler
2. **ADB reverse**: Device can access localhost:8081 and localhost:8082
3. **No race conditions**: Metro starts before the app tries to connect
4. **Manual control**: You can see exactly what's happening in each Metro terminal

