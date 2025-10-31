# Push Notification Architecture

**Modern Implementation Using Firebase Admin SDK**

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      USER DEVICE                               │
│                                                                │
│  📱 Mobile App (React Native + Expo)                          │
│      │                                                         │
│      │ 1. Get FCM Token                                       │
│      └─────────────────┐                                      │
│                        ↓                                       │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ 2. Register Token
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                    API SERVER (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  POST /api/devices/register                              │ │
│  │  ├─ Store FCM token in database                         │ │
│  │  └─ Associate with user ID                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                         │                                       │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                      │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │  Table: push_tokens                                  ││ │
│  │  │  ├─ id (UUID)                                        ││ │
│  │  │  ├─ user_id (FK to users)                           ││ │
│  │  │  ├─ token (FCM token, 150+ chars)                   ││ │
│  │  │  ├─ platform (android/ios)                          ││ │
│  │  │  ├─ app (user/driver)                               ││ │
│  │  │  ├─ created_at                                       ││ │
│  │  │  └─ updated_at                                       ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

        ═══════════════════════════════════════════════════

                    LATER: SEND NOTIFICATION

┌────────────────────────────────────────────────────────────────┐
│                      USER REQUEST                              │
│                                                                │
│  POST /api/auth/otp/send                                      │
│  Body: { "userId": "xxx", "channel": "push" }                │
│                                                                │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│               AuthController.v2.ts                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  sendOtp()                                                │ │
│  │  ├─ Validate userId                                       │ │
│  │  ├─ Check channel = 'push'                               │ │
│  │  └─ Call OtpService.sendOtp(phone, 'push', metadata)    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                   OtpService.ts                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  sendOtp(phone, 'push', metadata)                        │ │
│  │  ├─ 1. Generate OTP code (4-6 digits)                   │ │
│  │  ├─ 2. Store in otp_codes table                         │ │
│  │  ├─ 3. Find user by phone (SELECT ... WHERE phone=...)  │ │
│  │  ├─ 4. Get user's push token                            │ │
│  │  │    SELECT * FROM push_tokens                          │ │
│  │  │    WHERE user_id = xxx AND app = 'user'              │ │
│  │  │    ORDER BY updated_at DESC LIMIT 1                   │ │
│  │  └─ 5. Call PushService.send({token, title, body})     │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                    PushService.ts                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  send(message)                                            │ │
│  │  ├─ Detect token type                                     │ │
│  │  │   ├─ ExponentPushToken[...] → Expo                   │ │
│  │  │   └─ dTwD... → FCM                                    │ │
│  │  └─ Route to appropriate service                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                         │                                       │
│                         ↓ (FCM Token)                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  sendFCM(message)                                         │ │
│  │  ├─ 1. Check Firebase initialized                        │ │
│  │  ├─ 2. Get Firebase Admin instance                       │ │
│  │  ├─ 3. Get messaging service                             │ │
│  │  ├─ 4. Prepare payload                                   │ │
│  │  │    {                                                   │ │
│  │  │      notification: { title, body },                   │ │
│  │  │      data: { type: 'otp', code, phone },             │ │
│  │  │      token: 'dTwD...',                                │ │
│  │  │      android: { priority: 'high', ... },             │ │
│  │  │      apns: { priority: '10', ... }                    │ │
│  │  │    }                                                   │ │
│  │  └─ 5. Send via messaging.send(payload)                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│               FirebaseService.ts                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  getFirebaseAdmin()                                       │ │
│  │  └─ Returns initialized Firebase Admin instance          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Initialized on app startup:                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  initializeFirebase()                                     │ │
│  │  ├─ 1. Read service account JSON file                    │ │
│  │  │    apps/api/ubexgo-a2b4a-firebase-...json            │ │
│  │  ├─ 2. Parse JSON                                         │ │
│  │  ├─ 3. Initialize admin.initializeApp({                  │ │
│  │  │      credential: admin.credential.cert(serviceAccount)│ │
│  │  │    })                                                  │ │
│  │  └─ 4. Mark as initialized                               │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│              FIREBASE ADMIN SDK                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  admin.messaging().send(payload)                          │ │
│  │  ├─ 1. Generate OAuth 2.0 token (automatic)              │ │
│  │  │    ├─ Use service account private key                 │ │
│  │  │    ├─ Request token from oauth2.googleapis.com        │ │
│  │  │    ├─ Cache token (valid ~1 hour)                     │ │
│  │  │    └─ Auto-refresh when expired                       │ │
│  │  ├─ 2. Build FCM HTTP v1 API request                     │ │
│  │  │    POST https://fcm.googleapis.com/v1/projects/...   │ │
│  │  │    Headers: Authorization: Bearer {oauth-token}       │ │
│  │  ├─ 3. Send request                                       │ │
│  │  └─ 4. Return message ID or error                        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                 GOOGLE FCM SERVERS                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  FCM HTTP v1 API                                          │ │
│  │  ├─ 1. Validate OAuth token                              │ │
│  │  ├─ 2. Validate FCM registration token                   │ │
│  │  ├─ 3. Check device availability                         │ │
│  │  ├─ 4. Queue notification                                │ │
│  │  └─ 5. Deliver to device                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                      USER DEVICE                               │
│                                                                │
│  📱 Notification Received!                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🔔 UbexGo tasdiqlash kodingiz                           │ │
│  │  Kodni haydovchi ilovasiga kiriting: 6298                │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Service Account JSON File                                  │
│  (ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json)   │
│                                                             │
│  {                                                          │
│    "type": "service_account",                              │
│    "project_id": "ubexgo-a2b4a",                          │
│    "private_key_id": "b200...",                            │
│    "private_key": "-----BEGIN PRIVATE KEY-----\n...",     │
│    "client_email": "firebase-adminsdk-...",                │
│    "token_uri": "https://oauth2.googleapis.com/token"     │
│  }                                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Read by FirebaseService.ts
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Firebase Admin SDK                                         │
│  admin.credential.cert(serviceAccount)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ When sending notification
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  OAuth 2.0 Token Generation (Automatic)                    │
│                                                             │
│  1. Sign JWT with private key                              │
│     ├─ iss: client_email                                   │
│     ├─ scope: https://www.googleapis.com/auth/firebase    │
│     ├─ aud: token_uri                                       │
│     └─ exp: now + 1 hour                                   │
│                                                             │
│  2. POST to https://oauth2.googleapis.com/token            │
│     Body: {                                                 │
│       grant_type: "urn:ietf:params:oauth:...",            │
│       assertion: "{signed-jwt}"                            │
│     }                                                       │
│                                                             │
│  3. Receive access token                                    │
│     {                                                       │
│       access_token: "ya29.c.b0Aa...",                     │
│       token_type: "Bearer",                                │
│       expires_in: 3600                                      │
│     }                                                       │
│                                                             │
│  4. Cache token (reuse for 1 hour)                         │
│  5. Auto-refresh when expired                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  FCM HTTP v1 API Request                                    │
│                                                             │
│  POST https://fcm.googleapis.com/v1/projects/ubexgo-a2b4a/ │
│       messages:send                                         │
│                                                             │
│  Headers:                                                   │
│    Authorization: Bearer ya29.c.b0Aa...                    │
│    Content-Type: application/json                          │
│                                                             │
│  Body:                                                      │
│    {                                                        │
│      "message": {                                           │
│        "token": "dTwDv_YxR1WB1FKf82wcHQ:APA91b...",       │
│        "notification": {                                    │
│          "title": "UbexGo tasdiqlash kodingiz",           │
│          "body": "Kodni haydovchi ilovasiga kiriting: ..." │
│        }                                                    │
│      }                                                      │
│    }                                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
                SUCCESS ✅
```

## 📊 Data Flow

### 1. Token Registration
```
Mobile App → API → Database
    │         │        │
    │         │        └─ Store: push_tokens table
    │         │           ├─ user_id
    │         │           ├─ token (FCM)
    │         │           ├─ platform
    │         │           └─ app
    │         │
    │         └─ POST /api/devices/register
    │            { token, platform, app }
    │
    └─ Firebase.messaging().getToken()
```

### 2. OTP Code Generation
```
User Request → AuthController → OtpService → Database
     │              │                │           │
     │              │                │           └─ Store: otp_codes
     │              │                │              ├─ code (random)
     │              │                │              ├─ expires_at
     │              │                │              └─ channel='push'
     │              │                │
     │              │                └─ Generate 4-6 digit code
     │              │
     │              └─ POST /api/auth/otp/send
     │                 { userId, channel: 'push' }
     │
     └─ User clicks "Send OTP"
```

### 3. Push Notification Delivery
```
OtpService → PushService → FirebaseService → FCM → Device
    │            │              │              │      │
    │            │              │              │      └─ Notification UI
    │            │              │              │         displayed
    │            │              │              │
    │            │              │              └─ Google FCM Servers
    │            │              │                 validate & deliver
    │            │              │
    │            │              └─ Firebase Admin SDK
    │            │                 generates OAuth token
    │            │
    │            └─ Detect token type & send
    │               sendFCM() for FCM tokens
    │
    └─ Get user's FCM token from database
```

## 🔄 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PushService.sendFCM()                                      │
│  ├─ Try to send                                             │
│  └─ Catch errors                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Error Code Detection                                       │
│                                                             │
│  messaging/invalid-registration-token                       │
│    → Token is invalid or expired                            │
│    → Log: "User needs to re-register their device"        │
│    → Action: Remove token from database                     │
│                                                             │
│  messaging/registration-token-not-registered                │
│    → Token not registered with FCM                          │
│    → Log: "Token is not registered"                        │
│    → Action: Remove token, ask user to re-register         │
│                                                             │
│  app/invalid-credential                                     │
│    → Service account credentials invalid                    │
│    → Log: "Check Firebase service account JSON"            │
│    → Action: Verify service account file                    │
│                                                             │
│  Network error                                              │
│    → Can't reach googleapis.com                            │
│    → Log: "Check DNS and internet connection"              │
│    → Action: Test network connectivity                      │
│                                                             │
│  messaging/server-unavailable                               │
│    → FCM servers temporarily down                           │
│    → Log: "FCM servers unavailable, retry later"           │
│    → Action: Implement retry logic                          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Components

### 1. Service Account File
```
Location: apps/api/ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json

Purpose:
- Contains private key for OAuth 2.0
- Identifies service account
- Provides project configuration

Security:
- Mounted as read-only in Docker (:ro)
- Not in version control (should be .gitignored)
- Only accessible by API server

Used by:
- FirebaseService.ts (reads on initialization)
- Firebase Admin SDK (uses for auth)
```

### 2. Firebase Admin SDK
```
Package: firebase-admin (npm)

Purpose:
- Handles OAuth 2.0 token generation
- Provides FCM messaging API
- Manages token refresh automatically

Initialization:
- Once on app startup
- In apps/api/src/app.ts
- Calls initializeFirebase()

Usage:
- getFirebaseAdmin() to get instance
- admin.messaging() to get messaging service
- messaging.send() to send notifications
```

### 3. Database Tables

#### push_tokens
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) NOT NULL,      -- FCM token
  platform VARCHAR(20),              -- 'android' | 'ios'
  app VARCHAR(20),                   -- 'user' | 'driver'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Example record:
{
  "id": "a983f068-c240-4285-892e-ce558f772849",
  "user_id": "78a8844e-c978-4f91-97bb-13dc6cc37dcb",
  "token": "dTwDv_YxR1WB1FKf82wcHQ:APA91bHeIDexi8l7togdT31x...",
  "platform": "android",
  "app": "user"
}
```

#### otp_codes
```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  channel VARCHAR(10),               -- 'sms' | 'call' | 'push'
  target VARCHAR(20),                -- phone number
  code VARCHAR(10),                  -- OTP code
  expires_at TIMESTAMP,
  attempts INTEGER,
  meta JSONB,
  created_at TIMESTAMP
);

-- Example record:
{
  "id": 123,
  "channel": "push",
  "target": "+998916610061",
  "code": "6298",
  "expires_at": "2025-10-31T06:08:40.568Z",
  "attempts": 0,
  "meta": {
    "ip": "::ffff:172.19.0.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## 📈 Performance

### Latency Breakdown

```
Total: ~500-1000ms

├─ OTP Generation: ~10ms
│   └─ Random number generation
│
├─ Database Query: ~20ms
│   ├─ Find user
│   └─ Get push token
│
├─ Firebase Admin SDK: ~470-970ms
│   ├─ OAuth token (if not cached): 0-500ms
│   │   ├─ JWT signing: ~5ms
│   │   ├─ Network to googleapis.com: ~100-400ms
│   │   └─ Token caching: ~1ms
│   │
│   ├─ FCM API Request: ~200-300ms
│   │   ├─ Payload preparation: ~5ms
│   │   ├─ Network to FCM: ~150-250ms
│   │   └─ Response processing: ~5ms
│   │
│   └─ Delivery to device: ~50-150ms
│       ├─ FCM processing: ~20-50ms
│       └─ Network to device: ~30-100ms
```

### Optimization

- ✅ OAuth tokens cached (1 hour)
- ✅ Database connection pooled
- ✅ Asynchronous processing
- ✅ No blocking operations

## 🔒 Security Layers

```
Layer 1: Transport Security
└─ HTTPS/TLS for all communications

Layer 2: Authentication
├─ OAuth 2.0 (Firebase Admin SDK)
├─ JWT tokens (API authentication)
└─ Service account credentials

Layer 3: Authorization
├─ User must be authenticated to request OTP
├─ Token must belong to requesting user
└─ Rate limiting on OTP requests

Layer 4: Data Protection
├─ Service account file read-only
├─ Environment variables for secrets
├─ Tokens stored in database (not logs)
└─ OTP codes expire after 5 minutes

Layer 5: Network Security
├─ Docker network isolation
├─ DNS servers configured
└─ Firewall rules (if production)
```

---

**This architecture is:**
- ✅ Modern (FCM HTTP v1 API)
- ✅ Secure (OAuth 2.0)
- ✅ Scalable (async, cached)
- ✅ Reliable (error handling)
- ✅ Maintainable (well-documented)
- ✅ Future-proof (Google-recommended)

