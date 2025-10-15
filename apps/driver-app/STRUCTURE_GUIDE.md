# UbexGo User App - React Native Structure Guide

This document explains the project structure and how it maps to the original React web structure from ferpiControl.

## 📁 Project Structure

```
user-app/
├── api/                    # API client functions (like axios/fetch calls)
│   ├── users.ts           # User-related API calls
│   └── rides.ts           # Ride-related API calls
│
├── assets/                # Static files (images, fonts, etc.)
│   └── images/           # Image assets
│
├── components/            # Reusable UI components
│   ├── @extended/        # Extended/enhanced components
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── cards/            # Card components
│   │   └── RideCard.tsx
│   └── Button.tsx        # Base button component
│
├── config/                # Configuration files
│   ├── api.ts            # API endpoints and settings
│   └── index.ts          # App-wide configuration
│
├── constants/             # Constants and enums
│   └── theme.ts          # Theme constants
│
├── contexts/              # React Context providers
│   ├── auth-reducer/     # Auth state management
│   │   ├── auth.actions.ts
│   │   └── auth.reducer.ts
│   └── AuthContext.tsx   # Authentication context
│
├── data/                  # Static/mock data
│   └── rideTypes.ts      # Ride type definitions
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useLocalStorage.ts # AsyncStorage hook
│   ├── usePagination.ts  # Pagination hook
│   └── useLocation.ts    # Location hook
│
├── layout/                # Layout components
│   ├── ScreenLayout.tsx  # Base screen layout
│   └── MainLayout.tsx    # Main app layout
│
├── menu-items/            # Navigation menu configuration
│   └── index.ts          # Menu structure definitions
│
├── navigation/            # React Navigation setup (equivalent to routes/)
│   ├── RootNavigator.tsx # Root navigation with auth routing
│   ├── MainNavigator.tsx # Bottom tab navigation
│   ├── AuthNavigator.tsx # Auth stack navigation
│   └── index.ts          # Navigation exports
│
├── screens/               # Screen components (equivalent to pages/)
│   ├── HomeScreen.tsx    # Home/booking screen
│   ├── ProfileScreen.tsx # User profile screen
│   └── LoginScreen.tsx   # Login screen
│
├── sections/              # Page sections (composable screen parts)
│   ├── home/
│   │   └── RideTypeSelector.tsx
│   └── profile/
│       └── ProfileHeader.tsx
│
├── store/                 # Global state management (Zustand example)
│   └── index.ts          # Store configuration
│
├── themes/                # Theme configuration
│   ├── palettes/
│   │   ├── light.ts      # Light theme colors
│   │   └── dark.ts       # Dark theme colors
│   └── index.ts          # Theme system
│
└── utils/                 # Utility functions
    ├── date.ts           # Date formatting utilities
    ├── validation.ts     # Form validation utilities
    └── format.ts         # General formatting utilities
```

## 🔄 Key Differences from React Web

### 1. **Navigation** (`navigation/` vs `routes/`)
- **Web**: Uses `react-router-dom` with `<Route>` components
- **React Native**: Uses `@react-navigation/native` with navigators
  - `BottomTabNavigator` for main tabs
  - `StackNavigator` for screen stacks
  - `DrawerNavigator` for side menus (optional)

### 2. **Screens** (`screens/` vs `pages/`)
- **Web**: Components in `pages/` directory
- **React Native**: Components in `screens/` directory
- Same concept, different naming convention

### 3. **Components**
- **Web**: Uses HTML elements (`<div>`, `<button>`, `<input>`)
- **React Native**: Uses core components (`<View>`, `<TouchableOpacity>`, `<TextInput>`)

### 4. **Styling**
- **Web**: Uses CSS/SCSS or styled-components
- **React Native**: Uses `StyleSheet.create()` with JavaScript objects
- No CSS files, all styles are inline objects

### 5. **Storage**
- **Web**: Uses `localStorage` / `sessionStorage`
- **React Native**: Uses `@react-native-async-storage/async-storage`

## 📦 Required Dependencies

### Core Navigation
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

### State Management
```bash
npm install zustand
```

### Storage
```bash
npm install @react-native-async-storage/async-storage
```

### Location
```bash
npm install expo-location
```

### Icons (optional)
```bash
npm install react-native-vector-icons
```

## 🎨 Theme System

The theme system provides:
- **Color palettes** (light/dark mode)
- **Typography** scale
- **Spacing** system (based on 8px grid)
- **Border radius** values
- **Shadow** presets

Usage example:
```typescript
import { createTheme } from '../themes';

const theme = createTheme('light');

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing(2),  // 16px
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
  },
});
```

## 🔐 Authentication Flow

1. App initializes with `AuthProvider` wrapping the entire app
2. `RootNavigator` checks authentication state
3. If authenticated → shows `MainNavigator` (tabs)
4. If not authenticated → shows `AuthNavigator` (login/register)
5. Auth state persists in AsyncStorage

## 📱 Screen Structure Pattern

Each screen should follow this pattern:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const ExampleScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Example Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  title: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
  },
});
```

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 📝 Best Practices

1. **Component Organization**: Keep components small and focused
2. **Type Safety**: Use TypeScript interfaces for props and data
3. **Reusability**: Extract common UI patterns into reusable components
4. **Performance**: Use `React.memo()` for expensive components
5. **Navigation**: Use typed navigation for better IntelliSense
6. **State Management**: Use contexts for global state, local state for component-specific data
7. **API Calls**: Always handle loading and error states
8. **Styling**: Use the theme system for consistency

## 🔧 Common Tasks

### Adding a New Screen
1. Create screen file in `screens/`
2. Add route to appropriate navigator in `navigation/`
3. Update navigation types if using TypeScript

### Adding a New API Endpoint
1. Define types in respective API file
2. Create API function using fetch/axios
3. Use in components with proper error handling

### Creating a Reusable Component
1. Create component in `components/`
2. Define props interface
3. Use theme system for styling
4. Export from index file if needed

## 📚 Additional Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Styling](https://reactnative.dev/docs/style)

