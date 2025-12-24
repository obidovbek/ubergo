# Push Notification Fix - Action Items

## 🚨 Critical Issue Found

**The driver app was NOT registering push tokens!**

From logs (line 710-711):
```
SELECT ... WHERE "user_id" = 2 AND "app" = 'driver' AND "is_active" = true;
No active push tokens found for driver 2 (driver app)
```

Database shows user_id 2 has 4 tokens, but **all have `app = 'user'`**, none have `app = 'driver'`.

## ✅ What Was Fixed

### Backend (Already Done)
- ✅ Added `is_active` field to PushToken model
- ✅ Updated all services to filter by `app` field
- ✅ Created migration: `20251224000001-add-is-active-to-push-tokens.cjs`
- ✅ Enhanced logging

### Driver App (NEW)
- ✅ Created `services/PushService.ts` - Push notification service
- ✅ Created `api/devices.ts` - Device registration API
- ✅ Updated `contexts/AuthContext.tsx` - Register tokens on login
- ✅ Updated `App.tsx` - Setup Firebase messaging

## 🔧 Required Actions

### 1. Run Backend Migration
```bash
cd api,admin,db/apps/api
npm run migrate
```

Expected output:
```
== 20251224000001-add-is-active-to-push-tokens: migrating =======
== 20251224000001-add-is-active-to-push-tokens: migrated (0.123s)
```

### 2. Restart Backend
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Rebuild Driver App (CRITICAL!)
The driver app MUST be rebuilt to include the new push notification code:

```bash
cd driver-app-standalone

# Clean build (recommended)
cd android
./gradlew clean
cd ..

# Rebuild and install
npm run android
# or
npx expo run:android
```

**⚠️ Important:** Simply reloading the app (Ctrl+R) won't work - you need a full rebuild!

### 4. Test Driver Token Registration

**Open driver app and check logs:**
```
Registering FCM push token with backend (DRIVER APP): <token>
FCM push token registered successfully (DRIVER APP)
```

**Verify in database:**
```sql
SELECT id, user_id, app, platform, is_active, 
       substring(token, 1, 30) as token_preview,
       updated_at 
FROM push_tokens 
WHERE user_id = 2 
ORDER BY updated_at DESC;
```

Expected result:
```
user_id | app    | is_active | updated_at
--------|--------|-----------|------------------
2       | driver | t         | 2025-12-24 10:30  ← NEW!
2       | user   | t         | 2025-12-24 09:05
2       | user   | t         | 2025-12-10 06:56
...
```

### 5. Test Push Notification Flow

**Test 1: User Joins Driver Offer**
1. User app: Search and join an offer
2. Backend logs should show:
   ```
   Sending push notification to driver 2 (1 tokens)
   ✅ Push sent to driver 2 token: dvlwX9OgRbKySQv...
   ```
3. Driver app should receive notification
4. Driver can see the new passenger request

**Test 2: Driver Accepts/Rejects**
1. Driver app: Accept or reject a passenger
2. Backend logs should show:
   ```
   Sending push notification to passenger 5 (1 tokens)
   ✅ Push sent to passenger 5 token: e7Aoanh9QWCCQp...
   ```
3. User app should receive notification
4. User can see updated booking status

## 🐛 Troubleshooting

### "No active push tokens found for driver X (driver app)"

**Check 1:** Did you rebuild the driver app?
```bash
cd driver-app-standalone
npm run android
```

**Check 2:** Did the driver open the app after rebuild?
- Driver must open the app for token to register
- Check app logs for "Registering FCM push token"

**Check 3:** Are permissions granted?
- Android 13+: Check notification permissions in Settings
- App should request permission on first launch

### Token Registered But No Notifications

**Check 1:** Verify token in database
```sql
SELECT * FROM push_tokens 
WHERE user_id = 2 AND app = 'driver' AND is_active = true;
```

**Check 2:** Check Firebase configuration
- Verify `google-services.json` has correct project
- Package name: `com.obidovbek94.UbexGoDriver`
- Project: `ubexgo-ae910`

**Check 3:** Check backend logs
- Should show "Sending push notification to driver X (N tokens)"
- Should show "✅ Push sent to driver X token: ..."
- If shows error, check Firebase service account JSON

### "Firebase messaging module not available"

**Solution:** Rebuild with native modules
```bash
cd driver-app-standalone/android
./gradlew clean
cd ..
npm run android
```

## 📊 Verification Commands

### Check Push Tokens by App
```sql
SELECT app, COUNT(*) as count, 
       COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM push_tokens 
GROUP BY app;
```

Expected:
```
app    | count | active_count
-------|-------|-------------
user   | 7     | 7
driver | 1     | 1            ← Should appear after fix
```

### Check Specific User's Tokens
```sql
SELECT user_id, app, platform, is_active, 
       substring(token, 1, 30) as token_preview,
       updated_at 
FROM push_tokens 
WHERE user_id = 2  -- Replace with your driver's user_id
ORDER BY updated_at DESC;
```

### Monitor Push Notifications
```bash
# Watch backend logs
docker-compose logs -f api

# Look for:
# "Sending push notification to driver X (N tokens)"
# "✅ Push sent to driver X token: ..."
# "No active push tokens found" ← Should NOT appear after fix
```

## 🎯 Success Criteria

- ✅ Backend migration completed
- ✅ Backend services updated
- ✅ Driver app rebuilt
- ✅ Driver opens app
- ✅ Database shows driver token with `app = 'driver'`
- ✅ User joins offer → Driver receives push
- ✅ Driver accepts → User receives push
- ✅ Backend logs show successful delivery

## 📝 Notes

- **User app** already had push notifications working correctly
- **Driver app** was completely missing push notification setup
- The OTP flow worked because it sent push to **user app**, not driver app
- Each user can have tokens for BOTH apps (user and driver)
- Always filter by `app` field when querying tokens

## 🔗 Related Files

**Backend:**
- `src/database/models/PushToken.ts`
- `src/services/OfferPassengerService.ts`
- `src/services/OfferDriverService.ts`
- `src/services/PassengerOfferService.ts`
- `src/services/DriverOfferService.ts`
- `src/database/migrations/20251224000001-add-is-active-to-push-tokens.cjs`

**Driver App:**
- `services/PushService.ts` (NEW)
- `api/devices.ts` (NEW)
- `contexts/AuthContext.tsx` (UPDATED)
- `App.tsx` (UPDATED)

**Documentation:**
- `PUSH_NOTIFICATION_COMPLETE_FIX.md` - This file
- `api,admin,db/apps/api/PUSH_NOTIFICATION_FIX.md` - Backend details
- `api,admin,db/apps/api/PUSH_FIX_QUICK_START.md` - Quick start

