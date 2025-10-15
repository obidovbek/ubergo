/**
 * Auth Action Types
 */

export const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
} as const;

export type AuthActionType = typeof AUTH_ACTIONS[keyof typeof AUTH_ACTIONS];

