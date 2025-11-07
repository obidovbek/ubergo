/**
 * App Root Component
 * Main app component with providers
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
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
  useEffect(() => {
    // Only setup push notifications on native platforms
    if (Platform.OS !== 'web') {
      // Request push permissions on startup
      ensurePushPermission().catch((error) => {
        console.error('Error requesting push permissions:', error);
      });

      // Setup foreground notification handler
      const unsubscribeForeground = setupForegroundNotificationHandler();

      return () => {
        unsubscribeForeground();
      };
    }
  }, []);

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

