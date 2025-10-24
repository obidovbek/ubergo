# 🏗️ UbexGo User App - Architecture Overview

## 📊 Visual Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER APP ENTRY POINT                         │
│                        (AuthProvider Wrapper)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ROOT NAVIGATOR                               │
│              (Checks authentication state)                           │
└───────────────┬──────────────────────────────────┬──────────────────┘
                │                                  │
    ┌───────────▼──────────┐          ┌───────────▼──────────┐
    │   Not Authenticated  │          │     Authenticated     │
    └───────────┬──────────┘          └───────────┬──────────┘
                │                                  │
                ▼                                  ▼
    ┌──────────────────────┐          ┌──────────────────────┐
    │  AUTH NAVIGATOR      │          │  MAIN NAVIGATOR      │
    │  (Stack)             │          │  (Bottom Tabs)       │
    ├──────────────────────┤          ├──────────────────────┤
    │ • LoginScreen        │          │ • HomeScreen         │
    │ • RegisterScreen     │          │ • ActivityScreen     │
    │ • ForgotPassword     │          │ • ProfileScreen      │
    └──────────────────────┘          └──────────────────────┘
```

## 🔄 Data Flow Architecture

```
┌─────────────┐
│   Screen    │  ← User Interface Layer
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐
│  Sections   │  ← Composable UI Sections
└──────┬──────┘
       │ composed of
       ▼
┌─────────────┐
│ Components  │  ← Reusable UI Components
└──────┬──────┘
       │ styled with
       ▼
┌─────────────┐
│   Themes    │  ← Styling System
└─────────────┘

┌─────────────┐
│   Screen    │
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐
│   Hooks     │  ← Business Logic & State
└──────┬──────┘
       │ interacts with
       ▼
┌─────────────┐
│  Contexts   │  ← Global State Management
└──────┬──────┘
       │ communicates via
       ▼
┌─────────────┐
│     API     │  ← Data Layer
└─────────────┘
```

## 🗂️ Layer Architecture

### Presentation Layer
```
screens/          → Full screen components
  └── uses
      ├── sections/      → Screen sections
      ├── layout/        → Layout wrappers
      └── components/    → UI components
```

### Business Logic Layer
```
hooks/            → Custom React hooks
  └── uses
      ├── contexts/      → Global state
      ├── store/         → Alternative state
      └── utils/         → Pure functions
```

### Data Layer
```
api/              → API client functions
  └── uses
      └── config/        → API configuration
```

## 🔐 Authentication Flow

```
┌──────────────┐
│  App Start   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  AuthProvider Init   │
│  - Check AsyncStorage│
│  - Load saved token  │
│  - Load saved user   │
└──────┬───────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
┌───────────┐  ┌──────────┐  ┌────────────┐
│ Has Token │  │ No Token │  │   Error    │
└─────┬─────┘  └─────┬────┘  └─────┬──────┘
      │              │              │
      ▼              ▼              ▼
┌───────────┐  ┌──────────┐  ┌────────────┐
│   Show    │  │   Show   │  │    Show    │
│Main Tabs  │  │  Login   │  │   Login    │
└───────────┘  └──────────┘  └────────────┘
```

## 📱 Screen Composition Pattern

```
┌────────────────────────────────────┐
│        ScreenLayout                │  ← Base layout wrapper
│  ┌──────────────────────────────┐  │
│  │    SafeAreaView              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │   ScrollView/View      │  │  │
│  │  │  ┌──────────────────┐  │  │  │
│  │  │  │   Section 1      │  │  │  │  ← ProfileHeader
│  │  │  ├──────────────────┤  │  │  │
│  │  │  │   Section 2      │  │  │  │  ← Menu Items
│  │  │  ├──────────────────┤  │  │  │
│  │  │  │   Component      │  │  │  │  ← Button
│  │  │  └──────────────────┘  │  │  │
│  │  └────────────────────────┘  │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## 🎨 Theme System Architecture

```
Theme System
├── Palettes
│   ├── light.ts
│   │   ├── primary colors
│   │   ├── secondary colors
│   │   ├── background colors
│   │   ├── text colors
│   │   └── semantic colors (error, warning, success)
│   └── dark.ts (same structure)
│
├── Typography
│   ├── h1-h6 (headings)
│   ├── body1-body2
│   ├── caption
│   └── button
│
├── Spacing
│   └── multiplier × 8px
│
├── Border Radius
│   ├── xs, sm, md, lg, xl
│   └── full (circular)
│
└── Shadows
    ├── sm (subtle)
    ├── md (medium)
    └── lg (prominent)
```

## 🔌 API Integration Pattern

```
Component/Screen
       │
       │ calls
       ▼
Custom Hook (useAuth, etc.)
       │
       │ calls
       ▼
API Function (getUserProfile, etc.)
       │
       │ makes HTTP request
       ▼
Backend Server
       │
       │ returns data
       ▼
API Function
       │
       │ returns typed data
       ▼
Custom Hook
       │
       │ updates state
       ▼
Component Re-renders
```

## 🗄️ State Management Layers

### 1. Local State (useState)
```typescript
// For component-specific state
const [count, setCount] = useState(0);
```

### 2. Context State (useContext + useReducer)
```typescript
// For authentication, theme, etc.
const { user, isAuthenticated } = useAuth();
```

### 3. Global State (Zustand)
```typescript
// For shared app state
const currentRide = useRideStore(state => state.currentRide);
```

### 4. Server State (React Query - if added)
```typescript
// For server data caching
const { data, isLoading } = useQuery('users', fetchUsers);
```

## 📦 Component Hierarchy

```
App
└── AuthProvider
    └── RootNavigator
        ├── AuthNavigator
        │   └── Stack.Navigator
        │       ├── LoginScreen
        │       ├── RegisterScreen
        │       └── ForgotPasswordScreen
        │
        └── MainNavigator
            └── Tab.Navigator
                ├── HomeScreen
                │   ├── ScreenLayout
                │   │   ├── LocationCard
                │   │   ├── RideTypeSelector (Section)
                │   │   │   └── Multiple RideTypeCards
                │   │   └── Button
                │
                ├── ActivityScreen
                │
                └── ProfileScreen
                    ├── ScreenLayout
                    │   ├── ProfileHeader (Section)
                    │   │   ├── Avatar
                    │   │   ├── User Info
                    │   │   └── Edit Button
                    │   ├── MenuList
                    │   └── Logout Button
```

## 🔄 Request-Response Cycle

```
1. User Action (Button Press)
           ↓
2. Event Handler in Screen
           ↓
3. Call Custom Hook Method
           ↓
4. Hook Updates Loading State
           ↓
5. Hook Calls API Function
           ↓
6. API Function Makes HTTP Request
           ↓
7. Server Processes & Responds
           ↓
8. API Function Returns Typed Data
           ↓
9. Hook Updates State/Context
           ↓
10. Screen Re-renders with New Data
           ↓
11. User Sees Updated UI
```

## 🛡️ Error Handling Flow

```
API Call
   │
   ├─ Success
   │   └─ Update state with data
   │
   └─ Error
       ├─ Network Error
       │   └─ Show "Check connection" message
       │
       ├─ 401 Unauthorized
       │   └─ Clear auth & redirect to login
       │
       ├─ 404 Not Found
       │   └─ Show "Not found" message
       │
       ├─ 500 Server Error
       │   └─ Show "Try again later" message
       │
       └─ Other Errors
           └─ Show generic error message
```

## 📱 Navigation Architecture

```
NavigationContainer
└── RootNavigator
    │
    ├─ If NOT authenticated
    │   └── AuthNavigator (Stack)
    │       ├── Login
    │       ├── Register
    │       └── ForgotPassword
    │
    └─ If authenticated
        └── MainNavigator (BottomTabs)
            ├── HomeStack (Stack)
            │   ├── Home
            │   ├── BookingDetails
            │   └── RideTracking
            │
            ├── ActivityStack (Stack)
            │   ├── Activity
            │   └── RideDetails
            │
            └── ProfileStack (Stack)
                ├── Profile
                ├── EditProfile
                ├── Settings
                └── Help
```

## 🔑 Key Design Principles

### 1. Separation of Concerns
- UI components don't contain business logic
- API calls are separated from components
- Styling is centralized in themes

### 2. Reusability
- Components are generic and reusable
- Hooks encapsulate reusable logic
- Utilities are pure functions

### 3. Type Safety
- TypeScript throughout
- Typed props and state
- API response types

### 4. Scalability
- Feature-based organization
- Easy to add new screens
- Modular architecture

### 5. Maintainability
- Clear folder structure
- Consistent naming
- Well-documented

## 🎯 File Dependency Graph

```
screens/HomeScreen.tsx
├── uses hooks/useAuth.ts
│   └── uses contexts/AuthContext.tsx
│       └── uses contexts/auth-reducer/
├── uses hooks/useLocation.ts
├── uses sections/home/RideTypeSelector.tsx
│   └── uses data/rideTypes.ts
├── uses components/Button.tsx
│   └── uses themes/index.ts
└── uses themes/index.ts
    ├── uses themes/palettes/light.ts
    └── uses themes/palettes/dark.ts
```

## 🚀 Performance Optimization Points

1. **Component Level**
   - Use `React.memo()` for expensive components
   - Implement `useMemo()` for expensive calculations
   - Use `useCallback()` for event handlers

2. **Navigation Level**
   - Lazy load screens
   - Enable screen optimization
   - Use navigation state persistence

3. **Data Level**
   - Cache API responses
   - Implement pagination
   - Debounce search inputs

4. **Image Level**
   - Optimize image sizes
   - Use appropriate formats
   - Implement lazy loading

## 📊 State Distribution

```
┌─────────────────────────────────────────────┐
│              LOCAL STATE                     │
│  (useState, useReducer in components)       │
│  • Form inputs                               │
│  • UI toggles                                │
│  • Temporary data                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           CONTEXT STATE                      │
│  (React Context + useReducer)               │
│  • Authentication                            │
│  • User preferences                          │
│  • Theme settings                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            GLOBAL STATE                      │
│  (Zustand, Redux, etc.)                     │
│  • Current ride                              │
│  • App-wide settings                         │
│  • Cached data                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          PERSISTENT STATE                    │
│  (AsyncStorage)                             │
│  • Auth tokens                               │
│  • User preferences                          │
│  • Offline data                              │
└─────────────────────────────────────────────┘
```

---

This architecture provides a solid foundation for building scalable, maintainable React Native applications following industry best practices.

