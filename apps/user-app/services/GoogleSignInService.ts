/**
 * Google Sign-In Service for Expo
 * Uses expo-auth-session for OAuth flow
 * 
 * SETUP REQUIRED:
 * 1. Add SHA-1 fingerprint to Firebase Console
 * 2. Enable Google Sign-In in Firebase Authentication
 * 3. Download updated google-services.json with oauth_client configured
 * 
 * See GOOGLE_SIGNIN_FIX.md for detailed instructions
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import GOOGLE_CONFIG from '../config/google';

// Complete the WebBrowser authentication session
WebBrowser.maybeCompleteAuthSession();

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
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    scopes: GOOGLE_CONFIG.scopes,
  });

  const signIn = async (): Promise<GoogleSignInResult | null> => {
    try {
      // Validate configuration before attempting sign-in
      if (!GOOGLE_CONFIG.isConfigured()) {
        const errors = GOOGLE_CONFIG.getConfigErrors();
        throw new Error(
          `Google Sign-In is not properly configured:\n${errors.join('\n')}\n\nPlease check GOOGLE_SIGNIN_FIX.md for setup instructions.`
        );
      }

      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { authentication } = result;
        
        if (!authentication?.idToken) {
          throw new Error('No ID token received from Google. Please ensure OAuth client is properly configured in Firebase.');
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
      } else if (result.type === 'error') {
        console.error('Google Sign-In error:', result.error);
        throw new Error(`Google Sign-In failed: ${result.error?.message || 'Unknown error'}`);
      }

      return null;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('client_id')) {
        throw new Error(
          'Google Sign-In configuration error: Missing OAuth client ID. ' +
          'Please follow the setup instructions in GOOGLE_SIGNIN_FIX.md to configure Firebase properly.'
        );
      }
      
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
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export class GoogleSignInServiceNative {
  private static configured = false;

  static configure() {
    console.log('Google Sign-In native module disabled for Expo Go compatibility');
  }

  static async signIn(): Promise<GoogleSignInResult> {
    throw new Error('Native Google Sign-In not available in Expo Go. Use development build or web flow.');
  }

  static async signOut() {
    console.log('Google Sign-Out not available in Expo Go');
  }

  static async isSignedIn(): Promise<boolean> {
    return false;
  }
}

