# Required Dependencies for UbexGo User App

## Installation Commands

Run these commands to install all required dependencies for the new structure:

### Navigation (Already Installed)
```bash
# Already in package.json
# @react-navigation/native
# @react-navigation/bottom-tabs
# react-native-screens
# react-native-safe-area-context
```

### Additional Navigation
```bash
npm install @react-navigation/native-stack
```

### State Management
```bash
npm install zustand
```

### Storage
```bash
npm install @react-native-async-storage/async-storage
```

### Location Services
```bash
npm install expo-location
```

### Optional but Recommended
```bash
# Vector Icons
npm install react-native-vector-icons

# Date utilities
npm install date-fns
```

## Complete Installation Command

Run this single command to install all new dependencies:

```bash
npm install @react-navigation/native-stack zustand @react-native-async-storage/async-storage expo-location
```

## Dependency Overview

### Core Dependencies (Already Installed)
- ✅ `expo` - Expo SDK
- ✅ `react` - React library
- ✅ `react-native` - React Native framework
- ✅ `@react-navigation/native` - Navigation core
- ✅ `@react-navigation/bottom-tabs` - Bottom tab navigation
- ✅ `react-native-screens` - Native screen components
- ✅ `react-native-safe-area-context` - Safe area handling

### New Dependencies Required
- ⚠️ `@react-navigation/native-stack` - Native stack navigation
- ⚠️ `zustand` - Lightweight state management
- ⚠️ `@react-native-async-storage/async-storage` - Local storage
- ⚠️ `expo-location` - Location services

### Optional Dependencies
- 📦 `react-native-vector-icons` - Icon library
- 📦 `date-fns` - Date utility library

## Package.json Updates

Add these to your `dependencies` section:

```json
{
  "dependencies": {
    // ... existing dependencies
    "@react-navigation/native-stack": "^7.1.8",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "zustand": "^5.0.3",
    "expo-location": "~18.0.8"
  }
}
```

## Post-Installation Steps

1. **Clear cache** (if issues occur):
   ```bash
   npm start -- --clear
   ```

2. **Rebuild native modules** (if using bare workflow):
   ```bash
   npx expo prebuild --clean
   ```

3. **Update app configuration** in `app.json` if needed for permissions:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-location",
           {
             "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
           }
         ]
       ]
     }
   }
   ```

## Environment Setup

Create a `.env` file in the root (if needed):

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## TypeScript Types

Most packages include TypeScript types. If any are missing, install:

```bash
npm install --save-dev @types/react @types/react-native
```

## Verification

After installation, verify everything works:

```bash
# Check for any peer dependency issues
npm list

# Start the development server
npm start
```

## Troubleshooting

### Issue: AsyncStorage not found
**Solution**: Make sure to install `@react-native-async-storage/async-storage`

### Issue: Navigation types error
**Solution**: Ensure all navigation packages are the same version

### Issue: Location permissions
**Solution**: Add location permissions to `app.json` and rebuild

### Issue: Zustand not working
**Solution**: Check import syntax: `import { create } from 'zustand'`

## Version Compatibility

This structure is tested with:
- React: 19.1.0
- React Native: 0.81.4
- Expo: ~54.0.13
- TypeScript: ~5.9.2

## Next Steps

1. Install all dependencies
2. Update `app.json` with necessary permissions
3. Restart the development server
4. Test on iOS/Android emulator or device

## Documentation Links

- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

