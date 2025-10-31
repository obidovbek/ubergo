# Push Notification Fix Summary

## Issues Identified

From the terminal logs, two main issues were identified:

1. **Firebase Admin SDK Network Error**
   ```
   Firebase Admin SDK failed, falling back to legacy FCM: 
   Credential implementation provided to initializeApp() via the "credential" 
   property failed to fetch a valid Google OAuth2 access token with the 
   following error: "request to https://www.googleapis.com/oauth2/v4/token 
   failed, reason: Client network socket disconnected before secure TLS 
   connection was established".
   ```

2. **Legacy FCM API 404 Error**
   ```
   Failed to send OTP via push: Request failed with status code 404
   ```

## Root Causes

### Issue 1: Network Connectivity
- Docker container couldn't reach Google APIs (`googleapis.com`)
- DNS resolution or network connectivity problem in Docker
- Firebase Admin SDK couldn't authenticate

### Issue 2: Missing/Invalid FCM Server Key
- `FCM_SERVER_KEY` environment variable not configured
- Legacy FCM API endpoint returning 404
- No fallback mechanism when Firebase Admin SDK fails

## Changes Made

### 1. Enhanced `FirebaseService.ts`

**File**: `apps/api/src/services/FirebaseService.ts`

**Changes**:
- Added explicit file existence check before reading service account JSON
- Added `fs.readFileSync()` and `fs.existsSync()` imports
- Parse service account JSON explicitly instead of passing file path
- Added `initializationError` tracking for better diagnostics
- Added `getInitializationError()` function to expose errors
- Improved error logging with more context

**Benefits**:
- Better error messages when service account file is missing
- More robust initialization
- Easier debugging of Firebase Admin SDK issues

### 2. Improved `PushService.ts`

**File**: `apps/api/src/services/PushService.ts`

**Changes**:
- Enhanced error logging with emoji indicators (✅, ❌, ⚠️)
- Added detailed error information (error code, details, status)
- Better fallback mechanism explanation in logs
- Improved error handling for legacy FCM API
- Added validation for `FCM_SERVER_KEY` before attempting fallback
- More descriptive console messages at each step

**Benefits**:
- Easier to identify which push method is being used
- Clear indication of success/failure
- Detailed error information for troubleshooting
- Better user experience with informative error messages

### 3. Updated Docker Configuration

**File**: `infra/compose/docker-compose.dev.yml`

**Changes**:
- Added DNS servers (8.8.8.8, 8.8.4.4) to API service
- Added `FCM_SERVER_KEY` environment variable
- Mounted Firebase service account JSON file as read-only volume

```yaml
api:
  dns:
    - 8.8.8.8
    - 8.8.4.4
  environment:
    FCM_SERVER_KEY: ${FCM_SERVER_KEY}
  volumes:
    - ../../apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json:/app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json:ro
```

**Benefits**:
- Fixes DNS resolution issues in Docker
- Enables network connectivity to Google APIs
- Ensures Firebase service account file is available
- Properly configures FCM server key for fallback

### 4. Updated Environment Configuration

**File**: `infra/compose/env.example`

**Changes**:
- Added `FCM_SERVER_KEY` configuration section
- Added documentation about where to get the server key

**Benefits**:
- Clear documentation for developers
- Easy to find configuration requirements

## New Documentation

### 1. `FCM_SETUP_GUIDE.md`

Comprehensive guide covering:
- Prerequisites and configuration steps
- How Firebase push notifications work
- Troubleshooting common issues
- Testing procedures
- Security best practices
- API reference
- Migration notes

### 2. `apps/api/PUSH_NOTIFICATION_DEBUGGING.md`

Quick reference guide with:
- Quick diagnostic commands
- Common error messages and fixes
- Log message explanations
- Testing procedures
- Database queries for troubleshooting
- Network troubleshooting steps
- Code flow documentation

## How to Apply the Fix

### Step 1: Get FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **ubexgo-a2b4a**
3. Go to **Project Settings** → **Cloud Messaging**
4. Copy the **Server key** under "Cloud Messaging API (Legacy)"

### Step 2: Update Environment Variables

Add to `infra/compose/.env`:

```bash
# FCM Push Notifications Configuration
FCM_SERVER_KEY=your-server-key-from-firebase-console
```

### Step 3: Restart Docker Services

```bash
cd infra/compose
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Step 4: Verify

Check the logs for successful initialization:

```bash
docker logs ubexgo-api-dev | grep -i "firebase\|fcm"
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
```

## Testing

### Test Push OTP

```bash
curl -X POST http://localhost:4001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "78a8844e-c978-4f91-97bb-13dc6cc37dcb",
    "channel": "push"
  }'
```

### Expected Success Log Output

```
✅ Firebase Admin SDK initialized successfully
Detected FCM token, using FCM service
✅ Firebase Admin push sent successfully: [message-id]
```

Or if Firebase Admin SDK fails:

```
⚠️ Firebase Admin SDK not initialized, using legacy FCM
Sending via legacy FCM API to: https://fcm.googleapis.com/fcm/send
✅ Legacy FCM push sent successfully
```

## Architecture Overview

### Push Notification Flow

```
User Request (OTP with channel=push)
         ↓
AuthController.v2.ts
         ↓
OtpService.ts (finds user & push token)
         ↓
PushService.ts (determines token type)
         ↓
    ┌─────────────────┐
    │   FCM Token?    │
    └─────────────────┘
         ↓
    ┌─────────────────────────────────┐
    │                                 │
    ↓                                 ↓
Firebase Admin SDK              Expo Push Service
(Primary Method)                (For Expo tokens)
         ↓
    ┌─────────────────┐
    │   Success?      │
    └─────────────────┘
         │
    No   │   Yes
    ↓    └────────→ Return Success
Legacy FCM API
(Fallback Method)
         ↓
    Return Success/Failure
```

### Service Responsibilities

- **FirebaseService**: Initialize and manage Firebase Admin SDK
- **PushService**: Send notifications via FCM or Expo
- **OtpService**: Generate and deliver OTP codes
- **AuthController**: Handle authentication endpoints

## Performance Improvements

1. **Faster Error Detection**: Immediate fallback if Firebase Admin SDK unavailable
2. **Better Logging**: Clear identification of which method succeeded
3. **Network Resilience**: DNS configuration prevents network timeouts
4. **Graceful Degradation**: App continues to work if one method fails

## Security Improvements

1. **Service Account File**: Mounted as read-only in Docker
2. **Environment Variables**: Sensitive keys stored in `.env`
3. **Error Messages**: Don't expose sensitive information
4. **Token Validation**: Proper validation before sending

## Monitoring Recommendations

### Key Metrics to Track

1. **Push Success Rate**: Percentage of successful push deliveries
2. **Method Used**: Firebase Admin SDK vs Legacy FCM
3. **Error Rate**: Failed push attempts
4. **Latency**: Time to deliver push notification

### Logging to Monitor

```bash
# Watch for initialization
docker logs -f ubexgo-api-dev | grep "Firebase Admin"

# Watch for push attempts
docker logs -f ubexgo-api-dev | grep "push\|FCM"

# Watch for errors
docker logs -f ubexgo-api-dev | grep "❌\|Error"
```

## Future Improvements

1. **Retry Logic**: Automatic retry for failed pushes
2. **Queue System**: Use Redis/Bull for push notification queue
3. **Batch Sending**: Send multiple notifications at once
4. **Analytics**: Track delivery rates and user engagement
5. **A/B Testing**: Test different notification messages
6. **Silent Notifications**: Support for background data sync

## Rollback Plan

If issues occur after deployment:

1. **Quick Fix**: Remove push channel, use SMS only
   ```typescript
   // In OtpService.ts, temporarily disable push
   if (channel === 'push') {
     throw new Error('Push temporarily disabled, use SMS');
   }
   ```

2. **Revert Changes**: Git revert to previous version
   ```bash
   git revert HEAD
   docker-compose -f docker-compose.dev.yml restart api
   ```

3. **Environment Rollback**: Remove FCM_SERVER_KEY from `.env`

## Support

For issues or questions:

1. Check `PUSH_NOTIFICATION_DEBUGGING.md` for common issues
2. Review `FCM_SETUP_GUIDE.md` for setup instructions
3. Check Docker logs: `docker logs ubexgo-api-dev`
4. Verify environment variables are set correctly
5. Test network connectivity from container

## Summary

The push notification system is now:
- ✅ More robust with proper error handling
- ✅ Better documented with comprehensive guides
- ✅ Easier to debug with improved logging
- ✅ Network-resilient with DNS configuration
- ✅ Properly configured with environment variables
- ✅ Production-ready with fallback mechanisms

The main fixes address DNS/network issues in Docker and add proper FCM server key configuration for the legacy API fallback.

