# 🚀 Quick Start: Firebase Push Notification Fix

## The Problem
❌ **SenderId mismatch** - Backend was using wrong Firebase project (`ubexgo-a2b4a` instead of `ubexgo-ae910`)

## The Fix Applied
✅ Updated backend to use correct service account matching your mobile apps

---

## Run This Now

### Option 1: Automated Script (Recommended)
```powershell
.\test-firebase-network.ps1
```

### Option 2: Manual Restart
```powershell
cd infra/compose
docker-compose -f docker-compose.dev.yml restart api
docker logs -f ubexgo-api-dev
```

---

## What You Should See

### ✅ Success Logs:
```
🔥 Service account loaded: { project_id: 'ubexgo-ae910', ... }
✅ Firebase Admin SDK initialized successfully for project: ubexgo-ae910
```

### ✅ When Testing Push Notification:
```
📤 Sending FCM push notification via Firebase Admin SDK...
✅ Firebase Admin SDK: Push notification sent successfully
   Message ID: projects/ubexgo-ae910/messages/...
```

---

## If Network Error Persists

The new error (`Client network socket disconnected`) is a Docker networking issue, NOT a Firebase config issue.

### Quick Fixes:

1. **Restart Docker Desktop**
   - Right-click Docker tray icon → Restart
   - Wait 30 seconds
   - Run the script again

2. **Check Firewall**
   - Ensure Docker has internet access
   - Check Windows Firewall settings
   - Temporarily disable antivirus to test

3. **Test Network from Container**
   ```powershell
   docker exec ubexgo-api-dev node /app/scripts/test-network.js
   ```

---

## Test the Fix

1. Open your mobile app
2. Enter phone: `+998916610061`
3. Select: **Push Notification** channel
4. Click: **Send OTP**
5. Check: Notification appears on device

---

## Files Changed

- ✅ `apps/api/src/services/FirebaseService.ts` - Using correct service account
- ✅ `infra/compose/docker-compose.dev.yml` - Better DNS configuration
- 📝 Created diagnostic tools and guides

---

## Need More Help?

See detailed troubleshooting in: **FIREBASE_FIX_GUIDE.md**

---

**Status:** ✅ Firebase configuration fixed, network connectivity testing needed

