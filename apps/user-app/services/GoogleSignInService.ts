/**
 * Google Sign-In Service for Expo
 * Uses expo-auth-session for OAuth flow
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

// Complete the WebBrowser authentication session
WebBrowser.maybeCompleteAuthSession();

// Get Google Client IDs from environment or config
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
  '975847085157-fkftohg6fjs1349u8julpu8glncangpk.apps.googleusercontent.com';

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export interface GoogleSignInResult {
  idToken: string;
  accessToken?: string;
  user?: {
    email: string;
    name: string;
    photo?: string;
  };
}

/**
 * Hook for Google Sign-In
 * Use this in your component
 */
export const useGoogleSignIn = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    // Add scopes if needed
    scopes: ['profile', 'email'],
  });

  const signIn = async (): Promise<GoogleSignInResult | null> => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { authentication } = result;
        
        if (!authentication?.idToken) {
          throw new Error('No ID token received from Google');
        }

        // Optionally fetch user info from Google
        let userInfo = null;
        if (authentication.accessToken) {
          try {
            const userInfoResponse = await fetch(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              {
                headers: { Authorization: `Bearer ${authentication.accessToken}` },
              }
            );
            userInfo = await userInfoResponse.json();
          } catch (error) {
            console.warn('Failed to fetch user info:', error);
          }
        }

        return {
          idToken: authentication.idToken,
          accessToken: authentication.accessToken,
          user: userInfo ? {
            email: userInfo.email,
            name: userInfo.name,
            photo: userInfo.picture,
          } : undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  return {
    signIn,
    request,
    isReady: !!request,
  };
};

/**
 * Alternative: Direct Google Sign-In (if using @react-native-google-signin/google-signin)
 * Note: This requires additional native configuration
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export class GoogleSignInServiceNative {
  private static configured = false;

  static configure() {
    if (this.configured) return;

    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });
      this.configured = true;
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
    }
  }

  static async signIn(): Promise<GoogleSignInResult> {
    try {
      this.configure();

      // Check if device supports Google Play services (Android only)
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: false, // Don't show update dialog
        });
        
        if (!hasPlayServices) {
          throw new Error('Google Play services not available');
        }
      }

      // Sign in
      const userInfo = await GoogleSignin.signIn();

      // Get ID token
      const tokens = await GoogleSignin.getTokens();

      return {
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        user: {
          email: userInfo.user.email,
          name: userInfo.user.name || '',
          photo: userInfo.user.photo || undefined,
        },
      };
    } catch (error: any) {
      // Provide more specific error messages
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services not available');
      } else {
        console.error('Native Google Sign-In error:', error);
        throw new Error(`Google Play services not available`); // Fallback to web flow
      }
    }
  }

  static async signOut() {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }

  static async isSignedIn(): Promise<boolean> {
    return GoogleSignin.isSignedIn();
  }
}

