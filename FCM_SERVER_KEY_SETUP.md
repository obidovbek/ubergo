# FCM Server Key Setup Guide

## Problem

You're seeing this error in the API logs:
```
FCM server key is not configured
```

This means the backend cannot send push notifications via Firebase Cloud Messaging because the `FCM_SERVER_KEY` environment variable is not set.

## Solution

### Step 1: Get Your FCM Server Key

1. **Open Firebase Console:**
   - Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Select Your Project:**
   - Click on your project: **UbexGoUser**
   - (The same project that has your `google-services.json` file)

3. **Navigate to Cloud Messaging:**
   - Click the ⚙️ **gear icon** at the top left
   - Select **"Project settings"**
   - Click on the **"Cloud Messaging"** tab

4. **Find the Server Key:**
   - Scroll down to **"Cloud Messaging API (Legacy)"** section
   - Look for **"Server key"**
   - Click the **copy icon** 📋 to copy the key
   - It will look something like: `AAAAxxxxxxx:APA91bF...` (very long string)

   > ⚠️ **Important:** If you see "Cloud Messaging API is disabled":
   > - Click the ⋮ (three dots menu) next to "Cloud Messaging API (Legacy)"
   > - Click **"Manage API in Google Cloud Console"**
   > - Click **"Enable"**
   > - Wait a few minutes, then refresh the page

### Step 2: Add the Key to Your Environment

#### Option A: Using the PowerShell Script (Easiest)

```powershell
cd D:\projects\UberGo

# Replace YOUR_ACTUAL_KEY with the key you copied
.\set-fcm-key.ps1 "AAAAxxxxxxx:APA91bF..."
```

#### Option B: Manual Edit

1. Open `.env` file in the project root:
   ```powershell
   code D:\projects\UberGo\.env
   # OR
   notepad D:\projects\UberGo\.env
   ```

2. Find this line:
   ```
   FCM_SERVER_KEY=
   ```

3. Paste your key after the `=` sign:
   ```
   FCM_SERVER_KEY=AAAAxxxxxxx:APA91bF...your-actual-key...
   ```

4. **Save the file**

### Step 3: Restart Your API Service

#### If Running with Docker Compose:

```powershell
cd D:\projects\UberGo\infra\compose
docker-compose restart api
```

Or stop and start fresh:
```powershell
docker-compose down
docker-compose up -d
```

#### If Running Locally:

```powershell
# Stop the current API process (Ctrl+C in the terminal where it's running)

# Restart it
cd D:\projects\UberGo\apps\api
npm run dev
```

### Step 4: Verify It's Working

1. **Check API Logs:**
   ```powershell
   # Docker
   cd D:\projects\UberGo\infra\compose
   docker-compose logs -f api
   
   # Local
   # Just watch the terminal where API is running
   ```

2. **Test Push Notification:**
   - Open driver-app
   - Enter a user's phone number
   - User should receive push notification with OTP

3. **Check Logs - Should Now See:**
   ```
   Detected FCM token, using FCM service
   Sending FCM push notification: {...}
   Push notification sent successfully
   ```

   ✅ No more "FCM server key is not configured" error!

## Troubleshooting

### Error: "Cloud Messaging API is disabled"

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Library**
4. Search for **"Firebase Cloud Messaging API"**
5. Click **"Enable"**
6. Wait 2-5 minutes for propagation
7. Refresh Firebase Console and try again

### Error: "Invalid server key"

**Solution:**
- Make sure you copied the **entire** key (it's very long ~150+ characters)
- Check there are no extra spaces or line breaks
- Make sure you copied from **"Server key"**, not "Sender ID"

### Push Still Not Working

**Check:**
1. ✅ User-app has FCM token registered (not Expo token)
   ```sql
   SELECT * FROM push_tokens WHERE app = 'user';
   -- Token should be long hash, NOT "ExponentPushToken[...]"
   ```

2. ✅ User-app is using **development build** (not Expo Go)
   - Firebase requires native build

3. ✅ Device has Google Play Services
   - FCM won't work without it

4. ✅ User granted notification permission
   - Check device Settings → Apps → [Your App] → Notifications

## Security Notes

⚠️ **Keep Your Server Key Secret!**
- Never commit `.env` file to git (it's in `.gitignore`)
- Don't share the key publicly
- If compromised, regenerate it in Firebase Console

## Alternative: Using Service Account (More Secure)

For production, consider using Firebase Admin SDK with service account instead of legacy server key:

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Use `@react-native-firebase/admin` in backend

But for development, the server key approach works fine!

## Files Reference

### Backend Configuration
```77:79:apps/api/src/config/index.ts
fcm: {
  serverKey: process.env.FCM_SERVER_KEY || '',
},
```

### Backend Service
```25:29:apps/api/src/services/PushService.ts
async sendFCM(message: PushMessage): Promise<boolean> {
  if (!config.fcm.serverKey) {
    console.warn('FCM server key is not configured');
    return false;
  }
```

## Summary

✅ **What you need:**
1. FCM Server Key from Firebase Console
2. Add to `.env` as `FCM_SERVER_KEY=your-key-here`
3. Restart API service
4. Test push notifications

✅ **Where to get it:**
- Firebase Console → Project Settings → Cloud Messaging → Server key

✅ **How to add it:**
```powershell
.\set-fcm-key.ps1 "YOUR_KEY_HERE"
```

---

**Need help?** Check the logs and make sure the key is exactly as shown in Firebase Console.


