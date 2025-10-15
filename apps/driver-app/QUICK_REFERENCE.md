# 🚀 Quick Reference Guide

## 📁 Where to Put Things

| What you're adding | Where it goes | Example |
|-------------------|---------------|---------|
| New API endpoint | `/api/resource.ts` | `api/rides.ts` |
| New screen | `/screens/ScreenName.tsx` | `screens/HomeScreen.tsx` |
| Reusable component | `/components/ComponentName.tsx` | `components/Button.tsx` |
| Screen section | `/sections/feature/SectionName.tsx` | `sections/home/RideTypeSelector.tsx` |
| Custom hook | `/hooks/useHookName.ts` | `hooks/useAuth.ts` |
| Utility function | `/utils/category.ts` | `utils/validation.ts` |
| Context/Provider | `/contexts/ContextName.tsx` | `contexts/AuthContext.tsx` |
| Static data | `/data/dataName.ts` | `data/rideTypes.ts` |
| Configuration | `/config/configName.ts` | `config/api.ts` |
| Theme colors | `/themes/palettes/mode.ts` | `themes/palettes/light.ts` |
| Layout wrapper | `/layout/LayoutName.tsx` | `layout/ScreenLayout.tsx` |
| Navigation | `/navigation/NavigatorName.tsx` | `navigation/MainNavigator.tsx` |

## 🎨 Common Code Snippets

### Create a New Screen

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../layout/ScreenLayout';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const MyScreen: React.FC = () => {
  return (
    <ScreenLayout>
      <Text style={styles.title}>My Screen</Text>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
  },
});
```

### Create an API Function

```typescript
import { API_BASE_URL, API_ENDPOINTS, getHeaders, API_TIMEOUT } from '../config/api';

export interface MyData {
  id: string;
  name: string;
}

export const getMyData = async (token: string): Promise<MyData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.myEndpoint}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

### Create a Custom Hook

```typescript
import { useState, useEffect } from 'react';

export const useMyHook = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Your logic here
  }, []);

  return { data, loading, error };
};
```

### Create a Component

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createTheme } from '../themes';

const theme = createTheme('light');

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.borderRadius.md,
  },
  text: {
    ...theme.typography.button,
    color: theme.palette.primary.contrastText,
  },
});
```

### Create a Context

```typescript
import React, { createContext, useState, ReactNode } from 'react';

interface MyContextType {
  value: string;
  setValue: (value: string) => void;
}

export const MyContext = createContext<MyContextType | null>(null);

interface MyProviderProps {
  children: ReactNode;
}

export const MyProvider: React.FC<MyProviderProps> = ({ children }) => {
  const [value, setValue] = useState('');

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
};

// Hook to use context
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

## 🎯 Common Tasks

### Navigate to Another Screen

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('ScreenName');
```

### Access Authentication

```typescript
import { useAuth } from './hooks/useAuth';

const { user, isAuthenticated, login, logout } = useAuth();
```

### Show Loading

```typescript
import { LoadingSpinner } from './components/@extended/LoadingSpinner';

{isLoading && <LoadingSpinner message="Loading..." />}
```

### Handle Errors

```typescript
try {
  await someAsyncFunction();
} catch (error) {
  Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
}
```

### Store Data Locally

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('@key', JSON.stringify(data));

// Retrieve
const data = await AsyncStorage.getItem('@key');
const parsed = data ? JSON.parse(data) : null;

// Remove
await AsyncStorage.removeItem('@key');
```

### Use Theme Values

```typescript
import { createTheme } from './themes';

const theme = createTheme('light');

// Colors
backgroundColor: theme.palette.background.default,
color: theme.palette.text.primary,

// Spacing
padding: theme.spacing(2),      // 16px
margin: theme.spacing(3),       // 24px

// Typography
...theme.typography.h2,

// Border Radius
borderRadius: theme.borderRadius.md,  // 12px

// Shadows
...theme.shadows.sm,
```

## 📱 Component Styling Pattern

```typescript
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  
  // Flexbox
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Text
  title: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
  },
  
  // Button
  button: {
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  
  // Card
  card: {
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    ...theme.shadows.sm,
  },
});
```

## 🔄 State Management Patterns

### Local State

```typescript
const [value, setValue] = useState(initialValue);
```

### Context State

```typescript
const { value, setValue } = useMyContext();
```

### Zustand Store

```typescript
const value = useStore(state => state.value);
const setValue = useStore(state => state.setValue);
```

## 🚨 Common Patterns

### List Rendering

```typescript
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  ListEmptyComponent={<EmptyState title="No items" />}
  onEndReached={loadMore}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
/>
```

### Modal

```typescript
<Modal
  visible={isVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setIsVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Content */}
    </View>
  </View>
</Modal>
```

### Form Input

```typescript
<TextInput
  style={styles.input}
  placeholder="Enter text"
  value={value}
  onChangeText={setValue}
  autoCapitalize="none"
  keyboardType="email-address"
/>
```

## 🔍 Debugging

### Console Log

```typescript
console.log('Value:', value);
console.error('Error:', error);
console.warn('Warning:', warning);
```

### React Native Debugger

```typescript
// In development, shake device or press:
// iOS: Cmd + D
// Android: Cmd + M

// Then select "Debug"
```

### Network Requests

```typescript
// Add logging to API calls
console.log('Request:', url, body);
console.log('Response:', response);
```

## 📦 Frequently Used Imports

```typescript
// React Native
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, FlatList } from 'react-native';

// Navigation
import { useNavigation } from '@react-navigation/native';

// Theme
import { createTheme } from '../themes';

// Auth
import { useAuth } from '../hooks/useAuth';

// Components
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/@extended/LoadingSpinner';
import { EmptyState } from '../components/@extended/EmptyState';

// Layout
import { ScreenLayout } from '../layout/ScreenLayout';

// Utils
import { formatDate, formatTime } from '../utils/date';
import { formatCurrency } from '../utils/format';
import { isValidEmail } from '../utils/validation';
```

## 🎨 Color Quick Reference

```typescript
// From theme.palette
primary.main           // Main brand color (#000000)
secondary.main         // Accent color (#00D9A5)
background.default     // Main background
background.card        // Card background
text.primary           // Main text color
text.secondary         // Secondary text color
error.main             // Error color
warning.main           // Warning color
success.main           // Success color
info.main              // Info color
```

## 📏 Spacing Quick Reference

```typescript
theme.spacing(0.5)  // 4px
theme.spacing(1)    // 8px
theme.spacing(2)    // 16px
theme.spacing(3)    // 24px
theme.spacing(4)    // 32px
theme.spacing(5)    // 40px
```

## 🔤 Typography Quick Reference

```typescript
theme.typography.h1      // 32px, 700
theme.typography.h2      // 28px, 700
theme.typography.h3      // 24px, 600
theme.typography.h4      // 20px, 600
theme.typography.h5      // 18px, 600
theme.typography.h6      // 16px, 600
theme.typography.body1   // 16px, 400
theme.typography.body2   // 14px, 400
theme.typography.caption // 12px, 400
theme.typography.button  // 16px, 600
```

## 📐 Border Radius Quick Reference

```typescript
theme.borderRadius.xs    // 4px
theme.borderRadius.sm    // 8px
theme.borderRadius.md    // 12px
theme.borderRadius.lg    // 16px
theme.borderRadius.xl    // 24px
theme.borderRadius.full  // 9999px (circular)
```

---

Keep this file handy for quick reference while developing!

