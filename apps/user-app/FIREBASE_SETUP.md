# Firebase Configuration Setup

Your EAS build is failing because the Firebase configuration files are missing.

## Quick Fix

### Option 1: Add Firebase Config Files (Recommended)

1. **Download google-services.json:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon ⚙️ → **Project Settings**
   - Scroll to **Your apps** section
   - Find your Android app with package: `com.obidovbek94.UbexGoUser`
   - Click **Download google-services.json**
   - Save to: `apps/user-app/google-services.json`

2. **Download GoogleService-Info.plist (for iOS):**
   - In the same Firebase Project Settings
   - Find your iOS app
   - Click **Download GoogleService-Info.plist**
   - Save to: `apps/user-app/GoogleService-Info.plist`

3. **Commit the files:**
   ```bash
   cd apps/user-app
   git add google-services.json GoogleService-Info.plist
   git commit -m "Add Firebase configuration files"
   git push
   ```

4. **Rebuild:**
   ```bash
   eas build -p android --profile preview
   ```

### Option 2: Use EAS Secrets (More Secure)

If you prefer not to commit these files:

1. **Create base64 encoded versions:**
   ```powershell
   # In PowerShell
   cd apps/user-app
   $bytes = [System.IO.File]::ReadAllBytes("google-services.json")
   $base64 = [System.Convert]::ToBase64String($bytes)
   $base64 | Out-File -FilePath google-services-base64.txt
   ```

2. **Upload to EAS:**
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value @./google-services.json
   ```

3. **Update eas.json:**
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         },
         "env": {
           "GOOGLE_SERVICES_JSON": "@google-services.json"
         }
       }
     }
   }
   ```

4. **Add to .gitignore** (if not already there):
   ```
   google-services.json
   GoogleService-Info.plist
   ```

## Notes

- Firebase config files typically contain **client-side API keys** that are safe to commit
- Google recommends committing these files to version control
- The API keys in these files are restricted by package name/bundle ID
- If you still want to keep them secret, use Option 2

## Current Status

✅ EAS project slug fixed: `ubexgo-monorepo`
✅ `appVersionSource` configured in eas.json
❌ Firebase config files missing (blocking build)

Once you add the Firebase files, your build should succeed!

