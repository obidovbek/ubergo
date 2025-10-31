# Firebase FCM Migration Summary

## What Changed

Migrated from **Expo Push Tokens** to **Firebase Cloud Messaging (FCM)** for more reliable push notifications.

## Changes Made

### User App (`apps/user-app/`)

#### 1. `services/PushService.ts`
```typescript
// OLD: Expo notifications
import * as Notifications from 'expo-notifications';

// NEW: Firebase Cloud Messaging
import messaging from '@react-native-firebase/messaging';

export async function getFcmPushToken() {
  const token = await messaging().getToken();
  return token; // Returns FCM token (not Expo token)
}
```

**Key Changes:**
- ✅ Uses `@react-native-firebase/messaging` instead of `expo-notifications`
- ✅ Gets FCM token format: `cVL9x8Q2TQe...` (150+ chars)
- ✅ Handles token refresh via `onTokenRefresh`
- ✅ Foreground message handler for OTP codes

#### 2. `App.tsx`
```typescript
// Setup FCM handlers on app start
import { setupForegroundNotificationHandler } from './services/PushService';
import messaging from '@react-native-firebase/messaging';

useEffect(() => {
  ensurePushPermission();
  setupForegroundNotificationHandler();
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message:', remoteMessage);
  });
}, []);
```

#### 3. `app.json`
```json
{
  "plugins": [
    "expo-notifications",
    "@react-native-firebase/app",
    "@react-native-firebase/messaging"
  ],
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

### Backend (`apps/api/`)

**No changes needed!** 

Backend already supports both:
```typescript
// src/services/PushService.ts
private isExpoToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[');
}

async send(message: PushMessage): Promise<boolean> {
  if (this.isExpoToken(message.token)) {
    return this.sendExpo(message);  // Expo API
  } else {
    return this.sendFCM(message);   // FCM API ✅
  }
}
```

## Token Format Comparison

| Type | Format | Length | Example |
|------|--------|--------|---------|
| **Expo** | `ExponentPushToken[...]` | ~50 chars | `ExponentPushToken[xxxxxxxxxxxxxx]` |
| **FCM** | Hash string | ~150 chars | `cVL9x8Q2TQe9K5x...` |

## Build Requirements

### ⚠️ IMPORTANT: Cannot Use Expo Go

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| Expo Push | ✅ Works | ✅ Works |
| Firebase FCM | ❌ **Does NOT Work** | ✅ **Required** |

### Build a Development Client

```bash
cd apps/user-app

# Clean previous build
npx expo prebuild --clean

# Build for Android
npx expo run:android

# OR build with EAS
eas build --profile development --platform android
```

## Testing Checklist

- [ ] Build development client (not Expo Go)
- [ ] Install on device with Google Play Services
- [ ] Login to user-app
- [ ] Accept notification permission
- [ ] Check logs: `FCM push token obtained: ...`
- [ ] Verify DB: `SELECT * FROM push_tokens;` shows FCM token
- [ ] Test from driver-app: Enter user's phone
- [ ] User receives push notification with OTP code
- [ ] Driver enters code and completes registration

## Database

No schema changes needed. Same table:

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,  -- Now stores FCM tokens
  platform VARCHAR(10) NOT NULL,
  app VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## API Endpoints

No changes to API endpoints:

```http
POST /api/devices/register
Authorization: Bearer <token>

{
  "token": "cVL9x8Q2TQe...",  // FCM token now
  "platform": "android",
  "app": "user"
}
```

## Rollback Plan

If you need to rollback to Expo push:

1. Revert `apps/user-app/services/PushService.ts`:
   ```bash
   git checkout HEAD~1 apps/user-app/services/PushService.ts
   ```

2. Revert `apps/user-app/App.tsx`:
   ```bash
   git checkout HEAD~1 apps/user-app/App.tsx
   ```

3. Works immediately in Expo Go (no build needed)

## Benefits of FCM

✅ **Better Reliability** - Google's infrastructure
✅ **Native Integration** - Full iOS/Android support  
✅ **Background Messages** - Works when app closed
✅ **Token Refresh** - Automatic handling
✅ **Data Messages** - Can send silent notifications
✅ **Topic Subscriptions** - Group messaging

## Drawbacks

❌ **No Expo Go** - Requires development build
❌ **More Setup** - Need to prebuild native projects
❌ **Google Play Required** - Won't work on devices without it

## Files Modified

### User App
- `apps/user-app/services/PushService.ts` ✏️ Complete rewrite for FCM
- `apps/user-app/App.tsx` ✏️ Setup FCM handlers
- `apps/user-app/app.json` ✏️ Fixed plugin config
- `apps/user-app/google-services.json` ✅ Already present

### Backend
- No changes (already supports both token types)

### Documentation
- `apps/user-app/FIREBASE_PUSH_SETUP.md` ➕ New setup guide
- `FIREBASE_FCM_MIGRATION_SUMMARY.md` ➕ This file

## Next Steps

1. **Build Development Client:**
   ```bash
   cd apps/user-app
   npx expo prebuild --clean
   npx expo run:android
   ```

2. **Install on Physical Device** (or emulator with Google Play)

3. **Test Push Flow:**
   - Login to user-app
   - Accept notifications
   - Driver-app sends OTP
   - User receives notification

4. **Production Build:**
   ```bash
   eas build --profile production --platform android
   ```

## Support

- Firebase Setup: See `apps/user-app/FIREBASE_PUSH_SETUP.md`
- Push Flow: See `PUSH_NOTIFICATIONS_SETUP.md`
- Driver App: See `apps/driver-app/PUSH_NOTIFICATION_FIX.md`

---

**Migration Date:** January 30, 2025
**Status:** ✅ Complete - Ready for Dev Build
**Breaking Change:** Yes - Requires development build (cannot use Expo Go)

