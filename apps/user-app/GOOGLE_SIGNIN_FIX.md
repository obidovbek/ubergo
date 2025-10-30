# Google Sign-In Error Fix

## Problem
You're getting the error: **"Access blocked: Authorization Error - Missing required parameter: client_id"**

This happens because the OAuth client configuration is missing from your Firebase project.

## Root Cause
Looking at your `google-services.json` file:
```json
"oauth_client": []  // ← Empty! This is the problem
```

## Solution

### Step 1: Add OAuth Client in Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: **ubexgo-ae910**

2. **Add SHA-1 Certificate Fingerprint:**
   
   **For Development (Debug Build):**
   ```powershell
   # Windows PowerShell
   cd "C:\Program Files\Java\jdk-<version>\bin"
   .\keytool.exe -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
   ```
   
   **For Production (Release Build):**
   ```powershell
   # If you have a release keystore
   .\keytool.exe -list -v -keystore "D:\path\to\your\release.keystore" -alias your-alias
   ```

3. **Add SHA-1 to Firebase:**
   - In Firebase Console → Project Settings
   - Scroll to **Your apps** section
   - Find: `com.obidovbek94.UbexGoUser`
   - Click **Add Fingerprint**
   - Paste your SHA-1 certificate fingerprint
   - Click **Save**

4. **Enable Google Sign-In:**
   - Go to **Authentication** → **Sign-in method**
   - Click on **Google**
   - Toggle **Enable**
   - Add a support email
   - Click **Save**

5. **Download Updated `google-services.json`:**
   - Go back to **Project Settings**
   - Scroll to your Android app
   - Click **Download google-services.json**
   - Replace the file at: `apps/user-app/google-services.json`

### Step 2: Get Your OAuth Client IDs

After enabling Google Sign-In, you'll have OAuth client IDs. You can find them:

1. **In Firebase Console:**
   - Project Settings → Your Android app
   - The Web Client ID will be shown

2. **In Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - You should see:
     - Web client (for expo-auth-session)
     - Android client (for native sign-in)

3. **Copy the Web Client ID** (looks like: `xxx-xxx.apps.googleusercontent.com`)

### Step 3: Update Your Configuration

Create a `.env` file or update your configuration:

**Option A: Using Environment Variables**

Create `apps/user-app/.env`:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Option B: Update the Service File Directly**

Edit `apps/user-app/services/GoogleSignInService.ts`:
```typescript
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com';
```

### Step 4: Rebuild Your App

```bash
# Clear cache
cd apps/user-app
npx expo start --clear

# For development
npx expo run:android

# For EAS build
eas build -p android --profile preview
```

## Verification Checklist

After following these steps, verify:

- [ ] SHA-1 fingerprint added to Firebase
- [ ] Google Sign-In enabled in Firebase Authentication
- [ ] Support email added in Firebase Google provider
- [ ] New `google-services.json` downloaded and replaced
- [ ] `oauth_client` array is NOT empty in new `google-services.json`
- [ ] Web Client ID added to your code/config
- [ ] App rebuilt with new configuration

## Expected `google-services.json` Structure

After fixing, your file should look like:
```json
{
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:265820506317:android:14680ffa66c9e516bf0184",
        "android_client_info": {
          "package_name": "com.obidovbek94.UbexGoUser"
        }
      },
      "oauth_client": [
        {
          "client_id": "xxx-xxx.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "com.obidovbek94.UbexGoUser",
            "certificate_hash": "YOUR_SHA1_HERE"
          }
        },
        {
          "client_id": "xxx-xxx.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyB4j2nvsFU2Ki9lVd_RBF3gn_2ElyPg-sU"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Still Getting "Missing client_id" Error?
- Make sure you downloaded the NEW `google-services.json` AFTER enabling Google Sign-In
- Verify the `oauth_client` array is not empty
- Clean and rebuild: `cd android && ./gradlew clean` (if using bare workflow)

### "Play Services Not Available"?
- This is expected on emulators without Google Play
- Test on a real device with Google Play Services
- Or wait for the fallback to web-based OAuth (expo-auth-session)

### Web-based OAuth Not Working?
- Check that you have the Web Client ID configured
- Verify your redirect URI is registered in Google Cloud Console
- The redirect URI should be: `com.obidovbek94.UbexGoUser:/oauthredirect`

## Additional Resources

- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [@react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin)

## Quick Command Reference

```powershell
# Get SHA-1 fingerprint (Windows)
cd "C:\Program Files\Java\jdk-21\bin"
.\keytool.exe -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1"

# Clear Expo cache
cd apps/user-app
npx expo start --clear

# Run on Android
npx expo run:android

# Build with EAS
eas build -p android --profile preview
```

---

**Note:** The `client_id` parameter is required by Google's OAuth system. Without it configured in Firebase, Google cannot authenticate your app. Follow Step 1 carefully to add the SHA-1 fingerprint and enable Google Sign-In.

