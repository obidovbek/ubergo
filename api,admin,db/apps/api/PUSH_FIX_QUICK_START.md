# Push Notification Fix - Quick Start Guide

## What Was Fixed

Push notifications now work for:
- ✅ User joins driver offer → Driver receives notification
- ✅ Driver accepts/rejects user → User receives notification
- ✅ Driver joins passenger offer → Passenger receives notification
- ✅ Passenger accepts/rejects driver → Driver receives notification

## Quick Setup (3 Steps)

### Step 1: Run Database Migration
```bash
cd api,admin,db/apps/api
npm run migrate
```

This adds the `is_active` field to the `push_tokens` table.

### Step 2: Restart API Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test
1. Open user app on one device
2. Open driver app on another device
3. Create a driver offer
4. Join the offer from user app
5. Check if driver receives push notification

## What Changed

### Backend Files Modified:
1. `src/database/models/PushToken.ts` - Added `is_active` field
2. `src/services/OfferPassengerService.ts` - Fixed notification filtering
3. `src/services/OfferDriverService.ts` - Fixed notification filtering
4. `src/services/PassengerOfferService.ts` - Fixed notification filtering
5. `src/services/DriverOfferService.ts` - Fixed notification filtering
6. `src/database/migrations/20251224000001-add-is-active-to-push-tokens.cjs` - New migration

### Key Fix:
All push notification queries now filter by `app` field:
```typescript
// For driver notifications
where: { user_id: driverId, app: 'driver', is_active: true }

// For passenger notifications  
where: { user_id: passengerId, app: 'user', is_active: true }
```

## Troubleshooting

### "No active push tokens found"
**Cause:** User hasn't opened the app or push token registration failed

**Solution:**
1. Open the app (user or driver)
2. Grant notification permissions
3. Check backend logs for token registration
4. Query database: `SELECT * FROM push_tokens WHERE user_id = X AND app = 'user/driver'`

### Migration Fails
**Error:** "column is_active already exists"

**Solution:** Migration already ran, skip to Step 2

### Still No Notifications
**Check:**
1. Firebase service account JSON is correct
2. Both apps are using correct Firebase projects
3. Push tokens are registered: `SELECT * FROM push_tokens WHERE is_active = true`
4. Backend logs show: "Sending push notification to driver/passenger X (N tokens)"

## Verify Database

```sql
-- Check if is_active column exists
\d push_tokens

-- Check active tokens by app
SELECT app, COUNT(*) as count 
FROM push_tokens 
WHERE is_active = true 
GROUP BY app;

-- Check specific user's tokens
SELECT id, user_id, app, platform, is_active, updated_at 
FROM push_tokens 
WHERE user_id = YOUR_USER_ID 
ORDER BY updated_at DESC;
```

## Next Steps

After confirming notifications work:
1. Test all notification scenarios (see PUSH_NOTIFICATION_FIX.md)
2. Monitor backend logs for any errors
3. Check notification delivery rates
4. Consider adding notification history/audit log

## Related Files

- `PUSH_NOTIFICATION_FIX.md` - Detailed technical documentation
- `PUSH_NOTIFICATIONS_COMPLETE.md` - Overall architecture
- `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Implementation guide

