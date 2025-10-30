/**
 * Global Configuration
 * Application-wide settings and feature flags
 */

export { default as GOOGLE_CONFIG, validateGoogleConfig } from './google';

export const APP_CONFIG = {
  // App Information
  appName: 'UbexGo',
  appVersion: '1.0.0',
  
  // Feature Flags
  features: {
    enableBiometrics: true,
    enablePushNotifications: true,
    enableLocationTracking: true,
    enableChat: true,
    enablePayments: true,
  },
  
  // Map Configuration
  map: {
    defaultLatitude: 41.2995,  // Tashkent, Uzbekistan
    defaultLongitude: 69.2401,
    defaultZoom: 15,
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Cache Duration (in milliseconds)
  cache: {
    userProfile: 300000,     // 5 minutes
    rideHistory: 600000,     // 10 minutes
    driverList: 60000,       // 1 minute
  },
  
  // Timeouts
  timeouts: {
    driverSearch: 120000,    // 2 minutes
    rideAcceptance: 30000,   // 30 seconds
  },
};

export default APP_CONFIG;

