# Firebase Cloud Messaging (FCM) Push Notifications Setup

## Overview

The user-app now uses **Firebase Cloud Messaging (FCM)** for push notifications instead of Expo push tokens. This provides better reliability and native integration.

## Prerequisites

✅ **Already Configured:**
- `google-services.json` file present in user-app root
- Firebase plugins added to `app.json`
- `@react-native-firebase/app` and `@react-native-firebase/messaging` installed

## Configuration Files

### app.json
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.obidovbek94.UbexGoUser"
    },
    "plugins": [
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ]
  }
}
```

### google-services.json
- ✅ Already present at `apps/user-app/google-services.json`
- Contains Firebase project configuration
- Package name: `com.obidovbek94.UbexGoUser`

## Build Steps

### 1. Clean Previous Build
```bash
cd apps/user-app
rm -rf android/ ios/ node_modules/.cache
```

### 2. Prebuild with Firebase
```bash
npx expo prebuild --clean
```

This will:
- Generate native Android/iOS projects
- Configure Firebase native modules
- Set up FCM integration

### 3. Build Development Client

#### Option A: Local Build (Recommended for Testing)
```bash
# Android
npx expo run:android

# iOS (Mac only)
npx expo run:ios
```

#### Option B: EAS Build (For Distribution)
```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform android
```

## How It Works

### 1. App Startup
```typescript
// App.tsx
- Request notification permissions
- Setup foreground notification handler
- Setup background message handler
```

### 2. User Login
```typescript
// AuthContext.tsx
- Get FCM token from Firebase
- Register token with backend (POST /devices/register)
- Subscribe to token refresh events
```

### 3. Token Format
FCM tokens look like:
```
cVL9x8Q2TQe9K5x...(~150 characters)...
```
NOT like Expo tokens (`ExponentPushToken[...]`)

### 4. Backend Auto-Detection
```typescript
// Backend PushService.ts
- Detects token type automatically
- Routes FCM tokens → FCM API
- Routes Expo tokens → Expo API
```

## Testing

### Prerequisites
- Android device/emulator with Google Play Services
- Dev build installed (not Expo Go!)

### Test Flow

1. **Start Metro Bundler:**
   ```bash
   cd apps/user-app
   npm start
   ```

2. **Launch Dev Build** (not Expo Go)
   - Open the development build on device

3. **Login to User App**
   - Use phone OTP or social login

4. **Accept Permission Prompt**
   - System will ask for notification permission

5. **Check Logs:**
   ```
   FCM push token obtained: cVL9x8Q2TQe9K5x...
   Registering FCM push token with backend: cVL9x8Q2TQe9K5x...
   FCM push token registered successfully
   ```

6. **Verify Database:**
   ```sql
   SELECT * FROM push_tokens WHERE app = 'user';
   ```
   Should show FCM token (long string, NOT starting with "ExponentPushToken")

7. **Test Push from Driver App:**
   - Open driver-app
   - Enter user's phone number
   - User should receive push notification with OTP

### Check FCM Token Manually

Add this to any screen for debugging:
```typescript
import messaging from '@react-native-firebase/messaging';

// Get current token
const token = await messaging().getToken();
console.log('Current FCM Token:', token);
```

## Troubleshooting

### "Native module RNFBAppModule not found"
**Cause:** Running in Expo Go
**Solution:** Must use development build
```bash
npx expo prebuild --clean
npx expo run:android
```

### No token generated
**Cause:** Google Play Services not available
**Solution:** 
- Use physical device, or
- Use emulator with "Google APIs" image (not "AOSP")

### Permission denied
**Cause:** User denied notification permission
**Solution:**
1. Go to device Settings
2. Apps → [Your App Name]
3. Notifications → Enable

### Token not registering with backend
**Cause:** User not logged in or API issue
**Solution:**
1. Check user is logged in
2. Check backend logs
3. Verify API endpoint `/devices/register` is working

## Firebase Console Setup

Your Firebase project should have:
1. **Project:** UbexGoUser
2. **Android App:**
   - Package: `com.obidovbek94.UbexGoUser`
   - SHA-1 certificate fingerprints added
3. **Cloud Messaging:**
   - FCM API enabled
   - Server key configured in backend

## Backend Configuration

The backend needs FCM server key:

```typescript
// apps/api/src/config/index.ts
export const config = {
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || '', // Get from Firebase Console
  }
};
```

Get FCM Server Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Project Settings → Cloud Messaging
4. Copy "Server key" (under Cloud Messaging API - Legacy)
5. Add to backend `.env`:
   ```
   FCM_SERVER_KEY=your_server_key_here
   ```

## Files Modified

### User App
- ✅ `services/PushService.ts` - Uses Firebase messaging
- ✅ `App.tsx` - Setup FCM handlers
- ✅ `app.json` - Firebase plugins configured
- ✅ `google-services.json` - Firebase config

### Backend (Already Supports FCM)
- ✅ `src/services/PushService.ts` - Auto-detects FCM tokens
- ✅ `src/services/OtpService.ts` - Sends via push channel

## Differences from Expo Push

| Feature | Expo Push | Firebase FCM |
|---------|-----------|--------------|
| **Works in Expo Go** | ✅ Yes | ❌ No (needs dev build) |
| **Token Format** | `ExponentPushToken[...]` | Long hash string |
| **Reliability** | Good | Excellent |
| **Setup Complexity** | Easy | Medium |
| **Native Integration** | Limited | Full |
| **Background Messages** | Limited | Full support |
| **iOS Support** | Requires config | Native |

## Next Steps

1. **Build Development Client:**
   ```bash
   cd apps/user-app
   npx expo prebuild --clean
   npx expo run:android
   ```

2. **Test on Device:**
   - Install dev build
   - Login and accept notifications
   - Test receiving OTP from driver-app

3. **Production Build:**
   ```bash
   eas build --profile production --platform android
   ```

## Important Notes

⚠️ **Cannot use Expo Go** - Firebase native modules require development build

⚠️ **Google Play Services required** - FCM only works on devices/emulators with Google Play

✅ **Backend compatible** - Automatically detects and routes FCM tokens to FCM API

✅ **Token refresh handled** - Tokens update automatically when they change

---

**Last Updated:** January 30, 2025
**Status:** ✅ Ready for Dev Build

