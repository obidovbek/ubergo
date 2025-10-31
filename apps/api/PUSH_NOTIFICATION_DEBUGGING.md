# Push Notification Debugging Guide

Quick reference for debugging push notification issues in the UberGo API.

## Quick Diagnostics

### 1. Check Firebase Admin SDK Initialization

Look for this line in the API logs on startup:
```
✅ Firebase Admin SDK initialized successfully
```

Or this error:
```
❌ Error initializing Firebase Admin SDK: [error message]
```

### 2. Check FCM Server Key

Ensure `FCM_SERVER_KEY` is set in your environment:
```bash
docker exec ubexgo-api-dev env | grep FCM_SERVER_KEY
```

### 3. Check Service Account File

Verify the file exists in the container:
```bash
docker exec ubexgo-api-dev ls -la /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
```

## Common Error Messages

### Error: "Client network socket disconnected before secure TLS connection"

**What it means**: Docker container can't reach Google's servers

**Fix**:
1. Add DNS servers to docker-compose.dev.yml:
```yaml
api:
  dns:
    - 8.8.8.8
    - 8.8.4.4
```

2. Test network from container:
```bash
docker exec ubexgo-api-dev ping -c 3 googleapis.com
docker exec ubexgo-api-dev nslookup googleapis.com
```

### Error: "Request failed with status code 404"

**What it means**: Legacy FCM API endpoint or key is incorrect

**Fix**:
1. Verify FCM_SERVER_KEY in `.env` file
2. Check Firebase Console → Cloud Messaging → Server key
3. Ensure Cloud Messaging API (Legacy) is enabled

### Error: "FCM server key is not configured"

**What it means**: FCM_SERVER_KEY environment variable not set

**Fix**:
1. Add to `infra/compose/.env`:
```bash
FCM_SERVER_KEY=your-server-key-here
```

2. Restart services:
```bash
cd infra/compose
docker-compose -f docker-compose.dev.yml restart api
```

### Error: "User not found for provided phone"

**What it means**: User doesn't exist in database for push OTP

**Fix**:
- Push OTP only works for existing users
- User must register first (via SMS/call OTP)

### Error: "User device token not registered"

**What it means**: User hasn't registered a push token

**Fix**:
- User app must register push token on login
- Check `push_tokens` table in database

## Log Messages Explained

### Success Messages

```
✅ Firebase Admin SDK initialized successfully
```
→ Primary push method available

```
✅ Firebase Admin push sent successfully: [response]
```
→ Push sent via Firebase Admin SDK

```
✅ Legacy FCM push sent successfully
```
→ Push sent via fallback legacy API

### Warning Messages

```
⚠️ Firebase Admin SDK not initialized, using legacy FCM
```
→ Admin SDK unavailable, using fallback (normal if network issues)

```
⚠️ FCM response indicates failure: [json]
```
→ Legacy API returned error response

### Error Messages

```
❌ Firebase Admin SDK failed: [message]
```
→ Admin SDK error, will try fallback

```
❌ Legacy FCM API failed: [message]
```
→ Both methods failed, push not sent

## Testing Push Notifications

### 1. Register a Push Token

First, register a device token:

```bash
curl -X POST http://localhost:4001/api/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "token": "your-fcm-token",
    "platform": "android",
    "app": "user"
  }'
```

### 2. Send Test Push OTP

```bash
curl -X POST http://localhost:4001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "channel": "push"
  }'
```

### 3. Monitor Logs

```bash
docker logs -f ubexgo-api-dev | grep -i "push\|fcm\|firebase"
```

## Database Queries

### Check User Push Tokens

```sql
-- Find all push tokens for a user
SELECT * FROM push_tokens 
WHERE user_id = 'user-id-here' 
ORDER BY updated_at DESC;

-- Find latest push token by phone
SELECT pt.* FROM push_tokens pt
JOIN users u ON u.id = pt.user_id
WHERE u.phone_e164 = '+998916610061'
AND pt.app = 'user'
ORDER BY pt.updated_at DESC
LIMIT 1;

-- Count push tokens by platform
SELECT platform, app, COUNT(*) as count
FROM push_tokens
GROUP BY platform, app;
```

### Check Recent OTP Codes

```sql
-- Find recent OTP codes
SELECT * FROM otp_codes 
WHERE target = '+998916610061'
ORDER BY created_at DESC 
LIMIT 5;

-- Count OTPs by channel
SELECT channel, COUNT(*) as count
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel;
```

## Environment Variable Checklist

In `infra/compose/.env`:

- [ ] `FCM_SERVER_KEY` - Set from Firebase Console
- [ ] Service account JSON file exists at `apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
- [ ] File is mounted in docker-compose.dev.yml

## Network Troubleshooting

### Test DNS Resolution

```bash
docker exec ubexgo-api-dev nslookup googleapis.com
docker exec ubexgo-api-dev nslookup oauth2.googleapis.com
docker exec ubexgo-api-dev nslookup fcm.googleapis.com
```

### Test Network Connectivity

```bash
docker exec ubexgo-api-dev ping -c 3 googleapis.com
docker exec ubexgo-api-dev curl -I https://www.googleapis.com
```

### Check Docker Network

```bash
docker network inspect ubexgo-network-dev
```

## Service Account Permissions

Ensure the Firebase service account has these permissions:
- **Firebase Cloud Messaging Admin** - Send notifications
- **Firebase Admin SDK Administrator Service Agent** - Admin operations

Check in Firebase Console → Project Settings → Service Accounts

## Code Flow for Push OTP

1. **AuthController.v2.ts** - `sendOtp()` endpoint
   - Receives request with `userId` and `channel: 'push'`
   - Calls OtpService.sendOtp()

2. **OtpService.ts** - `sendOtp()`
   - Generates OTP code
   - Stores in database
   - Finds user by phone
   - Finds user's push token
   - Calls PushService.send()

3. **PushService.ts** - `send()`
   - Detects token type (FCM vs Expo)
   - Calls sendFCM() for FCM tokens

4. **PushService.ts** - `sendFCM()`
   - Tries Firebase Admin SDK first
   - Falls back to Legacy FCM API
   - Returns success/failure

## Performance Monitoring

### Check Push Success Rate

```sql
-- OTP delivery by channel
SELECT 
  channel,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at > expires_at - INTERVAL '5 minutes') as sent
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel;
```

### Monitor Response Times

Check API logs for timing:
```bash
docker logs ubexgo-api-dev | grep "POST /api/auth/otp/send"
```

## Support Checklist

When reporting issues, provide:

1. [ ] Full error message from logs
2. [ ] User ID or phone number
3. [ ] Push token being used
4. [ ] Platform (Android/iOS)
5. [ ] App (user/driver)
6. [ ] Firebase Admin SDK initialization status
7. [ ] Network connectivity test results
8. [ ] Environment variable configuration

## Quick Fixes

### Restart API Service
```bash
cd infra/compose
docker-compose -f docker-compose.dev.yml restart api
```

### View Live Logs
```bash
docker logs -f ubexgo-api-dev
```

### Enter Container Shell
```bash
docker exec -it ubexgo-api-dev sh
```

### Check Environment Variables
```bash
docker exec ubexgo-api-dev env | sort
```

## Related Files

- `apps/api/src/services/FirebaseService.ts` - Firebase Admin SDK initialization
- `apps/api/src/services/PushService.ts` - Push notification sending
- `apps/api/src/services/OtpService.ts` - OTP delivery including push
- `apps/api/src/controllers/AuthController.v2.ts` - OTP endpoints
- `infra/compose/docker-compose.dev.yml` - Docker configuration
- `FCM_SETUP_GUIDE.md` - Full setup documentation

