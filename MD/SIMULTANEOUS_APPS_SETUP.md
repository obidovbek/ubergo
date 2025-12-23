# Simultaneous Apps Setup - Complete Solution

## Problem
When running both `user-app-standalone` and `driver-app-standalone` on a real Android device via USB, the first app runs successfully but the second app gets stuck on the splash screen, regardless of which app is started first.

## Root Cause
Both apps were trying to connect to the same Metro Bundler port (8081), causing the second app to either:
1. Fail to connect to Metro
2. Connect to the wrong Metro instance
3. Hang while waiting for the correct Metro connection

## Solution Overview
Configure each app to use a unique Metro Bundler port at **multiple levels**:
1. Metro configuration
2. Package.json scripts
3. **Android native build configuration** (critical!)

---

## Files Modified

### User App (`user-app-standalone`)

#### 1. `app.json`
- Changed `slug` from `"ubexgo-monorepo"` to `"ubexgo-user"`
- Kept `scheme` as `"ubexgouser"`

#### 2. `metro.config.js`
```javascript
config.server = {
  ...config.server,
  port: 8081,
};
```

#### 3. `package.json`
```json
{
  "scripts": {
    "start": "expo start --clear --port 8081",
    "android": "node scripts/run-android.js",
    "android:device": "node scripts/run-android.js --device"
  }
}
```

#### 4. `scripts/run-android.js` (NEW FILE)
```javascript
#!/usr/bin/env node
process.env.RCT_METRO_PORT = '8081';
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.PORT = '8081';
const { execSync } = require('child_process');
const args = process.argv.slice(2).join(' ');
const command = args.includes('--device') 
  ? 'expo run:android --device' 
  : 'expo run:android';
execSync(command, { stdio: 'inherit', env: process.env });
```

#### 5. `android/app/build.gradle` (CRITICAL!)
```gradle
defaultConfig {
    // ... other config
    
    // Set Metro port for user app
    resValue "integer", "react_native_dev_server_port", "8081"
}
```

---

### Driver App (`driver-app-standalone`)

#### 1. `app.json`
- Changed `slug` from `"ubexgo-monorepo"` to `"ubexgo-driver"`
- Kept `scheme` as `"ubexgodriver"`

#### 2. `metro.config.js`
```javascript
config.server = {
  ...config.server,
  port: 8082,
};
```

#### 3. `package.json`
```json
{
  "scripts": {
    "start": "expo start --clear --port 8082",
    "android": "node scripts/run-android.js",
    "android:device": "node scripts/run-android.js --device"
  }
}
```

#### 4. `scripts/run-android.js` (NEW FILE)
```javascript
#!/usr/bin/env node
process.env.RCT_METRO_PORT = '8082';
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.PORT = '8082';
const { execSync } = require('child_process');
const args = process.argv.slice(2).join(' ');
const command = args.includes('--device') 
  ? 'expo run:android --device' 
  : 'expo run:android';
execSync(command, { stdio: 'inherit', env: process.env });
```

#### 5. `android/app/build.gradle` (CRITICAL!)
```gradle
defaultConfig {
    // ... other config
    
    // Set Metro port for driver app
    resValue "integer", "react_native_dev_server_port", "8082"
}
```

---

## Why Each Change Was Necessary

### 1. Different Slugs (`app.json`)
- Prevents Expo from treating both apps as the same project
- Ensures separate development client configurations

### 2. Metro Port Configuration (`metro.config.js`)
- Sets the default port for Metro Bundler
- Prevents port conflicts when starting Metro

### 3. Node.js Helper Scripts (`scripts/run-android.js`)
- Sets environment variables correctly in PowerShell (Windows)
- Avoids trailing space issues with `set` command in PowerShell
- Ensures `RCT_METRO_PORT` is set before running Expo

### 4. **Android Native Configuration (`build.gradle`)** - THE KEY FIX
- **This is the critical change that solves the "stuck on splash screen" issue**
- Hardcodes the Metro port at the native Android level
- Ensures the Android app knows which port to connect to at build time
- Without this, the app uses the default port (8081) regardless of environment variables

---

## How to Use

### Initial Setup (REQUIRED - One Time Only)

You **MUST** perform a clean rebuild after these changes:

**Terminal 1 - User App:**
```powershell
cd user-app-standalone
cd android
.\gradlew clean
cd ..
npm run android
```

**Terminal 2 - Driver App:**
```powershell
cd driver-app-standalone
cd android
.\gradlew clean
cd ..
npm run android
```

Wait for both builds to complete and apps to install on your device.

### Daily Usage (After Initial Setup)

Simply run both apps in separate terminals:

**Terminal 1:**
```powershell
cd user-app-standalone
npm run android
```

**Terminal 2:**
```powershell
cd driver-app-standalone
npm run android
```

Both apps will:
- Start their own Metro bundler on the correct port
- Connect to their respective Metro instance
- Run simultaneously without conflicts

---

## Technical Details

### How React Native Connects to Metro

1. **At Build Time**: The Android app reads `react_native_dev_server_port` from resources
2. **At Runtime**: The app connects to `localhost:<port>` to fetch the JavaScript bundle
3. **Without native config**: The app defaults to port 8081, ignoring environment variables
4. **With native config**: The app uses the configured port (8081 or 8082)

### Port Configuration Hierarchy

1. **Highest Priority**: `android/app/build.gradle` → `resValue "integer", "react_native_dev_server_port"`
2. **Medium Priority**: Environment variables (`RCT_METRO_PORT`, `PORT`)
3. **Lowest Priority**: Metro config (`metro.config.js`)

All three levels must be configured for reliable simultaneous operation.

---

## Troubleshooting

### If the second app still gets stuck:

1. **Verify clean rebuild was performed**
   ```powershell
   cd user-app-standalone/android && .\gradlew clean
   cd driver-app-standalone/android && .\gradlew clean
   ```

2. **Check the build.gradle changes were applied**
   - Open `user-app-standalone/android/app/build.gradle`
   - Verify line contains: `resValue "integer", "react_native_dev_server_port", "8081"`
   - Open `driver-app-standalone/android/app/build.gradle`
   - Verify line contains: `resValue "integer", "react_native_dev_server_port", "8082"`

3. **Kill all Metro processes and rebuild**
   ```powershell
   npx kill-port 8081 8082
   cd user-app-standalone && npm run android
   cd driver-app-standalone && npm run android
   ```

4. **Check logcat for connection errors**
   ```powershell
   adb logcat | findstr "Metro"
   ```

---

## Summary

The key to running both apps simultaneously is configuring the Metro port at **all three levels**:
1. ✅ Metro config (`metro.config.js`)
2. ✅ Environment variables (via `scripts/run-android.js`)
3. ✅ **Android native build** (`android/app/build.gradle`) ← **MOST IMPORTANT**

Without the native build configuration, the Android app will always try to connect to port 8081, causing the second app to hang.

