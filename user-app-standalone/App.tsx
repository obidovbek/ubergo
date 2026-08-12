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
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RootNavigator } from './navigation/RootNavigator';
import { NetworkStatus } from './components/@extended/NetworkStatus';
import { SplashScreen } from './components/SplashScreen';
import Toast from 'react-native-toast-message';
import { toastConfig } from './utils/toast';
import { ConfirmDialogProvider } from './utils/confirmDialog';
import {
  ensurePushPermission,
  setupForegroundNotificationHandler,
  setupNotificationTapHandler,
} from './services/PushService';
import { handleNotificationTap } from './utils/notificationRouting';
import { notifyPushReceived } from './utils/pushEvents';

// Register background message handler at module level (only for native platforms)
// This must be at module level for background notifications to work
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('FCM message handled in background:', remoteMessage);
    });
  } catch (error) {
    // Native module not ready yet - this is expected on first load
    // The module will be available after the app is rebuilt
    console.warn('Firebase messaging module not available:', error);
  }
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
    let unsubscribeTap: (() => void) | undefined;
    if (Platform.OS !== 'web') {
      // Request push permissions on startup
      ensurePushPermission().catch((error) => {
        console.error('Error requesting push permissions:', error);
      });

      // A push that lands while the app is OPEN arrives here, not through the
      // two tap handlers below — Android posts no system notification in that
      // case, so before T-046 the message was invisible and unreachable. It now
      // shows a toast that routes through the SAME handler when tapped.
      // T-068 — the first argument used to be `undefined`, so the toast was the
      // ONLY thing that happened: the screen underneath kept showing pre-push
      // data until the user pulled to refresh. It now also announces the push so
      // whichever list is open can re-fetch itself.
      // ⚠️ Refresh only — navigation still happens exclusively on a TAP.
      unsubscribeForeground = setupForegroundNotificationHandler(
        notifyPushReceived,
        handleNotificationTap
      );

      // Tapping a notification must open the message, not the main menu (OR-010).
      // Registered here rather than inside the navigator because the cold-start
      // half fires once, immediately — handleNotificationTap parks it until
      // RootNavigator is ready.
      unsubscribeTap = setupNotificationTapHandler(handleNotificationTap);
    }

    return () => {
      unsubscribe();
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
      if (unsubscribeTap) {
        unsubscribeTap();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          {/* Show network status screen if not connected */}
          {isConnected === false ? (
            <>
              <NetworkStatus />
              <StatusBar style="auto" />
            </>
          ) : isConnected === null ? (
            /* Show splash screen while checking connection (only on first render) */
            <>
              <SplashScreen />
              <StatusBar style="light" />
            </>
          ) : (
            <AuthProvider>
              <NotificationProvider>
                <ConfirmDialogProvider>
                  <RootNavigator />
                  <StatusBar style="auto" />
                  <Toast config={toastConfig} />
                </ConfirmDialogProvider>
              </NotificationProvider>
            </AuthProvider>
          )}
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

