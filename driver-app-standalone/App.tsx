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
import { ConfirmDialogProvider } from './utils/confirmDialog';
import {
  ensurePushPermission,
  setupForegroundNotificationHandler,
  setupNotificationTapHandler,
} from './services/PushService';
import { handleNotificationTap } from './utils/notificationRouting';
import { notifyPushReceived } from './utils/pushEvents';
import { useFonts } from 'expo-font';
import { fontAssets } from './themes/fonts';

// Register background message handler at module level (only for native platforms)
// This must be at module level for background notifications to work
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('FCM message handled in background (DRIVER APP):', remoteMessage);
    });
  } catch (error) {
    // Native module not ready yet - this is expected on first load
    // The module will be available after the app is rebuilt
    console.warn('Firebase messaging module not available:', error);
  }
}

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  /**
   * T-101 step 2. `fontError` is deliberately NOT allowed to block the app: a missing
   * face degrades to the system font, which is ugly but usable, and blocking startup
   * over a cosmetic asset would be worse than the cosmetic problem.
   *
   * ⚠️ It is logged loudly because a font failure is otherwise INVISIBLE — the text
   * renders in the fallback and looks *nearly* right, which is exactly how a wrong
   * weight ships unnoticed.
   */
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontError) {
      console.error('[fonts] FAILED TO LOAD — falling back to the system font:', fontError);
    }
  }, [fontError]);

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

      // Setup foreground notification handler
      // A push that lands while the app is OPEN arrives here, not through the
      // two tap handlers below — Android posts no system notification in that
      // case, so before T-046 the message was invisible and unreachable. It now
      // shows a toast that routes through the SAME handler when tapped.
      // T-068 — the first argument used to be `undefined`, so the toast was the
      // ONLY thing that happened: the screen underneath kept showing pre-push
      // data until the driver pulled to refresh. It now also announces the push
      // so whichever list is open can re-fetch itself.
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

  // Splash while checking connection AND while fonts load (T-101 step 2).
  // `|| fontError` releases the gate on failure — see the note above: a missing font
  // must not be able to hold the app on the splash screen.
  if (isConnected === null || !(fontsLoaded || fontError)) {
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
          <ConfirmDialogProvider>
            <RootNavigator />
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </ConfirmDialogProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

