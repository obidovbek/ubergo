# 🚀 Quick Fix: Google Sign-In Error

## The Problem
```
Access blocked: Authorization Error
Missing required parameter: client_id
Error 400: invalid_request
```

## The Cause
Your `google-services.json` file has an empty `oauth_client` array, which means Google OAuth is not configured in Firebase.

## ⚡ Quick Solution (5 minutes)

### Step 1: Get Your SHA-1 Fingerprint

**Option A: Use Our Script (Easiest)**
```powershell
cd apps/user-app
.\scripts\get-sha1.ps1
```

**Option B: Manual Command**
```powershell
cd "C:\Program Files\Java\jdk-21\bin"
.\keytool.exe -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA1** value (it looks like: `AA:BB:CC:DD:EE:...`)

### Step 2: Add SHA-1 to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **ubexgo-ae910**
3. Click ⚙️ → **Project Settings**
4. Scroll to **Your apps** → Find **com.obidovbek94.UbexGoUser**
5. Click **Add Fingerprint**
6. Paste your SHA-1
7. Click **Save**

### Step 3: Enable Google Sign-In

1. In Firebase Console, go to **Authentication**
2. Click **Sign-in method** tab
3. Click **Google** provider
4. Toggle **Enable**
5. Add a support email (your email)
6. Click **Save**

### Step 4: Download New Configuration

1. Back in **Project Settings** → **Your apps**
2. Find **com.obidovbek94.UbexGoUser**
3. Click **Download google-services.json**
4. **Replace** the file at: `apps/user-app/google-services.json`

### Step 5: Rebuild Your App

```bash
cd apps/user-app

# Clear cache
npx expo start --clear

# Run on Android
npx expo run:android
```

## ✅ Verify It's Fixed

After following all steps, check your NEW `google-services.json`:

```json
{
  "client": [{
    "oauth_client": [
      {
        "client_id": "xxx-xxx.apps.googleusercontent.com",  // ← Should NOT be empty!
        "client_type": 1
      }
    ]
  }]
}
```

If `oauth_client` is still empty, repeat Steps 2-4 carefully.

## 🔍 Still Not Working?

### Check 1: Firebase Configuration
- [ ] SHA-1 fingerprint added
- [ ] Google Sign-In enabled
- [ ] Support email added
- [ ] New `google-services.json` downloaded
- [ ] File replaced in `apps/user-app/`

### Check 2: Web Client ID
The Web Client ID should be automatically configured. To verify:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. You should see:
   - **Web client** (auto created by Firebase)
   - **Android client** (created when you added SHA-1)

### Check 3: Rebuild
Make sure you rebuild after replacing `google-services.json`:
```bash
# Stop the app
# Clear cache
npx expo start --clear

# Rebuild
npx expo run:android
```

## 📚 Need More Details?

See [GOOGLE_SIGNIN_FIX.md](./GOOGLE_SIGNIN_FIX.md) for:
- Detailed troubleshooting
- iOS setup
- Production build configuration
- Alternative authentication methods

## 💬 Common Questions

**Q: Do I need to add SHA-1 for every build?**
A: No. Debug builds always use the same debug keystore. You only need to add release SHA-1 when building for production.

**Q: Can I test without Google Play Services?**
A: Yes! The app will automatically fall back to web-based OAuth if Play Services aren't available.

**Q: Is it safe to commit `google-services.json`?**
A: Yes. The API keys in this file are restricted by your package name and are safe to commit. However, you can use EAS Secrets if preferred (see GOOGLE_SIGNIN_FIX.md).

**Q: I added SHA-1 but still getting the error**
A: Make sure you:
1. Downloaded the NEW `google-services.json` AFTER adding SHA-1
2. Replaced the old file
3. Cleared cache and rebuilt the app

---

**Need help?** Check the console logs for more specific error messages, or see GOOGLE_SIGNIN_FIX.md for detailed troubleshooting.

