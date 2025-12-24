# Push Notification Fix - Offer Join/Accept/Reject Flow

## Problem Summary

Push notifications were working for driver registration (OTP flow) but NOT working for:
1. **User joins driver offer** → Driver should receive notification
2. **Driver accepts/rejects user request** → User should receive notification  
3. **Driver joins passenger offer** → Passenger should receive notification
4. **Passenger accepts/rejects driver request** → Driver should receive notification

## Root Causes Identified

### 1. Missing `is_active` Field in PushToken Model
**Problem:** The service code was querying `PushToken` with `is_active: true`, but this field didn't exist in the model definition.

**Location:** `src/database/models/PushToken.ts`

**Fix Applied:**
- Added `is_active: boolean` to `PushTokenAttributes` interface
- Added `is_active` declaration to `PushToken` class
- Added `is_active` field to model schema with default value `true`

### 2. Missing `app` Field Filtering
**Problem:** The notification services were NOT filtering push tokens by the `app` field ('user' or 'driver'). This meant:
- Notifications to drivers might be sent to their user app tokens (wrong app)
- Notifications to passengers might be sent to their driver app tokens (wrong app)

**Locations Fixed:**
- `src/services/OfferPassengerService.ts` - notifyDriver() and notifyPassenger()
- `src/services/OfferDriverService.ts` - notifyDriver() and notifyPassenger()
- `src/services/PassengerOfferService.ts` - notifyDriver()
- `src/services/DriverOfferService.ts` - notifyPassenger()

**Fix Applied:**
```typescript
// Before (WRONG - no app filtering)
const tokens = await PushToken.findAll({
  where: { user_id: driverId, is_active: true }
});

// After (CORRECT - filters by app)
const tokens = await PushToken.findAll({
  where: { 
    user_id: driverId, 
    app: 'driver',  // ← Critical: only driver app tokens
    is_active: true 
  }
});
```

### 3. Improved Error Handling
**Enhancement:** Added better error detection for invalid/unregistered tokens:
```typescript
if (error instanceof Error && (
  error.message.includes('invalid') || 
  error.message.includes('not-registered')
)) {
  await token.update({ is_active: false });
  console.log(`Deactivated invalid token for user ${userId}`);
}
```

### 4. Enhanced Logging
**Enhancement:** Added detailed logging to help debug push notification issues:
```typescript
console.log(`Sending push notification to driver ${driverId} (${tokens.length} tokens)`);
console.log(`✅ Push sent to driver ${driverId} token: ${token.token.substring(0, 20)}...`);
```

## Database Migration Required

**File:** `src/database/migrations/20251224000001-add-is-active-to-push-tokens.cjs`

**Run this migration:**
```bash
cd api,admin,db/apps/api
npm run migrate
```

This migration:
1. Adds `is_active` BOOLEAN column (default: true)
2. Creates composite index on `(user_id, app, is_active)` for performance

## Files Modified

### Backend (API)
1. ✅ `src/database/models/PushToken.ts` - Added `is_active` field
2. ✅ `src/services/OfferPassengerService.ts` - Fixed app filtering + logging
3. ✅ `src/services/OfferDriverService.ts` - Fixed app filtering + logging
4. ✅ `src/services/PassengerOfferService.ts` - Fixed app filtering + logging
5. ✅ `src/services/DriverOfferService.ts` - Fixed app filtering + logging
6. ✅ `src/database/migrations/20251224000001-add-is-active-to-push-tokens.cjs` - New migration

### Frontend (No Changes Required)
The frontend apps (user-app-standalone and driver-app-standalone) already correctly:
- Register push tokens with the correct `app` field ('user' or 'driver')
- Handle incoming push notifications
- No changes needed

## Testing Checklist

### 1. Test User Joins Driver Offer
- [ ] User searches for offers and joins one
- [ ] Driver app should receive push notification
- [ ] Check backend logs for: "Sending push notification to driver X (N tokens)"
- [ ] Check backend logs for: "✅ Push sent to driver X token: ..."

### 2. Test Driver Accepts User Request
- [ ] Driver accepts a pending passenger request
- [ ] User app should receive push notification
- [ ] Check backend logs for: "Sending push notification to passenger X (N tokens)"
- [ ] Check backend logs for: "✅ Push sent to passenger X token: ..."

### 3. Test Driver Rejects User Request
- [ ] Driver rejects a pending passenger request
- [ ] User app should receive push notification with rejection reason
- [ ] Check backend logs for notification delivery

### 4. Test Driver Joins Passenger Offer
- [ ] Driver responds to a passenger offer
- [ ] User app should receive push notification
- [ ] Check backend logs for notification delivery

### 5. Test Passenger Accepts/Rejects Driver
- [ ] Passenger accepts/rejects a driver offer
- [ ] Driver app should receive push notification
- [ ] Check backend logs for notification delivery

## Verification Steps

1. **Run Migration:**
   ```bash
   cd api,admin,db/apps/api
   npm run migrate
   ```

2. **Restart API Server:**
   ```bash
   npm run dev
   ```

3. **Check Database:**
   ```sql
   -- Verify is_active column exists
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'push_tokens';
   
   -- Check existing tokens
   SELECT id, user_id, app, is_active, platform 
   FROM push_tokens 
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```

4. **Test Push Notifications:**
   - Open user app and driver app on test devices
   - Ensure both apps have registered push tokens
   - Test all scenarios listed above
   - Monitor backend logs for push notification delivery

## Expected Behavior After Fix

### When User Joins Driver Offer:
1. User taps "Join" on a driver's offer
2. Backend creates `OfferPassenger` record with status='pending'
3. Backend queries: `PushToken.findAll({ where: { user_id: driverId, app: 'driver', is_active: true } })`
4. Backend sends push notification to driver's device(s)
5. Driver app receives notification and shows badge/alert

### When Driver Accepts/Rejects:
1. Driver taps "Accept" or "Reject" on a passenger request
2. Backend updates `OfferPassenger` status
3. Backend queries: `PushToken.findAll({ where: { user_id: passengerId, app: 'user', is_active: true } })`
4. Backend sends push notification to user's device(s)
5. User app receives notification and updates booking status

## Why OTP Push Worked But Offer Push Didn't

The OTP service (`OtpService.ts` line 278-279) was already correctly filtering by app:
```typescript
const push = await PushToken.findOne({
  where: { user_id: user.id, app: 'user' },  // ✅ Correct
  order: [['updated_at', 'DESC']],
});
```

But the offer services were missing this filter, causing them to:
1. Query for tokens without `app` filter → SQL error (is_active doesn't exist)
2. Even if is_active existed, would send to wrong app

## Additional Notes

- The `app` field in `PushToken` is critical for multi-app architecture
- Each user can have tokens for BOTH 'user' and 'driver' apps
- Always filter by `app` field when sending notifications
- The `is_active` field helps manage invalid/expired tokens
- Invalid tokens are automatically deactivated on send failure

## Monitoring

After deployment, monitor these logs:
- `"Sending push notification to driver X (N tokens)"` - Should show N > 0
- `"Sending push notification to passenger X (N tokens)"` - Should show N > 0
- `"No active push tokens found"` - Indicates user hasn't registered device
- `"✅ Push sent to"` - Confirms successful delivery
- `"Deactivated invalid token"` - Indicates token cleanup

## Related Documentation

- See `PUSH_NOTIFICATIONS_COMPLETE.md` for overall push notification architecture
- See `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` for implementation details
- See `PUSH_NOTIFICATIONS_DIAGRAM.md` for flow diagrams

