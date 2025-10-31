# Build Instructions - User App Development Client

## Issue

The `npx expo run:android` command is failing with a Gradle classpath error. This is a known issue with certain Java/Gradle configurations on Windows.

## Solution: Build with Android Studio (Recommended)

### Step 1: Open in Android Studio

1. Open **Android Studio**
2. Click **"Open"** (or File → Open)
3. Navigate to: `D:\projects\UberGo\apps\user-app\android`
4. Click **OK**

### Step 2: Let Android Studio Sync

- Android Studio will automatically sync Gradle
- Wait for "Gradle sync finished" message (bottom right)
- If prompted to update Gradle or Android Gradle Plugin, click **"Update"**

### Step 3: Build and Run

1. Connect your Android device (or start emulator)
2. Click the **green play button** (▶) in toolbar, OR
3. Click **Build → Make Project**, then
4. Click **Run → Run 'app'**

### Step 4: Start Metro

Once the app installs, in a separate terminal:

```bash
cd D:\projects\UberGo\apps\user-app
npm start
```

The app will connect to Metro and reload.

## Alternative: Fix Gradle Wrapper (Advanced)

If you want to fix the command line build:

### Option A: Use EAS Build

```bash
cd apps/user-app

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development client
eas build --profile development --platform android --local
```

### Option B: Reinstall Gradle Wrapper

```bash
cd apps/user-app/android

# Delete wrapper
Remove-Item -Recurse -Force gradle\wrapper

# Regenerate (you need Gradle installed globally)
gradle wrapper --gradle-version 8.14.3
```

### Option C: Use Different Java Version

The issue might be Java 20 compatibility. Try Java 17 (LTS):

1. Download Java 17 from https://adoptium.net/
2. Install it
3. Set `JAVA_HOME` environment variable:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
   ```
4. Try again:
   ```bash
   cd apps/user-app
   npx expo run:android
   ```

## What You're Building

- **Package:** com.obidovbek94.UbexGoUser
- **Features:** Firebase Cloud Messaging, Push Notifications
- **Type:** Development Client (not Expo Go)

## After Successful Build

1. App will be installed on device
2. Open the app
3. Login with your account
4. Accept notification permission
5. Check logs for: `FCM push token obtained: ...`
6. Test push notifications from driver-app

## Verify Build Success

Once installed, you should see:
- New app icon (not Expo Go icon)
- App name: "UbexGoUser"
- Can login and use all features
- Push notifications work

## Troubleshooting

### "App keeps crashing"
- Check Metro logs
- Ensure Metro is running (`npm start`)
- Check device logs in Android Studio (Logcat)

### "Cannot connect to Metro"
- Ensure device and PC on same network
- Check firewall isn't blocking port 8081
- Try: `adb reverse tcp:8081 tcp:8081`

### "Firebase not working"
- Ensure `google-services.json` is in place
- Check package name matches Firebase console
- Rebuild with `./gradlew clean assembleDebug`

---

**Recommended:** Use Android Studio for the first build. It handles Gradle configuration better than command line.

