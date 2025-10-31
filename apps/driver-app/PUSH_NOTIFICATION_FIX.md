# Push Notification Fix for Driver App

## Problem
When drivers entered their phone number in the driver app registration flow, the system was sending SMS OTP codes instead of push notifications to the user app.

## Root Cause
In `PhoneRegistrationScreen.tsx`, the code had a fallback mechanism that automatically sent SMS when push notification failed:

```typescript
// OLD CODE - Had automatic SMS fallback
try {
  await sendOtp(usedPhone, 'push', { userId: usedUserId });
} catch (pushError) {
  console.log('Push OTP failed, falling back to SMS:', pushError);
  await sendOtp(usedPhone, 'sms'); // ❌ This was causing SMS to be sent
}
```

## Solution
Removed the automatic SMS fallback. The driver app should ONLY send push notifications to the user app.

### Changes Made

#### 1. PhoneRegistrationScreen.tsx
- **Line 105-111**: Removed SMS fallback logic
- **Line 131**: Updated error message to be more helpful

```typescript
// NEW CODE - Push only, no SMS fallback
console.log('Sending OTP via push notification to user app...');
await sendOtp(usedPhone, 'push', { userId: usedUserId });
console.log('Push notification sent successfully to user app');
```

Error message now tells the driver:
> "Push notification yuborishda xatolik. Telefon raqami UbexGo foydalanuvchi ilovasida ro'yxatdan o'tgan va ilova ochiq ekanligini tekshiring."
> 
> Translation: "Error sending push notification. Make sure the phone number is registered in UbexGo user app and the app is open."

#### 2. OTPVerificationScreen.tsx
- **Line 138-154**: Updated resend code function to use push only
- Added better logging and error messages

```typescript
const handleResendCode = async () => {
  try {
    console.log('Resending OTP via push notification...');
    await sendOtp(phoneNumber, 'push', { userId: routeUserId });
    showToast.success(t('common.success'), 'Yangi kod push notification orqali yuborildi');
    // ... rest of the code
  } catch (error) {
    console.error('Failed to resend push notification:', error);
    handleBackendError(error, {
      t,
      defaultMessage: 'Push notification yuborishda xatolik. Foydalanuvchi ilovasi ochiq ekanligini tekshiring.',
    });
  }
};
```

## How It Works Now

### Flow:
1. **Driver enters phone number** → Driver app sends request with `channel: 'push'`
2. **API receives request** → `AuthController.v2.ts` calls `OtpService.sendOtp(phone, 'push')`
3. **OtpService generates code** → Saves to database
4. **OtpService finds user** → Looks up user by phone number
5. **OtpService finds push token** → Gets latest push token for user app
6. **PushService sends FCM** → Sends push notification to user's device with the OTP code
7. **User receives notification** → Notification shows: "Kodni haydovchi ilovasiga kiriting: 12345"
8. **Driver enters code** → Driver verifies the code they received from user

### Requirements:
- User must be registered in the user app with the phone number
- User app must have a valid FCM push token registered
- User app should be running (foreground or background) to receive the notification

## Backend Implementation

The backend (`OtpService.ts` lines 260-283) already supports push notifications:

```typescript
if (channel === 'push') {
  // Find user by phone
  const user = await User.findOne({ where: { phone_e164: phone } });
  if (!user) {
    throw new Error('User not found for provided phone');
  }

  // Find latest push token for user app
  const push = await PushToken.findOne({
    where: { user_id: user.id, app: 'user' },
    order: [['updated_at', 'DESC']],
  });

  if (!push) {
    throw new Error('User device token not registered');
  }

  sent = await PushService.sendFCM({
    token: push.token,
    title: 'UbexGo tasdiqlash kodingiz',
    body: `Kodni haydovchi ilovasiga kiriting: ${code}`,
    data: { type: 'otp', code, phone },
  });
}
```

## Testing

To test this fix:

1. **Register a user** in the user app with a phone number (e.g., +998901234567)
2. **Ensure user app is running** (background or foreground)
3. **Open driver app** and enter the same phone number
4. **Verify**:
   - ✅ Push notification should appear on the user's device
   - ✅ Notification should contain the OTP code
   - ❌ No SMS should be sent
5. **Enter the OTP code** from the push notification into the driver app
6. **Verify** the code is validated successfully

## Error Scenarios

### If push notification fails:
- **User not found**: Error message tells driver to check if phone is registered
- **No push token**: Error message tells driver to ensure user app is open
- **FCM failure**: Backend logs the error and returns failure message

No automatic SMS fallback occurs - this is intentional to enforce the push notification flow.

## Files Modified

1. `apps/driver-app/screens/PhoneRegistrationScreen.tsx`
   - Removed SMS fallback (lines 105-111)
   - Updated error messages (line 131)

2. `apps/driver-app/screens/OTPVerificationScreen.tsx`
   - Updated resend code handler (lines 136-154)
   - Improved logging and error messages

## Related Files (Not Modified)

- `apps/api/src/services/OtpService.ts` - Already supports push notifications
- `apps/api/src/services/PushService.ts` - Handles FCM push sending
- `apps/api/src/controllers/AuthController.v2.ts` - Handles OTP API endpoints
- `apps/driver-app/api/auth.ts` - API client for driver app

---

**Date**: October 30, 2025
**Status**: ✅ Fixed

