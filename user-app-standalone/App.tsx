/**
 * App Root Component
 * Main app component with providers
 */

import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { NetworkStatus } from './components/@extended/NetworkStatus';
import { SplashScreen } from './components/SplashScreen';
import Toast from 'react-native-toast-message';
import { toastConfig } from './utils/toast';
import { ensurePushPermission, setupForegroundNotificationHandler } from './services/PushService';

// Register background message handler at module level (only for native platforms)
if (Platform.OS !== 'web') {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('FCM message handled in background:', remoteMessage);
  });
}

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check network connectivity
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    // Check initial network state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    // Only setup push notifications on native platforms
    let unsubscribeForeground: (() => void) | undefined;
    if (Platform.OS !== 'web') {
      // Request push permissions on startup
      ensurePushPermission().catch((error) => {
        console.error('Error requesting push permissions:', error);
      });

      // Setup foreground notification handler
      unsubscribeForeground = setupForegroundNotificationHandler();
    }

    return () => {
      unsubscribe();
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, []);

  // Show network status screen if not connected
  if (isConnected === false) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NetworkStatus />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show splash screen while checking connection (only on first render)
  if (isConnected === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SplashScreen />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
          <Toast config={toastConfig} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

