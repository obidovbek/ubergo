# React Native Project Structure - Based on ferpiControl

This React Native project structure is adapted from the `ferpiControl/application/frontend` React web application, following React Native best practices while maintaining the same organizational principles.

## 🎯 Overview

This structure provides a scalable, maintainable, and organized codebase for a React Native application. It mirrors the proven architecture from the ferpiControl project, adapted for mobile development.

## 📂 Directory Structure

### `/api` - API Client Layer
Contains all API communication logic. Each file exports functions for specific resource operations (CRUD).

**Example**: `users.ts`, `rides.ts`

```typescript
// api/users.ts
export const getUserProfile = async (token: string): Promise<User> => {
  // API call implementation
};
```

### `/assets` - Static Assets
Stores images, fonts, and other static files.

**Structure**:
- `images/` - PNG, JPG, SVG files
- `fonts/` - Custom font files (if any)

### `/components` - Reusable UI Components
Fundamental building blocks used throughout the app.

**Subdirectories**:
- `@extended/` - Enhanced/extended components (LoadingSpinner, EmptyState)
- `cards/` - Card-style components
- Base components (Button, Input, etc.)

### `/config` - Configuration Files
Global application configuration and settings.

**Files**:
- `api.ts` - API endpoints and configuration
- `index.ts` - App-wide settings, feature flags

### `/constants` - Constants & Enums
Immutable values used across the application.

**Examples**: Action types, route paths, fixed values

### `/contexts` - React Context Providers
Global state management using Context API with useReducer pattern.

**Pattern**:
```
contexts/
├── auth-reducer/
│   ├── auth.actions.ts    # Action types
│   └── auth.reducer.ts    # Reducer logic
└── AuthContext.tsx        # Context provider
```

### `/data` - Static/Mock Data
Static data for development, testing, or app functionality.

**Examples**: Country lists, ride types, category data

### `/hooks` - Custom React Hooks
Reusable stateful logic extracted into custom hooks.

**Examples**:
- `useAuth()` - Authentication logic
- `useLocation()` - Device location access
- `usePagination()` - Pagination state management

### `/layout` - Layout Components
Structural components that define page layouts.

**Examples**:
- `ScreenLayout.tsx` - Base screen wrapper
- `MainLayout.tsx` - Main app layout

### `/menu-items` - Navigation Menu Configuration
Defines menu structure and navigation items.

**Usage**: Centralizes menu configuration for easy maintenance

### `/navigation` - React Navigation Setup
*React Native equivalent of `routes/` in web apps*

Navigation configuration using React Navigation library.

**Structure**:
- `RootNavigator.tsx` - Root navigation with auth routing
- `MainNavigator.tsx` - Bottom tab navigation (authenticated)
- `AuthNavigator.tsx` - Auth stack navigation (unauthenticated)
- `index.ts` - Type definitions and exports

### `/screens` - Screen Components
*React Native equivalent of `pages/` in web apps*

Top-level components for each screen in the app.

**Examples**:
- `HomeScreen.tsx` - Main home screen
- `ProfileScreen.tsx` - User profile screen
- `LoginScreen.tsx` - Authentication screen

### `/sections` - Screen Sections
Larger, composable components that build screen content.

**Structure**:
```
sections/
├── home/
│   └── RideTypeSelector.tsx
└── profile/
    └── ProfileHeader.tsx
```

### `/store` - Global State Management
Alternative/complementary to contexts for complex state (e.g., Zustand, Redux).

**Example**: Zustand stores for rides, UI state

### `/themes` - Theme System
Styling configuration including colors, typography, spacing.

**Structure**:
```
themes/
├── palettes/
│   ├── light.ts    # Light mode colors
│   └── dark.ts     # Dark mode colors
└── index.ts        # Theme system & utilities
```

### `/utils` - Utility Functions
Pure helper functions for common operations.

**Categories**:
- `date.ts` - Date formatting and manipulation
- `validation.ts` - Form validation
- `format.ts` - Value formatting (currency, numbers, etc.)

## 🔄 Key Adaptations from Web to React Native

| Aspect | React Web | React Native |
|--------|-----------|--------------|
| **Routing** | `routes/` with react-router-dom | `navigation/` with React Navigation |
| **Pages** | `pages/` directory | `screens/` directory |
| **Elements** | HTML (`div`, `button`) | Core components (`View`, `TouchableOpacity`) |
| **Styling** | CSS/SCSS files | StyleSheet objects |
| **Storage** | localStorage | AsyncStorage |
| **Navigation** | `<Link>`, `useNavigate()` | `navigation.navigate()` |

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install additional packages** (see DEPENDENCIES.md):
   ```bash
   npm install @react-navigation/native-stack zustand @react-native-async-storage/async-storage expo-location
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Run on device/emulator**:
   - iOS: Press `i`
   - Android: Press `a`
   - Physical device: Scan QR code with Expo Go

## 📋 File Naming Conventions

- **Components**: PascalCase (e.g., `HomeScreen.tsx`, `Button.tsx`)
- **Utilities**: camelCase (e.g., `date.ts`, `validation.ts`)
- **Types/Interfaces**: PascalCase with `I` prefix for interfaces (optional)
- **Constants**: UPPER_SNAKE_CASE for values, PascalCase for files

## 🎨 Styling Guidelines

Use the theme system for consistency:

```typescript
import { createTheme } from '../themes';

const theme = createTheme('light');

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing(2),          // Spacing system
    backgroundColor: theme.palette.background.default,  // Colors
    borderRadius: theme.borderRadius.md,  // Border radius
    ...theme.shadows.sm,                 // Shadows
  },
  title: {
    ...theme.typography.h2,             // Typography
    color: theme.palette.text.primary,
  },
});
```

## 🔐 Authentication Flow

```
App Start
    ↓
AuthProvider initializes
    ↓
Check AsyncStorage for token
    ↓
RootNavigator decides
    ↓
├─ Authenticated → MainNavigator (Tabs)
└─ Not Authenticated → AuthNavigator (Login/Register)
```

## 📱 Navigation Patterns

### Tab Navigation (Main)
```typescript
// Bottom tabs for main sections
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

### Stack Navigation (Auth)
```typescript
// Stack for auth flow
<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Register" component={RegisterScreen} />
</Stack.Navigator>
```

## 🧩 Component Composition Pattern

```
Screen (screens/)
    ↓
Layout (layout/)
    ↓
Sections (sections/)
    ↓
Components (components/)
```

**Example**:
```typescript
<ScreenLayout>
  <ProfileHeader user={user} />
  <MenuList items={menuItems} />
  <Button title="Logout" onPress={handleLogout} />
</ScreenLayout>
```

## 📚 Additional Documentation

- See `STRUCTURE_GUIDE.md` for detailed explanations
- See `DEPENDENCIES.md` for installation instructions
- See `REACT_STRUCTURE.md` for original web structure reference

## 🤝 Contributing

When adding new features:

1. Place API calls in `/api`
2. Create reusable components in `/components`
3. Create screens in `/screens`
4. Add navigation routes in `/navigation`
5. Use theme system for styling
6. Create custom hooks for reusable logic
7. Update TypeScript types accordingly

## 📝 Notes

- This structure supports TypeScript by default
- All style values should use the theme system
- API calls should handle loading/error states
- Components should be properly typed
- Use `React.memo()` for performance optimization when needed

## ✅ Structure Benefits

- **Scalability**: Easy to add new features without restructuring
- **Maintainability**: Clear organization makes code easy to find
- **Reusability**: Components and hooks can be shared across screens
- **Type Safety**: TypeScript integration throughout
- **Testability**: Clear separation of concerns aids testing
- **Team Collaboration**: Consistent structure helps team coordination

---

**Built with**: React Native, Expo, TypeScript, React Navigation
**Inspired by**: ferpiControl web application structure

