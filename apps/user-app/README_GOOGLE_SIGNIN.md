# 🔐 Google Sign-In Setup & Troubleshooting

> **Quick Status**: 🔴 Not Working → The error you saw means Firebase needs configuration

## 📋 Table of Contents

- [Problem Summary](#-problem-summary)
- [5-Minute Fix](#-5-minute-fix)
- [Documentation Guide](#-documentation-guide)
- [What Changed](#-what-changed)
- [Visual Guide](#-visual-guide)

## 🚨 Problem Summary

### The Error
```
❌ Access blocked: Authorization Error
❌ Missing required parameter: client_id
❌ Error 400: invalid_request
```

### The Cause
Your `google-services.json` has empty OAuth configuration:
```json
"oauth_client": []  // ← This should NOT be empty
```

### The Solution
Configure Firebase → Download new file → Rebuild app ✅

**Time Required**: 5 minutes  
**Difficulty**: 🟢 Easy

---

## ⚡ 5-Minute Fix

### Step 1️⃣: Get SHA-1 Fingerprint
```powershell
cd apps/user-app
.\scripts\get-sha1.ps1
```
📋 Copy the SHA-1 it shows (format: `AA:BB:CC:DD:...`)

### Step 2️⃣: Configure Firebase
1. 🌐 Open [Firebase Console](https://console.firebase.google.com/)
2. 🎯 Select project: **ubexgo-ae910**
3. ⚙️ Go to **Project Settings** → **Your apps**
4. 📱 Find: `com.obidovbek94.UbexGoUser`
5. ➕ Click **Add Fingerprint** → Paste SHA-1
6. 🔐 Go to **Authentication** → **Sign-in method**
7. ✅ Enable **Google** provider
8. 📧 Add support email
9. 💾 Click **Save**

### Step 3️⃣: Download New Configuration
1. ⚙️ Back to **Project Settings**
2. 📱 Find your Android app
3. ⬇️ Click **Download google-services.json**
4. 📂 Replace file at: `apps/user-app/google-services.json`

### Step 4️⃣: Rebuild
```bash
npx expo start --clear
npx expo run:android
```

### Step 5️⃣: Test
Try Google Sign-In → Should work! 🎉

---

## 📚 Documentation Guide

I created comprehensive documentation for you:

| File | Purpose | Time | When to Read |
|------|---------|------|--------------|
| 🚀 [START_HERE.md](./START_HERE.md) | Entry point & overview | 2 min | First time |
| ⚡ [QUICK_FIX_GOOGLE.md](./QUICK_FIX_GOOGLE.md) | Fast solution | 5 min | Want it fixed now |
| 🔍 [DIAGNOSIS.md](./DIAGNOSIS.md) | Understand the problem | 8 min | Want to learn why |
| 📖 [GOOGLE_SIGNIN_FIX.md](./GOOGLE_SIGNIN_FIX.md) | Detailed guide | 15 min | Need full reference |
| 🏗️ [GOOGLE_SIGNIN_SUMMARY.md](./GOOGLE_SIGNIN_SUMMARY.md) | Technical details | 20 min | Developer reference |
| 📁 [GOOGLE_SIGNIN_FILES_INDEX.md](./GOOGLE_SIGNIN_FILES_INDEX.md) | Navigation help | 3 min | Find specific info |

### 🎯 Choose Your Path

```
Just want it working? → QUICK_FIX_GOOGLE.md
Want to understand?  → DIAGNOSIS.md
Need detailed help?  → GOOGLE_SIGNIN_FIX.md
Technical details?   → GOOGLE_SIGNIN_SUMMARY.md
```

---

## 🔧 What Changed

### ✨ New Files Created

#### Documentation
- 📄 `START_HERE.md` - Entry point
- 📄 `QUICK_FIX_GOOGLE.md` - Quick solution
- 📄 `DIAGNOSIS.md` - Problem explanation
- 📄 `GOOGLE_SIGNIN_FIX.md` - Complete guide
- 📄 `GOOGLE_SIGNIN_SUMMARY.md` - Technical docs
- 📄 `GOOGLE_SIGNIN_FILES_INDEX.md` - Navigation
- 📄 `README_GOOGLE_SIGNIN.md` - This file

#### Code
- 🔧 `config/google.ts` - OAuth configuration
- 🔧 `scripts/get-sha1.ps1` - SHA-1 helper script

### 🔄 Files Updated

- ✅ `services/GoogleSignInService.ts` - Better error handling
- ✅ `config/index.ts` - Export Google config

### 🎁 New Features

- ✅ **Configuration validation** - Checks before sign-in
- ✅ **Helpful error messages** - Points to docs
- ✅ **Automatic fallback** - Native → Web OAuth
- ✅ **Console logs** - ✅/❌ indicators
- ✅ **Environment variables** - Flexible config
- ✅ **TypeScript types** - Type-safe code
- ✅ **PowerShell script** - Easy SHA-1 extraction

---

## 📊 Visual Guide

### Current State (Broken)
```
┌─────────────────────┐
│   Your Android App  │
│      (taps login)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ google-services.json│
│ oauth_client: []    │ ← EMPTY!
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Google OAuth      │
│ ❌ No client_id     │
└─────────────────────┘

Result: 🚫 Error!
```

### After Fix (Working)
```
┌─────────────────────┐
│   Your Android App  │
│      (taps login)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ google-services.json│
│ oauth_client: [✅]  │ ← POPULATED!
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Google OAuth      │
│ ✅ Valid client_id  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   ✅ Success!       │
│   User signed in    │
└─────────────────────┘

Result: 🎉 Works!
```

### The Fix Process
```
🔍 Get SHA-1
    ↓
⚙️ Add to Firebase
    ↓
✅ Enable Google Sign-In
    ↓
⬇️ Download new file
    ↓
🔄 Replace old file
    ↓
🔨 Rebuild app
    ↓
🎉 Test & celebrate!
```

---

## ✅ Checklist

Use this to track your progress:

### Firebase Setup
- [ ] Got SHA-1 fingerprint (using script or manual)
- [ ] Added SHA-1 to Firebase Console
- [ ] Enabled Google Sign-In in Authentication
- [ ] Added support email to Google provider
- [ ] Downloaded NEW `google-services.json`
- [ ] Verified `oauth_client` is NOT empty in new file

### App Configuration
- [ ] Replaced old `google-services.json` file
- [ ] Cleared Expo cache (`--clear`)
- [ ] Rebuilt app (`npx expo run:android`)
- [ ] Tested on device/emulator

### Verification
- [ ] Can tap "Sign in with Google" button
- [ ] Google sign-in popup appears
- [ ] Can select Google account
- [ ] No "client_id" error
- [ ] Successfully authenticated
- [ ] Redirected to home screen

---

## 🎓 Understanding SHA-1

### What is it?
```
Your app → Signed with certificate → Has unique SHA-1 fingerprint
```

### Why needed?
```
Security! Prevents fake apps from impersonating yours
```

### Two types:
- 🔵 **Debug** - For development (auto-generated)
- 🟢 **Release** - For production (you create it)

### How to get:
```powershell
# Easy way (our script)
.\scripts\get-sha1.ps1

# Manual way
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android
```

---

## 🆘 Troubleshooting

### Still getting "client_id" error?
✅ Check: Did you download the NEW `google-services.json` AFTER adding SHA-1?  
✅ Check: Did you replace the old file?  
✅ Check: Did you rebuild with `--clear`?  
✅ Check: Is `oauth_client` array empty?

### "Play Services not available"?
✅ Normal on emulators - app will use web OAuth  
✅ Test on real device for native flow  
✅ Both methods work!

### Web OAuth not working?
✅ Check: Web Client ID in `config/google.ts`  
✅ Check: Firebase Google Sign-In enabled  
✅ Check: Support email added

### How to verify fix?
```bash
# Check google-services.json
cat apps/user-app/google-services.json | grep -A 3 "oauth_client"

# Should show at least one client_id
```

---

## 🚀 Quick Commands

```powershell
# Get SHA-1 (Windows)
cd apps/user-app
.\scripts\get-sha1.ps1

# Clear cache and run
npx expo start --clear
npx expo run:android

# Build for EAS
eas build -p android --profile preview

# Check config (in code)
import { validateGoogleConfig } from './config';
validateGoogleConfig();
```

---

## 📞 Need Help?

### Quick Questions
→ Check [QUICK_FIX_GOOGLE.md](./QUICK_FIX_GOOGLE.md) FAQ

### Detailed Help
→ See [GOOGLE_SIGNIN_FIX.md](./GOOGLE_SIGNIN_FIX.md) Troubleshooting

### Understanding
→ Read [DIAGNOSIS.md](./DIAGNOSIS.md)

### Technical
→ Review [GOOGLE_SIGNIN_SUMMARY.md](./GOOGLE_SIGNIN_SUMMARY.md)

### Navigation
→ Use [GOOGLE_SIGNIN_FILES_INDEX.md](./GOOGLE_SIGNIN_FILES_INDEX.md)

---

## 🎯 Next Steps

### Now
1. ⚡ Run `.\scripts\get-sha1.ps1`
2. 🔧 Configure Firebase
3. ✅ Test Google Sign-In

### Later (Production)
1. 🔐 Generate release keystore
2. 🔑 Add release SHA-1 to Firebase
3. 🚀 Build for Play Store

### Future (iOS)
1. 📱 Create iOS app in Firebase
2. 📄 Download GoogleService-Info.plist
3. ⚙️ Configure iOS settings

---

## 💡 Pro Tips

1. **Use the script** - `get-sha1.ps1` does everything automatically
2. **Check console logs** - Look for ✅/❌ indicators
3. **Always clear cache** - Use `--clear` after config changes
4. **Keep these docs** - Reference for future issues
5. **Test both ways** - Try native (device) and web (emulator)

---

## ✨ Summary

**Problem**: OAuth not configured in Firebase  
**Solution**: Add SHA-1 → Enable provider → Download file  
**Time**: 5 minutes  
**Difficulty**: Easy 🟢  
**Status**: Code ready ✅ (just needs Firebase setup)

### Start Here
🚀 [START_HERE.md](./START_HERE.md) - Begin your journey

### Quick Fix
⚡ [QUICK_FIX_GOOGLE.md](./QUICK_FIX_GOOGLE.md) - 5-minute solution

### Documentation
📁 [GOOGLE_SIGNIN_FILES_INDEX.md](./GOOGLE_SIGNIN_FILES_INDEX.md) - Find anything

---

**Ready?** Let's fix this! 🚀

```powershell
cd apps/user-app
.\scripts\get-sha1.ps1
```

Good luck! 🎉

