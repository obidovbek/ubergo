import { Platform } from 'react-native';
import { registerDevice } from '../api/devices';
import messaging from '@react-native-firebase/messaging';

/**
 * Request push notification permissions
 */
export async function ensurePushPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    console.log('Push permission status:', enabled ? 'granted' : 'denied');
    return enabled;
  } catch (e) {
    console.error('Error requesting push permissions:', e);
    return false;
  }
}

/**
 * Get FCM push token
 */
export async function getFcmPushToken(): Promise<string | null> {
  try {
    const hasPerm = await ensurePushPermission();
    if (!hasPerm) {
      console.log('Push permission not granted');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM push token obtained:', token);
    return token;
  } catch (e) {
    console.error('Error getting FCM push token:', e);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerPushTokenWithBackend(apiToken: string): Promise<void> {
  try {
    const token = await getFcmPushToken();
    console.log('Registering FCM push token with backend:', token);
    
    if (!token) {
      console.log('No push token available, skipping registration');
      return;
    }

    await registerDevice(apiToken, {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app: 'user',
    });
    
    console.log('FCM push token registered successfully');
  } catch (error) {
    console.error('Error registering FCM push token:', error);
  }
}

/**
 * Subscribe to token refresh events
 */
export function subscribeTokenRefresh(apiToken: string) {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    try {
      console.log('FCM push token refreshed:', token);
      await registerDevice(apiToken, {
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        app: 'user',
      });
      console.log('Refreshed FCM token registered successfully');
    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  });

  return unsubscribe;
}

/**
 * Setup foreground notification handler
 */
export function setupForegroundNotificationHandler() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('FCM message received in foreground:', remoteMessage);
    
    // You can display a local notification here if needed
    // For OTP codes, you might want to show an alert or auto-fill
    if (remoteMessage.data?.type === 'otp') {
      console.log('OTP received:', remoteMessage.data.code);
      // Could trigger auto-fill or show a notification
    }
  });

  return unsubscribe;
}


