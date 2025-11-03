/**
 * Auth Action Types
 * Defines all possible authentication actions
 */

export const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
} as const;

export type AuthActionType = typeof AUTH_ACTIONS[keyof typeof AUTH_ACTIONS];

