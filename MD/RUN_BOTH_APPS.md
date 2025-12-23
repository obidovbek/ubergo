# Running Both UbexGo Apps Simultaneously

This guide explains how to run both the User and Driver applications simultaneously on a real Android device.

## Configuration Summary

Both apps have been configured with unique Metro Bundler ports:

- **User App (`user-app-standalone`)**: Port 8081
- **Driver App (`driver-app-standalone`)**: Port 8082

### Changes Applied

1. **`metro.config.js`**: Each app has a unique port configured
2. **`package.json`**: Scripts updated to use the correct ports via Node.js helper scripts
3. **`app.json`**: Unique slugs and schemes for each app
   - User: `slug: "ubexgo-user"`, `scheme: "ubexgouser"`
   - Driver: `slug: "ubexgo-driver"`, `scheme: "ubexgodriver"`
4. **`android/app/build.gradle`**: Metro port hardcoded at native level
   - User: `react_native_dev_server_port = 8081`
   - Driver: `react_native_dev_server_port = 8082`

---

## ⚠️ IMPORTANT: Clean Rebuild Required

Since we modified the Android native configuration (`build.gradle`), you **MUST** perform a clean rebuild of both apps:

### Step 1: Clean and Rebuild Both Apps

**User App (Terminal 1):**
```powershell
cd user-app-standalone
cd android
.\gradlew clean
cd ..
npm run android
```

**Driver App (Terminal 2):**
```powershell
cd driver-app-standalone
cd android
.\gradlew clean
cd ..
npm run android
```

**Wait for both apps to build and install successfully on your device before proceeding.**

---

## How to Run Both Apps After Initial Build

Once both apps have been rebuilt with the new configuration, you can run them simultaneously:

### Method 1: Direct Run (Simplest)

**Terminal 1 - User App:**
```powershell
cd user-app-standalone
npm run android
```

**Terminal 2 - Driver App:**
```powershell
cd driver-app-standalone
npm run android
```

Both apps will automatically:
- Start their own Metro bundler on the correct port
- Connect to their respective Metro instance
- Run simultaneously without conflicts

### Method 2: Start Metro First (More Control)

If you prefer to start Metro manually:

**Terminal 1 - User Metro:**
```powershell
cd user-app-standalone
npm start
# Wait for "Metro waiting on exp://..." message
```

**Terminal 2 - Driver Metro:**
```powershell
cd driver-app-standalone
npm start
# Wait for "Metro waiting on exp://..." message
```

**Terminal 3 - Build User App:**
```powershell
cd user-app-standalone
npm run android
```

**Terminal 4 - Build Driver App:**
```powershell
cd driver-app-standalone
npm run android
```

---

## Important Notes

1. **Different Ports**: Each app uses its own Metro port (8081 vs 8082)
2. **Different App IDs**: 
   - User App: `com.obidovbek94.UbexGoUser`
   - Driver App: `com.obidovbek94.UbexGoDriver`
3. **Different Schemes**:
   - User App: `ubexgouser://`
   - Driver App: `ubexgodriver://`
4. **Native Configuration**: The Metro port is now hardcoded in the Android build, so each app will always connect to its designated port

---

## Troubleshooting

### If the second app still gets stuck:

1. **Ensure both apps were rebuilt** after the `build.gradle` changes
2. **Kill all Metro processes** and restart:
   ```powershell
   # Kill Metro processes
   npx kill-port 8081 8082
   
   # Restart both apps
   cd user-app-standalone && npm run android
   cd driver-app-standalone && npm run android
   ```

3. **Check which ports are in use:**
   ```powershell
   netstat -ano | findstr :8081
   netstat -ano | findstr :8082
   ```

4. **If issues persist**, perform another clean rebuild:
   ```powershell
   # User App
   cd user-app-standalone/android
   .\gradlew clean
   cd ..
   npm run android
   
   # Driver App
   cd driver-app-standalone/android
   .\gradlew clean
   cd ..
   npm run android
   ```

---

## Quick Reference Commands

**Clean and rebuild User App:**
```powershell
cd user-app-standalone && cd android && .\gradlew clean && cd .. && npm run android
```

**Clean and rebuild Driver App:**
```powershell
cd driver-app-standalone && cd android && .\gradlew clean && cd .. && npm run android
```

**Kill all Metro processes:**
```powershell
npx kill-port 8081 8082
```
