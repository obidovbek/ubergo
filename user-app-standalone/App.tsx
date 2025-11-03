/**
 * App Root Component
 * Main app component with providers
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { toastConfig } from './utils/toast';
import { ensurePushPermission, setupForegroundNotificationHandler } from './services/PushService';
import messaging from '@react-native-firebase/messaging';

// Register background message handler at module level
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('FCM message handled in background:', remoteMessage);
});

export default function App() {
  useEffect(() => {
    // Request push permissions on startup
    ensurePushPermission().catch((error) => {
      console.error('Error requesting push permissions:', error);
    });

    // Setup foreground notification handler
    const unsubscribeForeground = setupForegroundNotificationHandler();

    return () => {
      unsubscribeForeground();
    };
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

