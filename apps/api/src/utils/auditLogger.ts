/**
 * Audit Logger Utility
 * Tracks user actions and system events
 */

import type { Request } from 'express';
import { AuditLog } from '../database/models/index.js';

interface AuditLogData {
  userId?: string;
  action: string;
  payload?: Record<string, any>;
  req?: Request;
}

/**
 * Mask sensitive data in phone numbers and emails
 */
function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Mask phone numbers: +998901234567 -> +998**...67
    if (data.match(/^\+[1-9]\d{1,14}$/)) {
      return data.slice(0, 4) + '**...' + data.slice(-2);
    }
    // Mask emails: user@example.com -> u**r@example.com
    if (data.includes('@')) {
      const [local, domain] = data.split('@');
      if (local.length > 2) {
        return local[0] + '**' + local[local.length - 1] + '@' + domain;
      }
      return '***@' + domain;
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      // Mask sensitive fields
      if (['phone', 'phone_e164', 'email', 'password', 'code', 'token'].includes(key.toLowerCase())) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = maskSensitiveData(data[key]);
      }
    }
    return masked;
  }
  
  return data;
}

/**
 * Extract client IP from request
 */
function getClientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }
  
  return req.ip || req.socket.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req?: Request): string | undefined {
  if (!req) return undefined;
  return req.headers['user-agent'];
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const maskedPayload = data.payload ? maskSensitiveData(data.payload) : {};
    
    await AuditLog.create({
      user_id: data.userId || null,
      action: data.action,
      ip: getClientIp(data.req),
      ua: getUserAgent(data.req),
      payload: maskedPayload,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failures shouldn't break the main flow
  }
}

/**
 * Audit action types
 */
export const AuditActions = {
  // Auth actions
  AUTH_OTP_SEND: 'auth.otp.send',
  AUTH_OTP_VERIFY: 'auth.otp.verify',
  AUTH_OTP_VERIFY_FAILED: 'auth.otp.verify.failed',
  AUTH_SSO_LOGIN: 'auth.sso.login',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_LOGOUT: 'auth.logout',
  
  // User actions
  USER_REGISTER: 'user.register',
  USER_UPDATE: 'user.update',
  USER_DELETE_REQUEST: 'user.delete.request',
  USER_DELETE_CANCEL: 'user.delete.cancel',
  USER_DELETE_COMPLETE: 'user.delete.complete',
  
  // Phone actions
  PHONE_ADD: 'phone.add',
  PHONE_VERIFY: 'phone.verify',
  PHONE_REMOVE: 'phone.remove',
  
  // Identity actions
  IDENTITY_LINK: 'identity.link',
  IDENTITY_UNLINK: 'identity.unlink',
} as const;

export default {
  log: logAudit,
  actions: AuditActions,
};

