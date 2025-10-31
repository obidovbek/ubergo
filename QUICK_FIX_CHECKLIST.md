# Quick Fix Checklist for Push Notifications

**✨ Using Modern Firebase Admin SDK (No Legacy Server Key Needed!)**

This system uses the **Firebase Admin SDK** with service account authentication - the modern, secure, and recommended way by Google.

## ✅ Checklist

### Step 1: Verify Service Account File
- [ ] Check that file exists: `apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
- [ ] The file should already be present and mounted in Docker
- [ ] **No manual action needed** - file is already configured!

### Step 2: Restart Docker Services
- [ ] Open terminal/PowerShell
- [ ] Run these commands:
```bash
cd infra/compose
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Step 3: Verify Firebase Initialization
- [ ] Check logs for successful initialization:
```bash
docker logs ubexgo-api-dev | grep "Firebase"
```
- [ ] You should see: `✅ Firebase Admin SDK initialized successfully`

### Step 4: Test Network Connectivity (if initialization fails)
- [ ] Test DNS resolution:
```bash
docker exec ubexgo-api-dev nslookup googleapis.com
```
- [ ] Test connectivity:
```bash
docker exec ubexgo-api-dev ping -c 3 googleapis.com
```
- [ ] DNS servers (8.8.8.8, 8.8.4.4) are already configured in docker-compose

### Step 5: Test Push Notification
- [ ] Send test OTP via push:
```bash
curl -X POST http://localhost:4001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id", "channel": "push"}'
```
- [ ] Check logs:
```bash
docker logs -f ubexgo-api-dev
```
- [ ] Look for: `✅ Firebase Admin SDK: Push notification sent successfully`

## 🎉 Why This Approach is Better

### ✅ Modern & Secure
- Uses **Firebase Admin SDK** with OAuth 2.0
- Service account authentication (more secure than API keys)
- Uses **FCM HTTP v1 API** (latest version)

### ❌ What We're NOT Using
- ~~Legacy FCM Server Key~~ (Deprecated by Google)
- ~~Legacy FCM HTTP API~~ (Being phased out)
- ~~Simple API key authentication~~ (Less secure)

### 📊 Comparison

| Feature | Firebase Admin SDK ✅ | Legacy Server Key ❌ |
|---------|---------------------|-------------------|
| Google Recommended | ✅ Yes | ❌ Deprecated |
| Security | ✅ OAuth 2.0 | ❌ Simple key |
| API Version | ✅ HTTP v1 | ❌ Legacy |
| Token Management | ✅ Built-in | ❌ Manual |
| Future Support | ✅ Long-term | ❌ Being phased out |

## ⚠️ If Still Having Issues

### Firebase Initialization Fails
If you see "❌ Error initializing Firebase Admin SDK":
- [ ] Verify service account file exists
- [ ] Check file permissions (should be readable)
- [ ] Look for detailed error in logs

### Network Issues
If you see "Client network socket disconnected":
- [ ] DNS servers are already configured in docker-compose.dev.yml
- [ ] Test network connectivity (see Step 4 above)
- [ ] Check if firewall is blocking outbound connections to googleapis.com

### Push Send Fails
If you see "❌ Firebase Admin SDK: Failed to send push notification":
- [ ] Check the error code in logs:
  - `messaging/invalid-registration-token` → User needs to re-register device
  - `messaging/registration-token-not-registered` → Token not valid
  - `app/invalid-credential` → Service account issue
  - Network error → DNS/connectivity problem

### User/Token Issues
If you see "User not found" or "User device token not registered":
- [ ] Ensure user exists in database
- [ ] Verify user has registered a push token
- [ ] Query database:
```sql
SELECT * FROM push_tokens WHERE user_id = 'your-user-id';
```

## 📚 Additional Resources

- **Setup Guide**: `FCM_SETUP_GUIDE.md`
- **Debugging Guide**: `apps/api/PUSH_NOTIFICATION_DEBUGGING.md`
- **Complete Summary**: `PUSH_NOTIFICATION_FIX_SUMMARY.md`

## 🆘 Quick Help Commands

### View Live Logs
```bash
docker logs -f ubexgo-api-dev
```

### Check Service Account File in Container
```bash
docker exec ubexgo-api-dev ls -la /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
```

### Test Network from Container
```bash
docker exec ubexgo-api-dev ping -c 3 googleapis.com
docker exec ubexgo-api-dev nslookup oauth2.googleapis.com
```

### Restart API Only
```bash
docker-compose -f infra/compose/docker-compose.dev.yml restart api
```

### Enter Container Shell
```bash
docker exec -it ubexgo-api-dev sh
```

## ✅ Success Indicators

When everything is working, you'll see these logs:

**On Startup:**
```
Initializing Firebase Admin SDK from: /app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json
✅ Firebase Admin SDK initialized successfully
```

**When Sending Push:**
```
📤 Sending FCM push notification via Firebase Admin SDK...
✅ Firebase Admin SDK: Push notification sent successfully
   Message ID: projects/ubexgo-a2b4a/messages/0:1234567890123456
```

## 🔧 Configuration Files

All configuration is already in place:

| File | Status | Notes |
|------|--------|-------|
| `ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json` | ✅ Present | Service account credentials |
| `docker-compose.dev.yml` | ✅ Configured | DNS servers + volume mount |
| `FirebaseService.ts` | ✅ Ready | Initialization logic |
| `PushService.ts` | ✅ Updated | Modern FCM HTTP v1 API |

## 🎯 What's Different from Before?

### Before (with issues):
- ❌ Tried Firebase Admin SDK, fell back to legacy API
- ❌ Required FCM_SERVER_KEY environment variable
- ❌ Used deprecated Legacy FCM API
- ❌ Network DNS issues

### Now (working):
- ✅ Uses only Firebase Admin SDK (modern approach)
- ✅ No legacy server key needed
- ✅ Uses secure OAuth 2.0 authentication
- ✅ DNS properly configured
- ✅ Better error messages

---

## 🎉 That's It!

No manual configuration needed! Just:
1. ✅ Restart Docker services
2. ✅ Verify Firebase initialized
3. ✅ Test push notifications

The service account file is already in place and will be automatically loaded by Firebase Admin SDK.

**You're using the modern, secure, Google-recommended approach! 🚀**
