# Push Notifications Setup - Complete Guide

## Overview

The system now supports **Expo Push Notifications** for use in Expo Go and development builds, with automatic fallback to FCM for native builds.

## Architecture

### User App Flow
1. User logs into user-app
2. App requests notification permission
3. Gets Expo push token (format: `ExponentPushToken[xxxxxx]`)
4. Registers token with backend API (`POST /devices/register`)
5. Backend stores token in `push_tokens` table with `app = 'user'`

### Driver Registration Flow
1. Driver enters user's phone number in driver-app
2. Driver-app calls `POST /auth/otp/send` with `channel: 'push'`
3. Backend:
   - Finds user by phone number
   - Retrieves user's push token from `push_tokens`
   - Detects token type (Expo or FCM)
   - Sends push notification with OTP code
4. User receives notification on their device
5. Driver enters the code from user's notification
6. Driver-app calls `POST /auth/otp/verify` to complete registration

## Components Modified

### User App (`apps/user-app/`)

#### `services/PushService.ts`
- ✅ Uses Expo Notifications API
- ✅ Works in Expo Go (no native build required)
- ✅ Requests permissions on app start
- ✅ Gets Expo push token
- ✅ Registers token with backend
- ✅ Handles token refresh

#### `App.tsx`
- ✅ Calls `ensurePushPermission()` on startup

#### `contexts/AuthContext.tsx`
- ✅ Auto-registers push token when user logs in
- ✅ Subscribes to token refresh events

### Backend API (`apps/api/`)

#### `src/services/PushService.ts`
- ✅ Auto-detects token type (Expo vs FCM)
- ✅ Sends via Expo Push Service for Expo tokens
- ✅ Sends via FCM for native tokens
- ✅ Single `send()` method handles both

#### `src/services/OtpService.ts`
- ✅ Updated to use `PushService.send()` for push channel
- ✅ Finds user by phone
- ✅ Retrieves push token from database
- ✅ Sends OTP code via push notification

#### `src/controllers/DeviceController.ts`
- ✅ Handles `POST /devices/register`
- ✅ Stores push tokens in database
- ✅ Supports both `user` and `driver` apps

### Driver App (`apps/driver-app/`)

#### `screens/PhoneRegistrationScreen.tsx`
- ✅ Sends push notifications ONLY (no SMS fallback)
- ✅ Better error messages

#### `screens/OTPVerificationScreen.tsx`
- ✅ Resend code uses push notifications
- ✅ Improved error handling

## Database Schema

```sql
-- push_tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL, -- 'android' or 'ios'
  app VARCHAR(10) NOT NULL, -- 'user' or 'driver'
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- otp_codes table (updated)
CREATE TYPE enum_otp_codes_channel AS ENUM ('sms', 'call', 'push');

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  channel enum_otp_codes_channel NOT NULL,
  target CITEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL
);
```

## Testing Guide

### Prerequisites
1. Backend API running
2. Database migrations applied:
   ```bash
   cd apps/api
   npm run migrate
   ```

### Test on Physical Device (Recommended)
1. **User App - Register Push Token:**
   ```bash
   cd apps/user-app
   npm start
   # Scan QR code with Expo Go app
   ```
   
2. **Log in to user app** (use OTP or social login)
   
3. **Accept notification permission** when prompted
   
4. **Check logs** for:
   ```
   Expo push token obtained: ExponentPushToken[xxxxxx]
   Registering push token with backend: ExponentPushToken[xxxxxx]
   Push token registered successfully
   ```
   
5. **Verify database:**
   ```sql
   SELECT * FROM push_tokens WHERE app = 'user';
   ```
   Should show a row with the Expo token.

6. **Driver App - Send Push OTP:**
   ```bash
   cd apps/driver-app
   npm start
   # Open in separate Expo Go instance or emulator
   ```
   
7. **Enter user's phone number** in driver registration
   
8. **Check user's device** - should receive notification:
   > **UbexGo tasdiqlash kodingiz**
   > Kodni haydovchi ilovasiga kiriting: 12345
   
9. **Enter OTP code** in driver app to complete verification

### Test on Emulator (Limited)

⚠️ **Note:** Expo push notifications work best on physical devices. Emulators may have issues.

If you must test on emulator:
1. Use Android emulator with Google Play Services
2. Follow same steps as above
3. Token will still be registered, but delivery may be unreliable

### Troubleshooting

#### "Push permission not granted"
- User denied notification permission
- Solution: Go to device Settings → Apps → Expo Go → Notifications → Enable

#### "Push notifications only work on physical devices"
- Running on emulator without proper Google Play Services
- Solution: Use physical device or create emulator with Google APIs image

#### "No push token available, skipping registration"
- Permission not granted or device not supported
- Solution: Check device settings and logs

#### "User not found for provided phone"
- User hasn't registered in user-app yet
- Solution: User must complete registration in user-app first

#### "User device token not registered"
- User hasn't logged in or token registration failed
- Solution: User must log into user-app and accept notifications

## API Endpoints

### Register Device Token
```http
POST /api/devices/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "android",  // or "ios"
  "app": "user"  // or "driver"
}
```

### Send OTP via Push
```http
POST /api/auth/otp/send
Content-Type: application/json

{
  "phone": "+998901234567",
  "channel": "push"
}
```

### Verify OTP
```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "phone": "+998901234567",
  "code": "12345"
}
```

## Expo Push Notification Format

Expo tokens look like:
- `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]` (legacy format)
- `ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]` (new format)

The backend auto-detects these and routes to Expo Push Service instead of FCM.

## Production Considerations

### For Expo Go (Development)
- ✅ Works out of the box
- ✅ No configuration needed
- ✅ Good for testing

### For Standalone Builds
If you build a standalone APK/IPA:
1. Expo Push Service still works (no changes needed)
2. OR switch to FCM by:
   - Adding Firebase config files
   - Using Firebase Cloud Messaging tokens
   - Backend will auto-detect and route to FCM

## Security Notes

1. **Token Validation:** Expo validates tokens automatically
2. **Rate Limiting:** Backend has rate limits on OTP sending
3. **Token Refresh:** Tokens are automatically updated on change
4. **Upsert Logic:** Duplicate tokens are updated (not duplicated)

## Migration Path

### Current State: ✅ Working with Expo
- User app: Uses Expo push tokens
- Backend: Supports both Expo and FCM
- Driver app: Sends push OTP

### Future: Optional FCM Migration
If you want to use FCM instead:
1. Add Firebase config to user-app
2. Install `@react-native-firebase/messaging`
3. Run prebuild: `npx expo prebuild`
4. Tokens will change from Expo format to FCM format
5. Backend auto-detects and routes to FCM
6. No backend code changes needed!

## Files Modified

### User App
- ✅ `apps/user-app/services/PushService.ts`
- ✅ `apps/user-app/App.tsx`
- ✅ `apps/user-app/contexts/AuthContext.tsx`

### Backend API
- ✅ `apps/api/src/services/PushService.ts`
- ✅ `apps/api/src/services/OtpService.ts`
- ✅ `apps/api/src/database/migrations/20250130000002-add-push-to-otp-channel.cjs`

### Driver App
- ✅ `apps/driver-app/screens/PhoneRegistrationScreen.tsx`
- ✅ `apps/driver-app/screens/OTPVerificationScreen.tsx`
- ✅ `apps/driver-app/PUSH_NOTIFICATION_FIX.md`

---

**Last Updated:** January 30, 2025
**Status:** ✅ Production Ready for Expo

