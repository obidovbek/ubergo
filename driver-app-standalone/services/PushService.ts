import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDevice } from '../api/devices';

/**
 * The language this person actually reads. The API stores it on the user, so
 * push notifications can be written in it — until now they were written in the
 * language of whoever triggered them.
 */
async function getStoredLanguage(): Promise<string | undefined> {
  try {
    return (await AsyncStorage.getItem('@app_language')) ?? undefined;
  } catch {
    return undefined;
  }
}

// Only import Firebase messaging on native platforms
let messaging: any = null;
if (Platform.OS !== 'web') {
  messaging = require('@react-native-firebase/messaging').default;
}

const ANDROID_POST_NOTIFICATIONS = PermissionsAndroid?.PERMISSIONS?.POST_NOTIFICATIONS;

async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  // POST_NOTIFICATIONS permission is required starting from Android 13 (API 33)
  const needsRuntimePermission = typeof Platform.Version === 'number' ? Platform.Version >= 33 : false;

  if (!needsRuntimePermission || !ANDROID_POST_NOTIFICATIONS) {
    return true;
  }

  try {
    const alreadyGranted = await PermissionsAndroid.check(ANDROID_POST_NOTIFICATIONS);
    if (alreadyGranted) {
      return true;
    }

    const status = await PermissionsAndroid.request(ANDROID_POST_NOTIFICATIONS);
    const granted = status === PermissionsAndroid.RESULTS.GRANTED;

    if (!granted) {
      console.warn('POST_NOTIFICATIONS permission denied on Android');
    }

    return granted;
  } catch (error) {
    console.error('Failed to request Android notification permission:', error);
    return false;
  }
}

/**
 * Request push notification permissions
 */
export async function ensurePushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web platform');
    return false;
  }

  const androidGranted = await requestAndroidNotificationPermission();
  if (!androidGranted) {
    return false;
  }

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
  if (Platform.OS === 'web') {
    console.log('FCM push tokens not supported on web platform');
    return null;
  }

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
 * Register push token with backend (DRIVER APP)
 */
export async function registerPushTokenWithBackend(apiToken: string): Promise<void> {
  try {
    const token = await getFcmPushToken();
    console.log('Registering FCM push token with backend (DRIVER APP):', token);

    if (!token) {
      console.log('No push token available, skipping registration');
      return;
    }

    await registerDevice(apiToken, {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app: 'driver', // ← CRITICAL: This is the driver app
      language: await getStoredLanguage(),
    });

    console.log('FCM push token registered successfully (DRIVER APP)');
  } catch (error) {
    console.error('Error registering FCM push token:', error);
  }
}

/**
 * Subscribe to token refresh events
 */
export function subscribeTokenRefresh(apiToken: string) {
  if (Platform.OS === 'web') {
    console.log('Token refresh not supported on web platform');
    return () => { }; // Return no-op unsubscribe function
  }

  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    try {
      console.log('FCM push token refreshed:', token);
      await registerDevice(apiToken, {
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        app: 'driver', // ← CRITICAL: This is the driver app
        language: await getStoredLanguage(),
      });
      console.log('Refreshed FCM token registered successfully (DRIVER APP)');
    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  });

  return unsubscribe;
}

/**
 * Setup foreground notification handler
 */
export function setupForegroundNotificationHandler(onNotificationReceived?: (message: any) => void) {
  if (Platform.OS === 'web') {
    console.log('Foreground notification handler not supported on web platform');
    return () => { }; // Return no-op unsubscribe function
  }

  const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
    console.log('FCM message received in foreground (DRIVER APP):', remoteMessage);

    // Trigger callback if provided
    if (onNotificationReceived) {
      onNotificationReceived(remoteMessage);
    }

    // Handle different notification types
    if (remoteMessage.data?.type === 'passenger_join_request') {
      console.log('Passenger join request notification received:', remoteMessage.data);
      // Could trigger auto-refresh of passenger requests
    }
  });

  return unsubscribe;
}

/**
 * Handle the driver TAPPING a notification (OR-010 item 5).
 *
 * Two separate paths, and missing either one is the usual bug:
 *   - onNotificationOpenedApp: the app was in the background and got resumed;
 *   - getInitialNotification: the app was DEAD and the tap launched it. This one
 *     fires once, immediately, long before the navigator exists — which is why
 *     the callback parks the destination instead of navigating straight away.
 *
 * @param onTap receives the notification's `data` payload.
 * @returns an unsubscribe function.
 */
export function setupNotificationTapHandler(onTap: (data: any) => void) {
  if (Platform.OS === 'web') {
    console.log('Notification tap handler not supported on web platform');
    return () => { };
  }

  // Background -> tapped -> resumed
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage: any) => {
    console.log('Notification tapped (app was backgrounded):', remoteMessage);
    if (remoteMessage?.data) {
      onTap(remoteMessage.data);
    }
  });

  // Killed -> tapped -> launched. Resolves null on a normal launch.
  messaging()
    .getInitialNotification()
    .then((remoteMessage: any) => {
      if (remoteMessage?.data) {
        console.log('Notification tapped (app was closed):', remoteMessage);
        onTap(remoteMessage.data);
      }
    })
    .catch((error: any) => {
      console.warn('getInitialNotification failed:', error);
    });

  return unsubscribe;
}

