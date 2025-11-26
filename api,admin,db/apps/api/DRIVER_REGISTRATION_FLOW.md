# Driver Registration Flow Implementation

## Overview
This document describes the implementation of the driver registration flow with passenger app validation and push notifications.

## Requirements Implemented

### 1. Passenger Registration (User App)
- Passengers register in `user-app-standalone` with OTP SMS
- This functionality was already implemented

### 2. Driver Registration (Driver App)
- If a passenger wants to be a driver, they register in `driver-app-standalone`
- This functionality was already implemented

### 3. Driver Login Push Notification
- When a driver logs in via `driver-app-standalone`, a push notification is sent to `user-app-standalone`
- Implemented in `verifyOtp` endpoint in `AuthController.v2.ts`

### 4. Phone Number Validation
- If a driver enters a phone number that is not registered in `user-app-standalone`, the driver app receives an error with app store URLs
- Implemented in both `sendOtp` and `verifyOtp` endpoints

### 5. App Store URL Management
- Backend model for storing user app URLs for Play Market (Android) and App Store (iOS)
- Admin can change these URLs anytime via admin API

## Implementation Details

### Database Model: AppStoreUrl

**File**: `src/database/models/AppStoreUrl.ts`

Stores app store URLs for different apps:
- `app_name`: Identifier for the app (default: 'user_app')
- `android_url`: Play Store URL
- `ios_url`: App Store URL

**Migration**: `20250220000001-create-app-store-urls.cjs`
- Creates `app_store_urls` table
- Inserts default record for 'user_app'

### Service: AppStoreUrlService

**File**: `src/services/AppStoreUrlService.ts`

Methods:
- `getAppStoreUrls(appName)`: Get URLs for a specific app
- `updateAppStoreUrls(appName, data)`: Update URLs for a specific app
- `getUrlForPlatform(appName, platform)`: Get URL for a specific platform

### Modified Endpoints

#### 1. POST /auth/otp/send

**Changes**:
- Accepts `app` parameter in request body ('user' or 'driver', default: 'user')
- If `app === 'driver'`, checks if phone number exists in user app
- If phone doesn't exist, returns error with app store URLs:
  ```json
  {
    "success": false,
    "message": "Please register in the passenger app first",
    "data": {
      "code": "USER_NOT_REGISTERED",
      "app_store_urls": {
        "android": "https://play.google.com/store/apps/details?id=...",
        "ios": "https://apps.apple.com/app/..."
      }
    }
  }
  ```

#### 2. POST /auth/otp/verify

**Changes**:
- Accepts `app` parameter in request body ('user' or 'driver', default: 'user')
- If `app === 'driver'`, checks if phone number exists in user app (same validation as sendOtp)
- If `app === 'driver'` and user exists, sends push notification to user app:
  - Title: "Haydovchi ilovasi"
  - Body: "Siz haydovchi ilovasiga kirgansiz"
  - Data: `{ type: 'driver_login', phone, timestamp }`

### Admin API

#### GET /admin/app-store-urls
- Get app store URLs
- Query parameter: `appName` (default: 'user_app')
- Requires admin authentication

#### PUT /admin/app-store-urls
- Update app store URLs
- Request body:
  ```json
  {
    "appName": "user_app",
    "android_url": "https://play.google.com/store/apps/details?id=...",
    "ios_url": "https://apps.apple.com/app/..."
  }
  ```
- Requires admin authentication

### Error Handling

**Modified**: `src/errors/AppError.ts`
- Added `data` property to support additional error data

**Modified**: `src/middleware/errorHandler.ts`
- Includes `data` field from AppError in error responses

## Usage Examples

### Driver App - Send OTP

```javascript
POST /api/auth/otp/send
{
  "phone": "+998901234567",
  "channel": "sms",
  "app": "driver"
}
```

**Response if phone not registered**:
```json
{
  "success": false,
  "message": "Please register in the passenger app first",
  "data": {
    "code": "USER_NOT_REGISTERED",
    "app_store_urls": {
      "android": "https://play.google.com/store/apps/details?id=com.ubexgo.user",
      "ios": "https://apps.apple.com/app/ubexgo/id123456789"
    }
  }
}
```

### Driver App - Verify OTP

```javascript
POST /api/auth/otp/verify
{
  "phone": "+998901234567",
  "code": "1234",
  "app": "driver"
}
```

**On success**:
- Returns authentication tokens
- Sends push notification to user app (if user has registered device)

### Admin - Update App Store URLs

```javascript
PUT /api/admin/app-store-urls
Authorization: Bearer <admin_token>
{
  "appName": "user_app",
  "android_url": "https://play.google.com/store/apps/details?id=com.ubexgo.user",
  "ios_url": "https://apps.apple.com/app/ubexgo/id123456789"
}
```

## Frontend Integration

### Driver App

When calling OTP endpoints, include `app: 'driver'` in the request body:

```typescript
// Send OTP
await api.post('/auth/otp/send', {
  phone: phoneNumber,
  channel: 'sms',
  app: 'driver'
});

// Verify OTP
await api.post('/auth/otp/verify', {
  phone: phoneNumber,
  code: otpCode,
  app: 'driver'
});
```

### Error Handling in Driver App

When receiving `USER_NOT_REGISTERED` error:

```typescript
try {
  await api.post('/auth/otp/send', { phone, app: 'driver' });
} catch (error) {
  if (error.response?.data?.data?.code === 'USER_NOT_REGISTERED') {
    const { android, ios } = error.response.data.data.app_store_urls;
    const url = Platform.OS === 'android' ? android : ios;
    
    // Show notification with link to passenger app
    Alert.alert(
      'Register in Passenger App First',
      'Please register in the passenger app before using the driver app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open App Store', 
          onPress: () => Linking.openURL(url) 
        }
      ]
    );
  }
}
```

## Database Migration

Run the migration to create the `app_store_urls` table:

```bash
npm run migrate
```

Or manually:

```bash
npx sequelize-cli db:migrate
```

## Notes

1. The `app` parameter defaults to 'user' for backward compatibility
2. Push notifications are sent asynchronously and errors don't fail the login
3. App store URLs can be null if not configured
4. The admin API validates URL format before saving

