# Firebase Cloud Messaging (FCM) Setup Guide

**Modern Implementation Using Firebase Admin SDK**

This guide explains the secure, Google-recommended approach for push notifications using Firebase Admin SDK with service account authentication.

## 🎯 Overview

The system uses **Firebase Admin SDK** with the **FCM HTTP v1 API** - the modern, secure method recommended by Google. We do **NOT** use the deprecated Legacy FCM API or server keys.

## ✅ What You Get

- **🔐 Secure**: OAuth 2.0 authentication via service account
- **🚀 Modern**: Uses FCM HTTP v1 API (latest version)
- **📱 Reliable**: Better error handling and token management
- **✨ Future-proof**: Recommended by Google for long-term support

## 🏗️ Architecture

### Authentication Flow

```
Firebase Admin SDK
        ↓
Service Account JSON
(ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json)
        ↓
OAuth 2.0 Token Generation
(handled automatically by SDK)
        ↓
FCM HTTP v1 API
(fcm.googleapis.com)
        ↓
Push Notification Delivered
```

### Key Components

1. **Service Account File**: `ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
   - Contains private key and credentials
   - Used by Firebase Admin SDK for authentication
   - Already included in project

2. **Firebase Admin SDK**: Node.js library
   - Handles OAuth 2.0 token generation automatically
   - Provides type-safe API for push notifications
   - Manages token refresh and validation

3. **FCM HTTP v1 API**: Google's latest messaging API
   - More secure than legacy API
   - Better error messages
   - Enhanced features

## 📦 Prerequisites

✅ All prerequisites are already met:

- [x] Firebase project created: **ubexgo-a2b4a**
- [x] Service account JSON file present
- [x] Firebase Admin SDK installed (`firebase-admin` npm package)
- [x] Docker configuration with DNS servers

## 🚀 Setup (Already Complete!)

The system is already configured. No manual setup needed!

### What's Already Done

1. ✅ Service account file in place: `apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
2. ✅ FirebaseService.ts initializes SDK on app startup
3. ✅ PushService.ts uses Firebase Admin SDK for sending
4. ✅ Docker mounts service account file as read-only
5. ✅ DNS servers configured (8.8.8.8, 8.8.4.4) for Google API access

### File Locations

```
apps/api/
├── ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json  ← Service account
├── src/
│   ├── services/
│   │   ├── FirebaseService.ts   ← SDK initialization
│   │   ├── PushService.ts       ← Push notification sending
│   │   └── OtpService.ts        ← OTP delivery (including push)
│   └── app.ts                   ← Calls initializeFirebase()
```

## 🔧 How It Works

### 1. Initialization (on app startup)

```typescript
// apps/api/src/app.ts
import { initializeFirebase } from './services/FirebaseService.js';

initializeFirebase(); // Called once on startup
```

### 2. Firebase Service

```typescript
// apps/api/src/services/FirebaseService.ts
import admin from 'firebase-admin';

export function initializeFirebase(): void {
  // Read service account JSON
  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf8')
  );

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
```

### 3. Sending Push Notifications

```typescript
// apps/api/src/services/PushService.ts
async sendFCM(message: PushMessage): Promise<boolean> {
  const admin = getFirebaseAdmin();
  const messaging = admin.messaging();

  // Send via FCM HTTP v1 API
  const response = await messaging.send({
    notification: {
      title: message.title,
      body: message.body,
    },
    token: message.token,
    // ... other options
  });

  return true;
}
```

## 📱 Push Notification Flow

### Complete Flow Diagram

```
User Opens App
      ↓
Register Device Token (FCM token from device)
      ↓
Store in push_tokens table
      ↓
────────────────────────────────────
User Requests OTP via Push
      ↓
POST /api/auth/otp/send { channel: 'push' }
      ↓
OtpService.sendOtp()
      ↓
Find user by phone/userId
      ↓
Get latest push token from push_tokens
      ↓
PushService.send()
      ↓
Detect token type (FCM or Expo)
      ↓
PushService.sendFCM()
      ↓
Firebase Admin SDK
      ↓
OAuth 2.0 Token Generation (automatic)
      ↓
FCM HTTP v1 API Request
      ↓
Google FCM Servers
      ↓
Device Receives Notification
```

## 🧪 Testing

### 1. Verify Initialization

```bash
docker logs ubexgo-api-dev | grep "Firebase"
```

Expected output:
```
Initializing Firebase Admin SDK from: /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
✅ Firebase Admin SDK initialized successfully
```

### 2. Test Network Connectivity

```bash
# DNS resolution
docker exec ubexgo-api-dev nslookup googleapis.com

# Connectivity test
docker exec ubexgo-api-dev ping -c 3 googleapis.com
docker exec ubexgo-api-dev curl -I https://oauth2.googleapis.com
```

### 3. Send Test Push Notification

```bash
curl -X POST http://localhost:4001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "channel": "push"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sent": true,
    "channel": "push",
    "expiresInSec": 300
  },
  "message": "Verification code sent via push"
}
```

### 4. Check Logs

```bash
docker logs -f ubexgo-api-dev
```

Expected log output:
```
📤 Sending FCM push notification via Firebase Admin SDK...
✅ Firebase Admin SDK: Push notification sent successfully
   Message ID: projects/ubexgo-a2b4a/messages/0:1234567890123456
```

## 🔍 Troubleshooting

### Issue: "Firebase Admin SDK not initialized"

**Symptoms:**
```
Error: Firebase Admin SDK not initialized. Check service account configuration.
```

**Causes & Solutions:**

1. **Service account file missing**
   ```bash
   # Check if file exists
   docker exec ubexgo-api-dev ls -la /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
   ```
   
   Solution: Ensure file is in `apps/api/` directory and mounted in Docker

2. **Invalid JSON**
   ```bash
   # Validate JSON
   cd apps/api
   cat ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json | jq .
   ```
   
   Solution: Check for JSON syntax errors

3. **File permissions**
   ```bash
   # Check permissions
   ls -l apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
   ```
   
   Solution: Ensure file is readable (`-rw-r--r--`)

### Issue: Network connectivity errors

**Symptoms:**
```
Error: request to https://oauth2.googleapis.com/token failed, reason: 
Client network socket disconnected before secure TLS connection was established
```

**Causes & Solutions:**

1. **DNS resolution issue**
   ```bash
   docker exec ubexgo-api-dev nslookup googleapis.com
   ```
   
   Solution: DNS servers already configured in docker-compose.dev.yml

2. **Firewall blocking**
   - Check corporate firewall settings
   - Ensure outbound HTTPS (443) is allowed to `googleapis.com`

3. **Docker network issue**
   ```bash
   docker network inspect ubexgo-network-dev
   ```
   
   Solution: Restart Docker service

### Issue: Invalid token errors

**Symptoms:**
```
Error code: messaging/invalid-registration-token
Error code: messaging/registration-token-not-registered
```

**Causes & Solutions:**

1. **Token expired or invalid**
   - User needs to re-register device token
   - Check if token is properly stored in database

2. **Token format issue**
   ```sql
   SELECT token, LENGTH(token) FROM push_tokens WHERE user_id = 'xxx';
   ```
   
   - FCM tokens are typically 150+ characters
   - Should not contain spaces or newlines

3. **Wrong app token**
   - Ensure token is from correct Firebase project
   - Verify token is for the right app (user vs driver)

### Issue: Permission denied errors

**Symptoms:**
```
Error code: app/invalid-credential
```

**Causes & Solutions:**

1. **Service account permissions**
   - Go to Firebase Console → IAM & Admin
   - Ensure service account has "Firebase Cloud Messaging Admin" role

2. **Service account disabled**
   - Check Firebase Console → Service Accounts
   - Ensure account is active

## 📊 Monitoring

### Key Metrics

1. **Initialization Status**
   - Check on every app restart
   - Should see "✅ Firebase Admin SDK initialized successfully"

2. **Send Success Rate**
   - Monitor successful vs failed sends
   - Track error codes

3. **Token Validity**
   - Monitor invalid token errors
   - Implement token cleanup

4. **Network Health**
   - Monitor connection errors
   - Track response times

### Log Patterns

```bash
# Successful initialization
grep "Firebase Admin SDK initialized successfully" logs

# Successful sends
grep "Push notification sent successfully" logs

# Errors
grep "Firebase Admin SDK: Failed" logs

# Network issues
grep "network\|DNS\|connection" logs
```

## 🔐 Security Best Practices

### 1. Service Account File Security

✅ **DO:**
- Store file outside version control (if sensitive)
- Mount as read-only in Docker: `:ro`
- Restrict file permissions: `chmod 600`
- Use Kubernetes secrets in production

❌ **DON'T:**
- Commit to public repositories
- Share service account files
- Store in publicly accessible locations

### 2. Token Management

✅ **DO:**
- Validate tokens before storing
- Clean up expired tokens
- Rotate tokens on app updates
- Handle invalid token errors gracefully

❌ **DON'T:**
- Store tokens in plain text logs
- Share tokens between users
- Reuse revoked tokens

### 3. Environment Security

✅ **DO:**
- Use HTTPS for API endpoints
- Implement rate limiting
- Validate user authentication before sending
- Log all push notification attempts

❌ **DON'T:**
- Expose service account in client apps
- Allow unauthenticated push sends
- Log sensitive data

## 🆚 Firebase Admin SDK vs Legacy API

### Why Firebase Admin SDK?

| Feature | Firebase Admin SDK ✅ | Legacy Server Key ❌ |
|---------|---------------------|-------------------|
| **Authentication** | OAuth 2.0 (secure) | Simple API key |
| **API Version** | FCM HTTP v1 (latest) | Legacy HTTP API |
| **Google Support** | ✅ Recommended | ⚠️ Deprecated |
| **Security** | ✅ Token-based | ❌ Static key |
| **Error Messages** | ✅ Detailed | ❌ Generic |
| **Token Management** | ✅ Built-in | ❌ Manual |
| **Future Support** | ✅ Long-term | ❌ Being phased out |
| **Setup Complexity** | Medium | Easy |
| **Maintenance** | ✅ Automatic updates | ❌ Manual migration |

### Migration Status

✅ **Current**: Using Firebase Admin SDK (modern, secure)
❌ **Old**: Not using Legacy FCM API (deprecated)

**No migration needed** - already using the recommended approach!

## 📚 Additional Resources

### Official Documentation

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [FCM Server Setup](https://firebase.google.com/docs/cloud-messaging/server)
- [FCM HTTP v1 API Reference](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [Migration Guide (Legacy to v1)](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

### Project Documentation

- `QUICK_FIX_CHECKLIST.md` - Quick start guide
- `apps/api/PUSH_NOTIFICATION_DEBUGGING.md` - Debugging reference
- `PUSH_NOTIFICATION_FIX_SUMMARY.md` - Technical summary

## 🎉 Summary

You're using the **modern, secure, Google-recommended approach**:

✅ Firebase Admin SDK with OAuth 2.0
✅ FCM HTTP v1 API (latest)
✅ Service account authentication
✅ Automatic token management
✅ Future-proof implementation

**No legacy server keys needed!**
**No deprecated APIs!**
**Just restart Docker and you're good to go! 🚀**
