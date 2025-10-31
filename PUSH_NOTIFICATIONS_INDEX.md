# 📚 Push Notifications Documentation Index

**Complete Guide to Firebase Cloud Messaging Implementation**

---

## 🚀 Quick Start

**New to this? Start here:**

1. **[QUICK_FIX_CHECKLIST.md](QUICK_FIX_CHECKLIST.md)** ⭐  
   Simple step-by-step checklist to get push notifications working  
   **Time:** 2-5 minutes  
   **Use when:** Setting up for the first time or after errors

2. **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** 📋  
   High-level overview of what was done and why  
   **Time:** 5 minutes  
   **Use when:** Want to understand what changed

---

## 📖 Complete Documentation

### Setup & Configuration

**[FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)**  
Comprehensive guide covering:
- How Firebase Admin SDK works
- Authentication flow (OAuth 2.0)
- Complete setup instructions
- Security best practices
- Testing procedures

**Time:** 15-20 minutes  
**Use when:** Need deep understanding of the system

---

### Architecture & Design

**[PUSH_NOTIFICATION_ARCHITECTURE.md](PUSH_NOTIFICATION_ARCHITECTURE.md)**  
Technical architecture with visual diagrams:
- System architecture flow
- Authentication flow
- Data flow diagrams
- Error handling flow
- Database schema
- Performance metrics

**Time:** 10-15 minutes  
**Use when:** Building features or debugging complex issues

---

### Debugging & Troubleshooting

**[apps/api/PUSH_NOTIFICATION_DEBUGGING.md](apps/api/PUSH_NOTIFICATION_DEBUGGING.md)**  
Quick debugging reference:
- Common error messages and fixes
- Log message explanations
- Quick diagnostic commands
- Database queries
- Network troubleshooting
- Code flow reference

**Time:** As needed  
**Use when:** Encountering errors or issues

---

### Migration Details

**[FIREBASE_ADMIN_SDK_MIGRATION.md](FIREBASE_ADMIN_SDK_MIGRATION.md)**  
Migration from Legacy FCM to Firebase Admin SDK:
- What changed (detailed)
- Before/after comparison
- Benefits of migration
- Testing procedures
- Rollback plan (if needed)

**Time:** 10 minutes  
**Use when:** Want to understand migration details

---

## 🛠️ Tools & Scripts

### Validation Script

**[apps/api/scripts/validate-fcm-setup.js](apps/api/scripts/validate-fcm-setup.js)**  
Automated validation of FCM configuration

**Run with:**
```bash
cd apps/api
npm run validate:fcm
```

**Checks:**
- ✅ Service account file exists and is valid
- ✅ Environment variables configured
- ✅ Docker configuration
- ✅ File permissions

---

## 📂 Code Files

### Core Services

| File | Purpose | Lines |
|------|---------|-------|
| `apps/api/src/services/FirebaseService.ts` | Firebase Admin SDK initialization | ~88 |
| `apps/api/src/services/PushService.ts` | Send push notifications | ~150 |
| `apps/api/src/services/OtpService.ts` | OTP generation & delivery | ~405 |
| `apps/api/src/controllers/AuthController.v2.ts` | Authentication endpoints | ~468 |

### Configuration

| File | Purpose |
|------|---------|
| `apps/api/src/config/index.ts` | Application configuration |
| `apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json` | Service account credentials |
| `infra/compose/docker-compose.dev.yml` | Docker configuration |
| `infra/compose/env.example` | Environment variable template |

---

## 📊 Quick Reference

### System Components

```
Mobile App → API Server → Firebase Admin SDK → FCM → Device
```

### Key Files

1. **Service Account**: `ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json`
2. **Initialization**: `FirebaseService.ts`
3. **Sending**: `PushService.ts`
4. **OTP Logic**: `OtpService.ts`
5. **Endpoint**: `AuthController.v2.ts`

### Environment Variables

**None required!** (Service account file is all you need)

### Docker Volumes

```yaml
# Service account file (read-only)
- ../../apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json:/app/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json:ro
```

### DNS Configuration

```yaml
dns:
  - 8.8.8.8
  - 8.8.4.4
```

---

## 🎯 Common Tasks

### Test Push Notification

```bash
curl -X POST http://localhost:4001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "channel": "push"}'
```

### Check Logs

```bash
docker logs -f ubexgo-api-dev | grep -i "firebase\|push"
```

### Verify Initialization

```bash
docker logs ubexgo-api-dev | grep "Firebase Admin SDK initialized"
```

### Test Network

```bash
docker exec ubexgo-api-dev ping -c 3 googleapis.com
```

### Validate Configuration

```bash
cd apps/api && npm run validate:fcm
```

### Check Database

```sql
-- User's push tokens
SELECT * FROM push_tokens WHERE user_id = 'xxx';

-- Recent OTP codes
SELECT * FROM otp_codes WHERE target = '+998...' ORDER BY created_at DESC LIMIT 5;
```

---

## 🆘 Troubleshooting Guide

| Issue | See |
|-------|-----|
| Setup not working | [QUICK_FIX_CHECKLIST.md](QUICK_FIX_CHECKLIST.md) |
| Specific error message | [PUSH_NOTIFICATION_DEBUGGING.md](apps/api/PUSH_NOTIFICATION_DEBUGGING.md) |
| Network connectivity | [FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md#issue-network-connectivity-errors) |
| Understanding architecture | [PUSH_NOTIFICATION_ARCHITECTURE.md](PUSH_NOTIFICATION_ARCHITECTURE.md) |
| Migration questions | [FIREBASE_ADMIN_SDK_MIGRATION.md](FIREBASE_ADMIN_SDK_MIGRATION.md) |

---

## 📈 Learning Path

### For Developers (New to Project)

1. Read **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** (5 min)
2. Skim **[PUSH_NOTIFICATION_ARCHITECTURE.md](PUSH_NOTIFICATION_ARCHITECTURE.md)** (10 min)
3. Review code files in `apps/api/src/services/` (20 min)
4. Test with **[QUICK_FIX_CHECKLIST.md](QUICK_FIX_CHECKLIST.md)** (5 min)

**Total: ~40 minutes**

### For DevOps (Deployment)

1. Read **[FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)** (15 min)
2. Review Docker configuration in `infra/compose/` (10 min)
3. Run validation: `npm run validate:fcm` (2 min)
4. Test deployment with checklist (5 min)

**Total: ~30 minutes**

### For Debugging Issues

1. Check **[PUSH_NOTIFICATION_DEBUGGING.md](apps/api/PUSH_NOTIFICATION_DEBUGGING.md)**
2. Look for your specific error message
3. Follow the suggested solution
4. If not resolved, review architecture
5. Check logs with provided commands

**Total: Variable (5-30 minutes)**

---

## ✅ System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Firebase Admin SDK | ✅ Working | Modern FCM HTTP v1 API |
| Service Account | ✅ Configured | File in place, mounted |
| DNS Configuration | ✅ Fixed | Google DNS servers |
| Error Handling | ✅ Enhanced | Specific error codes |
| Documentation | ✅ Complete | All guides created |
| Legacy API | ❌ Removed | No longer using deprecated API |

---

## 🎯 Key Concepts

### Modern vs Legacy

| Aspect | Modern ✅ | Legacy ❌ |
|--------|----------|----------|
| **Method** | Firebase Admin SDK | Server Key |
| **API** | FCM HTTP v1 | Legacy HTTP |
| **Auth** | OAuth 2.0 | API Key |
| **Status** | Recommended | Deprecated |

### Authentication Flow

```
Service Account JSON → Firebase Admin SDK → OAuth 2.0 → FCM API
```

### Push Flow

```
User Request → OTP Service → Push Service → Firebase SDK → FCM → Device
```

---

## 📞 Support

### Quick Help

1. **Setup issues:** [QUICK_FIX_CHECKLIST.md](QUICK_FIX_CHECKLIST.md)
2. **Error messages:** [PUSH_NOTIFICATION_DEBUGGING.md](apps/api/PUSH_NOTIFICATION_DEBUGGING.md)
3. **Understanding system:** [PUSH_NOTIFICATION_ARCHITECTURE.md](PUSH_NOTIFICATION_ARCHITECTURE.md)

### Commands

```bash
# Logs
docker logs -f ubexgo-api-dev

# Restart
docker-compose -f infra/compose/docker-compose.dev.yml restart api

# Validate
cd apps/api && npm run validate:fcm

# Network test
docker exec ubexgo-api-dev ping -c 3 googleapis.com
```

---

## 📝 Documentation Updates

**Last Updated:** October 31, 2025  
**Version:** 2.0 (Firebase Admin SDK)  
**Status:** ✅ Production Ready

### Changelog

- ✅ Migrated to Firebase Admin SDK
- ✅ Removed Legacy FCM API
- ✅ Enhanced error handling
- ✅ Fixed DNS connectivity
- ✅ Created comprehensive documentation
- ✅ Added validation script
- ✅ Updated all guides

---

## 🎉 You're Ready!

Everything you need is documented. Start with the **[QUICK_FIX_CHECKLIST.md](QUICK_FIX_CHECKLIST.md)** and refer to other documents as needed.

**Happy coding! 🚀**

