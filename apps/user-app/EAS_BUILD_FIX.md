# EAS Build Fix for Monorepo

## Problem
The EAS build was failing with the error:
```
Error: Unable to resolve module ../../App from /home/expo/workingdir/build/node_modules/expo/AppEntry.js
```

This happened because EAS was building from the monorepo root but couldn't find the App.tsx file at the expected location.

## Solution

### 1. Root-level `eas.json` Configuration
Updated the root `eas.json` to specify the app directory:

```json
{
  "cli": {
    "version": ">= 16.24.1",
    "appVersionSource": "remote",
    "appRoot": "apps/user-app"  // ← Added this
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 2. Removed Duplicate Configuration
- Deleted `apps/user-app/eas.json` (duplicate)
- Removed custom `entryPoint` from `apps/user-app/app.json` (uses default `index.js` from package.json)

### 3. File Structure
The correct structure is now:
```
UberGo/
├── eas.json                 # Root config with appRoot
├── app.json                 # Root minimal config
└── apps/
    └── user-app/
        ├── app.json         # App-specific config
        ├── package.json     # main: "index.js"
        ├── index.js         # Entry point
        └── App.tsx          # Main app component
```

## How to Build Now

From the **root directory** of the monorepo:

```bash
# Preview build (APK)
eas build -p android --profile preview

# Production build (AAB)
eas build -p android --profile production

# iOS build
eas build -p ios --profile production
```

EAS will automatically use the `appRoot: "apps/user-app"` configuration and build from that directory.

## Alternative Approach

If you prefer to build from within the app directory:

```bash
cd apps/user-app
eas build -p android --profile preview
```

But with the current setup, building from root is the recommended approach.

