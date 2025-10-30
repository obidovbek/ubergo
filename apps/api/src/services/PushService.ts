import axios from 'axios';
import { config } from '../config/index.js';

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushService {
  private fcmUrl = 'https://fcm.googleapis.com/fcm/send';

  async sendFCM(message: PushMessage): Promise<boolean> {
    if (!config.fcm.serverKey) {
      console.warn('FCM server key is not configured');
      return false;
    }

    const payload = {
      to: message.token,
      notification: {
        title: message.title,
        body: message.body,
        sound: 'default',
      },
      data: message.data || {},
      priority: 'high',
    };

    const res = await axios.post(this.fcmUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${config.fcm.serverKey}`,
      },
      timeout: 10000,
    });

    const json = res.data as any;
    const success = (json.success ?? 0) > 0;
    if (!success) {
      console.warn('FCM response indicates failure:', json);
    }
    return success;
  }
}

export default new PushService();


