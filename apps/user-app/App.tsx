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
// import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export default function App() {
  useEffect(() => {
    // TODO: Implement push notifications when Firebase is properly configured
    // For now, we'll use a different approach for OTP delivery
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

