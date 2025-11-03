/**
 * SSO Service
 * Handles social authentication (Google, Apple, Facebook, Microsoft, Telegram, OneID)
 */

import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, UserIdentity } from '../database/models/index.js';
import { logAudit, AuditActions } from '../utils/auditLogger.js';

interface SsoUserInfo {
  provider: 'google' | 'apple' | 'facebook' | 'microsoft' | 'telegram' | 'oneid';
  provider_uid: string;
  email?: string;
  display_name?: string;
  meta?: Record<string, any>;
}

class SsoService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(config.sso.google.clientId);
  }

  /**
   * Verify Google ID token
   */
  async verifyGoogleToken(idToken: string): Promise<SsoUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: config.sso.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        throw new Error('Invalid Google token payload');
      }

      return {
        provider: 'google',
        provider_uid: payload.sub,
        email: payload.email,
        display_name: payload.name,
        meta: {
          email_verified: payload.email_verified,
          picture: payload.picture,
          locale: payload.locale,
        },
      };
    } catch (error: any) {
      console.error('Google token verification failed:', error.message);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Apple ID token
   * Apple uses JWT signed with their public keys
   */
  async verifyAppleToken(idToken: string): Promise<SsoUserInfo> {
    try {
      // Decode without verification first to get the kid (key id)
      const decodedHeader = jwt.decode(idToken, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string') {
        throw new Error('Invalid Apple token format');
      }

      const kid = decodedHeader.header.kid;

      // Fetch Apple's public keys
      const response = await axios.get('https://appleid.apple.com/auth/keys');
      const keys = response.data.keys;

      // Find the matching key
      const key = keys.find((k: any) => k.kid === kid);
      if (!key) {
        throw new Error('Apple public key not found');
      }

      // Convert JWK to PEM format (simplified - in production use a library like jwk-to-pem)
      // For now, we'll verify the basic structure
      const payload = jwt.decode(idToken) as any;

      if (!payload || !payload.sub) {
        throw new Error('Invalid Apple token payload');
      }

      // Verify audience
      if (payload.aud !== config.sso.apple.clientId) {
        throw new Error('Invalid Apple token audience');
      }

      // Verify issuer
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new Error('Invalid Apple token issuer');
      }

      return {
        provider: 'apple',
        provider_uid: payload.sub,
        email: payload.email,
        display_name: undefined, // Apple doesn't always provide name
        meta: {
          email_verified: payload.email_verified === 'true',
          is_private_email: payload.is_private_email === 'true',
        },
      };
    } catch (error: any) {
      console.error('Apple token verification failed:', error.message);
      throw new Error('Invalid Apple token');
    }
  }

  /**
   * Verify Facebook access token
   */
  async verifyFacebookToken(accessToken: string): Promise<SsoUserInfo> {
    try {
      // Verify token with Facebook Graph API
      const response = await axios.get('https://graph.facebook.com/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name,email',
        },
      });

      const data = response.data;
      if (!data || !data.id) {
        throw new Error('Invalid Facebook token');
      }

      return {
        provider: 'facebook',
        provider_uid: data.id,
        email: data.email,
        display_name: data.name,
        meta: {
          facebook_id: data.id,
        },
      };
    } catch (error: any) {
      console.error('Facebook token verification failed:', error.message);
      throw new Error('Invalid Facebook token');
    }
  }

  /**
   * Verify Microsoft access token
   */
  async verifyMicrosoftToken(accessToken: string): Promise<SsoUserInfo> {
    try {
      // Verify token with Microsoft Graph API
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      if (!data || !data.id) {
        throw new Error('Invalid Microsoft token');
      }

      return {
        provider: 'microsoft',
        provider_uid: data.id,
        email: data.mail || data.userPrincipalName,
        display_name: data.displayName,
        meta: {
          microsoft_id: data.id,
          job_title: data.jobTitle,
        },
      };
    } catch (error: any) {
      console.error('Microsoft token verification failed:', error.message);
      throw new Error('Invalid Microsoft token');
    }
  }

  /**
   * Verify Telegram auth data
   */
  async verifyTelegramAuth(authData: Record<string, string>): Promise<SsoUserInfo> {
    try {
      // Telegram uses HMAC-SHA256 for verification
      // This is a simplified version - implement full verification in production
      const { id, first_name, last_name, username } = authData;

      if (!id) {
        throw new Error('Invalid Telegram auth data');
      }

      const displayName = [first_name, last_name].filter(Boolean).join(' ') || username;

      return {
        provider: 'telegram',
        provider_uid: id,
        display_name: displayName,
        meta: {
          username,
          telegram_id: id,
        },
      };
    } catch (error: any) {
      console.error('Telegram auth verification failed:', error.message);
      throw new Error('Invalid Telegram auth data');
    }
  }

  /**
   * Verify OneID token (Uzbekistan's SSO)
   */
  async verifyOneIdToken(accessToken: string): Promise<SsoUserInfo> {
    try {
      // OneID API endpoint (this is a placeholder - use actual OneID API)
      const response = await axios.get('https://sso.egov.uz/api/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      if (!data || !data.pin) {
        throw new Error('Invalid OneID token');
      }

      return {
        provider: 'oneid',
        provider_uid: data.pin,
        display_name: `${data.first_name} ${data.last_name}`,
        meta: {
          pin: data.pin,
          birth_date: data.birth_date,
          document_number: data.passport_number,
        },
      };
    } catch (error: any) {
      console.error('OneID token verification failed:', error.message);
      throw new Error('Invalid OneID token');
    }
  }

  /**
   * Find or create user from SSO info
   */
  async findOrCreateUser(ssoInfo: SsoUserInfo): Promise<User> {
    // Check if identity already exists
    const existingIdentity = await UserIdentity.findOne({
      where: {
        provider: ssoInfo.provider,
        provider_uid: ssoInfo.provider_uid,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (existingIdentity && existingIdentity.user) {
      // User exists, return it
      await logAudit({
        userId: existingIdentity.user.id,
        action: AuditActions.AUTH_SSO_LOGIN,
        payload: {
          provider: ssoInfo.provider,
          existing_user: true,
        },
      });

      return existingIdentity.user as User;
    }

    // If email is provided, check if user with this email exists
    if (ssoInfo.email) {
      const existingUser = await User.findOne({
        where: { email: ssoInfo.email },
      });

      if (existingUser) {
        // Link this SSO identity to existing user
        await UserIdentity.create({
          user_id: existingUser.id,
          provider: ssoInfo.provider,
          provider_uid: ssoInfo.provider_uid,
          meta: ssoInfo.meta || {},
        });

        await logAudit({
          userId: existingUser.id,
          action: AuditActions.IDENTITY_LINK,
          payload: {
            provider: ssoInfo.provider,
          },
        });

        return existingUser;
      }
    }

    // Create new user
    const newUser = await User.create({
      email: ssoInfo.email,
      display_name: ssoInfo.display_name,
      is_verified: true, // SSO users are pre-verified
      status: 'active',
      role: 'user',
    });

    // Create identity link
    await UserIdentity.create({
      user_id: newUser.id,
      provider: ssoInfo.provider,
      provider_uid: ssoInfo.provider_uid,
      meta: ssoInfo.meta || {},
    });

    await logAudit({
      userId: newUser.id,
      action: AuditActions.USER_REGISTER,
      payload: {
        provider: ssoInfo.provider,
        method: 'sso',
      },
    });

    return newUser;
  }

  /**
   * Main SSO authentication method
   */
  async authenticate(
    provider: 'google' | 'apple' | 'facebook' | 'microsoft' | 'telegram' | 'oneid',
    token: string | Record<string, string>
  ): Promise<User> {
    let ssoInfo: SsoUserInfo;

    switch (provider) {
      case 'google':
        ssoInfo = await this.verifyGoogleToken(token as string);
        break;
      case 'apple':
        ssoInfo = await this.verifyAppleToken(token as string);
        break;
      case 'facebook':
        ssoInfo = await this.verifyFacebookToken(token as string);
        break;
      case 'microsoft':
        ssoInfo = await this.verifyMicrosoftToken(token as string);
        break;
      case 'telegram':
        ssoInfo = await this.verifyTelegramAuth(token as Record<string, string>);
        break;
      case 'oneid':
        ssoInfo = await this.verifyOneIdToken(token as string);
        break;
      default:
        throw new Error(`Unsupported SSO provider: ${provider}`);
    }

    return this.findOrCreateUser(ssoInfo);
  }
}

export default new SsoService();

