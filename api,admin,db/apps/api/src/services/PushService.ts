import axios from 'axios';
import { getFirebaseAdmin, isFirebaseInitialized } from './FirebaseService.js';

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushService {
  private expoUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * Determine token type (FCM or Expo)
   */
  private isExpoToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
  }

  /**
   * Send push notification via FCM using Firebase Admin SDK (Modern FCM HTTP v1 API)
   */
  async sendFCM(message: PushMessage): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      throw new Error('Firebase Admin SDK not initialized. Check service account configuration.');
    }

    try {
      const admin = getFirebaseAdmin();
      const messaging = admin.messaging();

      const payload = {
        notification: {
          title: message.title,
          body: message.body,
        },
        data: this.convertDataToStrings(message.data || {}),
        token: message.token,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      console.log('📤 Sending FCM push notification via Firebase Admin SDK...');
      const response = await messaging.send(payload);
      console.log('✅ Firebase Admin SDK: Push notification sent successfully');
      console.log('   Message ID:', response);
      return true;
    } catch (error: any) {
      console.error('❌ Firebase Admin SDK: Failed to send push notification');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      
      // Provide helpful error messages
      if (error.code === 'messaging/invalid-registration-token') {
        console.error('   → Token is invalid or expired. User needs to re-register their device.');
      } else if (error.code === 'messaging/registration-token-not-registered') {
        console.error('   → Token is not registered. User needs to register their device.');
      } else if (error.code === 'app/invalid-credential') {
        console.error('   → Invalid service account credentials. Check Firebase service account JSON.');
      } else if (error.message.includes('network')) {
        console.error('   → Network connectivity issue. Check DNS and internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Convert data object values to strings (Firebase requirement)
   */
  private convertDataToStrings(data: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = String(value);
    }
    return result;
  }

  /**
   * Send push notification via Expo Push Service
   */
  async sendExpo(message: PushMessage): Promise<boolean> {
    try {
      const payload = {
        to: message.token,
        title: message.title,
        body: message.body,
        data: message.data || {},
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      };

      console.log('Sending Expo push notification:', payload);
      console.log('Expo URL:', this.expoUrl);
      const res = await axios.post(this.expoUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        timeout: 10000,
      });

      const json = res.data as any;
      console.log('Expo push response:', json);

      // Expo returns { data: [{ status: 'ok', id: '...' }] } on success
      if (json.data && json.data[0]?.status === 'ok') {
        return true;
      }

      console.warn('Expo push notification failed:', json);
      return false;
    } catch (error: any) {
      console.error('Error sending Expo push:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send push notification (auto-detect FCM or Expo)
   */
  async send(message: PushMessage): Promise<boolean> {
    if (this.isExpoToken(message.token)) {
      console.log('Detected Expo push token, using Expo push service');
      return this.sendExpo(message);
    } else {
      console.log('Detected FCM token, using FCM service');
      return this.sendFCM(message);
    }
  }
}

export default new PushService();


