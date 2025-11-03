/**
 * Navigation Exports
 * Centralized export for all navigation components
 */

export { RootNavigator } from './RootNavigator';
export { MainNavigator } from './MainNavigator';
export { AuthNavigator } from './AuthNavigator';

// Navigation Types (for TypeScript)
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

