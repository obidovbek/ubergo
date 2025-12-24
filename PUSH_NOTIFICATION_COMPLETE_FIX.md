# Complete Push Notification Fix - Driver & User Apps

## Problem Diagnosis

From the logs, we identified the **root cause**:

```
Line 710: SELECT ... FROM "push_tokens" WHERE "user_id" = 2 AND "app" = 'driver' AND "is_active" = true;
Line 711: No active push tokens found for driver 2 (driver app)
```

**Database shows:**
- User ID 2 (driver Bekzod Obidov) has 4 push tokens
- **ALL tokens have `app = 'user'`** (none have `app = 'driver'`)
- The driver app was **NOT registering push tokens at all!**

## Two-Part Solution

### Part 1: Backend Fixes (Already Applied) ✅

1. **Added `is_active` field to PushToken model**
2. **Fixed all services to filter by `app` field**
3. **Created database migration**
4. **Enhanced logging**

### Part 2: Driver App Fixes (NEW) ✅

The driver app was completely missing push notification registration!

## Files Created/Modified in Driver App

### 1. **NEW: `driver-app-standalone/services/PushService.ts`**
Complete push notification service for driver app:
- `ensurePushPermission()` - Request notification permissions
- `getFcmPushToken()` - Get FCM token from Firebase
- `registerPushTokenWithBackend()` - Register with backend **as 'driver' app**
- `subscribeTokenRefresh()` - Handle token refresh events
- `setupForegroundNotificationHandler()` - Handle foreground notifications

**Key difference from user app:**
```typescript
await registerDevice(apiToken, {
  token,
  platform: Platform.OS === 'ios' ? 'ios' : 'android',
  app: 'driver', // ← CRITICAL: This is the driver app
});
```

### 2. **NEW: `driver-app-standalone/api/devices.ts`**
API client for device registration:
```typescript
export const registerDevice = async (
  token: string,
  body: { token: string; platform: 'android' | 'ios'; app?: 'user' | 'driver' }
)
```

### 3. **UPDATED: `driver-app-standalone/contexts/AuthContext.tsx`**
Added push token registration in three places:

**A. Import:**
```typescript
import { registerPushTokenWithBackend, subscribeTokenRefresh } from '../services/PushService';
```

**B. After initialization (when app starts with existing token):**
```typescript
// Register push token with backend (DRIVER APP)
registerPushTokenWithBackend(token).catch((error) => {
  console.error('Failed to register push token on init:', error);
});
```

**C. After OTP verification (when driver logs in):**
```typescript
// Register push token with backend after successful login (DRIVER APP)
registerPushTokenWithBackend(access).catch((error) => {
  console.error('Failed to register push token after OTP verification:', error);
});
```

**D. New useEffect for token management:**
```typescript
// Register push token when authenticated (DRIVER APP)
useEffect(() => {
  let unsubscribe: (() => void) | undefined;
  if (state.token) {
    registerPushTokenWithBackend(state.token).catch((error) => {
      console.error('Failed to register push token:', error);
    });
    unsubscribe = subscribeTokenRefresh(state.token);
  }
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [state.token]);
```

### 4. **UPDATED: `driver-app-standalone/App.tsx`**
Added Firebase messaging setup:

**A. Background message handler (module level):**
```typescript
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('FCM message handled in background (DRIVER APP):', remoteMessage);
    });
  } catch (error) {
    console.warn('Firebase messaging module not available:', error);
  }
}
```

**B. Foreground setup in useEffect:**
```typescript
// Only setup push notifications on native platforms
let unsubscribeForeground: (() => void) | undefined;
if (Platform.OS !== 'web') {
  // Request push permissions on startup
  ensurePushPermission().catch((error) => {
    console.error('Error requesting push permissions:', error);
  });

  // Setup foreground notification handler
  unsubscribeForeground = setupForegroundNotificationHandler();
}
```

## Testing Steps

### Step 1: Run Backend Migration
```bash
cd api,admin,db/apps/api
npm run migrate
```

### Step 2: Restart Backend
```bash
npm run dev
```

### Step 3: Rebuild Driver App
The driver app needs to be rebuilt to include the new push notification code:

```bash
cd driver-app-standalone

# For Android
npm run android
# or
npx expo run:android
```

### Step 4: Test Push Notifications

1. **Open driver app** - It should now register a push token with `app = 'driver'`
2. **Check logs:** Look for "Registering FCM push token with backend (DRIVER APP)"
3. **Verify in database:**
   ```sql
   SELECT id, user_id, app, platform, is_active, updated_at 
   FROM push_tokens 
   WHERE user_id = 2 
   ORDER BY updated_at DESC;
   ```
   You should now see a token with `app = 'driver'`

4. **Test notification flow:**
   - User joins driver's offer
   - Check backend logs: "Sending push notification to driver 2 (1 tokens)"
   - Check backend logs: "✅ Push sent to driver 2 token: ..."
   - Driver app should receive notification

## Expected Database State After Fix

```sql
-- Before (BROKEN):
user_id | app    | tokens
--------|--------|-------
2       | user   | 4      ← Driver has only user app tokens
5       | user   | 1      ← Passenger has user app tokens

-- After (FIXED):
user_id | app    | tokens
--------|--------|-------
2       | user   | 4      ← Driver's user app tokens
2       | driver | 1      ← Driver's driver app token (NEW!)
5       | user   | 1      ← Passenger's user app tokens
```

## Why This Was Missed

The driver app was created by copying from the user app, but the push notification setup was not copied over. The driver registration flow (OTP via push to user app) worked because:
1. Driver opens user app first
2. User app registers token with `app = 'user'`
3. Driver then opens driver app to enter OTP
4. Driver app never registered its own token

## Verification Checklist

- [ ] Backend migration ran successfully
- [ ] Backend services updated (4 files)
- [ ] Driver app has `PushService.ts`
- [ ] Driver app has `api/devices.ts`
- [ ] Driver app `AuthContext.tsx` registers tokens
- [ ] Driver app `App.tsx` has Firebase setup
- [ ] Driver app rebuilt with new code
- [ ] Driver opens app and token is registered
- [ ] Database shows token with `app = 'driver'` for driver user
- [ ] User joins offer → Driver receives push notification
- [ ] Driver accepts/rejects → User receives push notification

## Monitoring

After deploying, watch for these logs:

**Driver App Logs:**
```
Registering FCM push token with backend (DRIVER APP): <token>
FCM push token registered successfully (DRIVER APP)
FCM message received in foreground (DRIVER APP): { ... }
```

**Backend Logs:**
```
Sending push notification to driver 2 (1 tokens)
✅ Push sent to driver 2 token: dvlwX9OgRbKySQv...
```

## Common Issues & Solutions

### Issue: "No active push tokens found for driver X (driver app)"
**Cause:** Driver hasn't opened the driver app since the update

**Solution:** 
1. Rebuild driver app: `npm run android`
2. Open driver app
3. Check logs for token registration
4. Verify in database

### Issue: Token registered but notifications still not received
**Check:**
1. Firebase service account JSON is correct
2. Driver app is using correct Firebase project (ubexgo-ae910)
3. Package name matches: `com.obidovbek94.UbexGoDriver`
4. Token is active: `SELECT * FROM push_tokens WHERE user_id = X AND app = 'driver'`

### Issue: "Firebase messaging module not available"
**Cause:** Native modules not linked

**Solution:**
```bash
cd driver-app-standalone/android
./gradlew clean
cd ..
npm run android
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUSH NOTIFICATION FLOW                   │
└─────────────────────────────────────────────────────────────────┘

USER APP (app='user')                    BACKEND                    DRIVER APP (app='driver')
─────────────────────                    ───────                    ──────────────────────────
                                                                    
1. App starts                            2. POST /devices/register  1. App starts
   ├─ Get FCM token                         ├─ Save to push_tokens     ├─ Get FCM token
   ├─ Register with backend                 │   {                       ├─ Register with backend
   │  { token, app: 'user' }                │     user_id: 2,           │  { token, app: 'driver' }
   └─ Listen for notifications              │     app: 'driver',        └─ Listen for notifications
                                            │     token: '...',
                                            │     is_active: true
                                            │   }
                                            └─ Return success

3. User joins offer                      4. Query push_tokens       5. Driver receives push
   ├─ POST /passenger/offers/:id/join       WHERE user_id = 2           ├─ FCM delivers message
   └─ Success                               AND app = 'driver'           ├─ Show notification
                                            AND is_active = true         └─ Refresh passengers list
                                            ├─ Found 1 token
                                            └─ Send via FCM

6. Driver accepts                        7. Query push_tokens       8. User receives push
   ├─ POST /driver/passengers/:id/confirm   WHERE user_id = 5           ├─ FCM delivers message
   └─ Success                               AND app = 'user'             ├─ Show notification
                                            AND is_active = true         └─ Refresh bookings
                                            ├─ Found 1 token
                                            └─ Send via FCM
```

## Related Documentation

- `api,admin,db/apps/api/PUSH_NOTIFICATION_FIX.md` - Backend technical details
- `api,admin,db/apps/api/PUSH_FIX_QUICK_START.md` - Quick start guide
- `api,admin,db/apps/api/PUSH_NOTIFICATIONS_COMPLETE.md` - Overall architecture

## Summary

**Backend Issue:** Services weren't filtering by `app` field and `is_active` field was missing
**Frontend Issue:** Driver app wasn't registering push tokens at all

**Both issues are now fixed!** 🎉

