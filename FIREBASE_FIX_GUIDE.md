# Firebase Push Notification Fix Guide

## Problem Summary

Your application was experiencing "SenderId mismatch" errors when sending push notifications. This was caused by using the wrong Firebase service account.

### Root Cause
- **Mobile Apps** (user-app & driver-app) were configured with Firebase project: `ubexgo-ae910`
- **Backend API** was using service account from Firebase project: `ubexgo-a2b4a`

This mismatch prevented the backend from sending push notifications to devices registered with the mobile apps.

---

## Solution Applied

### 1. ✅ Updated FirebaseService.ts
- Changed from: `ubexgo-a2b4a-firebase-adminsdk-fbsvc-b20007b906.json`
- Changed to: `ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
- Added better logging and error diagnostics

### 2. ✅ Updated Docker Configuration
- Added Cloudflare DNS (1.1.1.1) to the existing DNS servers
- Added `dns_search: []` to prevent DNS search domain issues
- Ensured proper network connectivity for Google APIs

### 3. ✅ Created Diagnostic Tools
- `apps/api/scripts/test-network.js` - Tests network connectivity from container
- `test-firebase-network.ps1` - PowerShell script to restart and diagnose

---

## How to Apply the Fix

### Step 1: Restart the API Container

Run the diagnostic script which will restart the container and test connectivity:

```powershell
.\test-firebase-network.ps1
```

**OR** manually restart:

```powershell
cd infra/compose
docker-compose -f docker-compose.dev.yml restart api
docker logs -f ubexgo-api-dev
```

### Step 2: Verify Firebase Initialization

Look for these log messages after restart:

```
🔥 Initializing Firebase Admin SDK from: /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
🔥 Service account loaded: { project_id: 'ubexgo-ae910', ... }
✅ Firebase Admin SDK initialized successfully for project: ubexgo-ae910
```

### Step 3: Test Push Notification

Try sending an OTP via push notification:

1. Open your mobile app (user or driver)
2. Enter phone number: `+998916610061` (or your test number)
3. Select channel: **Push Notification**
4. Click "Send OTP"

Watch the API logs for:

```
📤 Sending FCM push notification via Firebase Admin SDK...
✅ Firebase Admin SDK: Push notification sent successfully
   Message ID: projects/ubexgo-ae910/messages/...
```

---

## Troubleshooting

### Issue: Network Connectivity Errors

**Error Message:**
```
Client network socket disconnected before secure TLS connection was established
```

**Solutions:**

1. **Check Docker DNS Settings:**
   ```powershell
   docker exec ubexgo-api-dev cat /etc/resolv.conf
   ```
   Should show: `nameserver 8.8.8.8`, `nameserver 8.8.4.4`, `nameserver 1.1.1.1`

2. **Test Network from Container:**
   ```powershell
   docker exec ubexgo-api-dev node /app/scripts/test-network.js
   ```

3. **Check Firewall/Antivirus:**
   - Ensure Docker Desktop has network access
   - Check if firewall is blocking outbound HTTPS (port 443)
   - Temporarily disable antivirus to test

4. **Restart Docker Desktop:**
   Sometimes Docker's network stack needs a restart:
   - Right-click Docker Desktop tray icon
   - Select "Restart"
   - Wait for Docker to fully restart
   - Run `test-firebase-network.ps1` again

5. **Try Alternative DNS:**
   If still failing, edit `infra/compose/docker-compose.dev.yml`:
   ```yaml
   dns:
     - 1.1.1.1     # Cloudflare (often more reliable)
     - 8.8.8.8     # Google
     - 8.8.4.4     # Google backup
   ```

### Issue: SenderId Mismatch (if it returns)

This means the mobile app is still using tokens from a different Firebase project.

**Solution:**
1. Uninstall the mobile app completely
2. Rebuild and reinstall the app
3. This will generate a new FCM token for the correct project

### Issue: Invalid Registration Token

**Error Message:**
```
messaging/invalid-registration-token
```

**Solution:**
1. The FCM token stored in the database is invalid/expired
2. The user needs to log out and log back in to generate a new token
3. Or clear app data and restart the app

---

## File Changes Summary

### Modified Files:
- `apps/api/src/services/FirebaseService.ts` - Updated to use correct service account
- `infra/compose/docker-compose.dev.yml` - Enhanced DNS configuration

### New Files Created:
- `apps/api/scripts/test-network.js` - Network diagnostics tool
- `test-firebase-network.ps1` - PowerShell restart and test script
- `FIREBASE_FIX_GUIDE.md` - This guide

---

## Verification Checklist

- [ ] API container restarted successfully
- [ ] Firebase initialization logs show `ubexgo-ae910` project
- [ ] Network diagnostics pass (DNS and HTTPS connectivity)
- [ ] Push notification sends successfully
- [ ] Mobile app receives the push notification
- [ ] OTP code appears in the notification

---

## Project Configuration Reference

### Mobile Apps Configuration
- **User App**: `apps/user-app/google-services.json`
- **Driver App**: `apps/driver-app/google-services.json`
- **Project**: `ubexgo-ae910`
- **Project Number**: `265820506317`

### Backend Configuration
- **Service Account**: `apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
- **Project**: `ubexgo-ae910` ✅ (matches mobile apps)
- **Service Account Email**: `firebase-adminsdk-fbsvc@ubexgo-ae910.iam.gserviceaccount.com`

---

## Next Steps

1. Run the diagnostic script to verify the fix
2. Test push notifications with a real device
3. Monitor logs for any errors
4. If network issues persist, try the troubleshooting steps above

For additional help, check the Firebase Admin SDK documentation:
https://firebase.google.com/docs/admin/setup

---

## Success Indicators

When everything is working correctly, you should see:

1. **At Container Startup:**
   ```
   🔥 Firebase Admin SDK initialized successfully for project: ubexgo-ae910
   ```

2. **When Sending Push Notification:**
   ```
   Detected FCM token, using FCM service
   📤 Sending FCM push notification via Firebase Admin SDK...
   ✅ Firebase Admin SDK: Push notification sent successfully
   ```

3. **On Mobile Device:**
   - Notification appears with the OTP code
   - Title: "Your OTP Code"
   - Body: "Your verification code is: XXXX"

---

*Last Updated: October 31, 2025*

