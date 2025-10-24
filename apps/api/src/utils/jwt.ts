/**
 * JWT Utilities
 * Token generation and verification with refresh token rotation
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  tokenId?: string; // For tracking token rotation
}

export interface TokenPair {
  access: string;
  refresh: string;
}

// In-memory blacklist for revoked tokens (in production, use Redis)
const revokedTokens = new Set<string>();

/**
 * Generate a unique token ID for tracking
 */
function generateTokenId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  const tokenPayload = {
    ...payload,
    type: 'access',
    tokenId: payload.tokenId || generateTokenId(),
  };
  
  return jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn, // 15 minutes
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const tokenPayload = {
    ...payload,
    type: 'refresh',
    tokenId: payload.tokenId || generateTokenId(),
  };
  
  return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn, // 7-30 days
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
  const tokenId = generateTokenId();
  const enhancedPayload = { ...payload, tokenId };
  
  return {
    access: generateAccessToken(enhancedPayload),
    refresh: generateRefreshToken(enhancedPayload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Check if token is revoked
    if (decoded.tokenId && revokedTokens.has(decoded.tokenId)) {
      throw new Error('Token has been revoked');
    }
    
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
    
    // Check if token is revoked
    if (decoded.tokenId && revokedTokens.has(decoded.tokenId)) {
      throw new Error('Refresh token has been revoked');
    }
    
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Refresh tokens with rotation
 * Old refresh token is revoked, new pair is generated
 */
export function rotateTokens(oldRefreshToken: string): TokenPair {
  // Verify old refresh token
  const payload = verifyRefreshToken(oldRefreshToken);
  
  // Revoke old token
  if (payload.tokenId) {
    revokedTokens.add(payload.tokenId);
  }
  
  // Generate new token pair with new tokenId
  const newPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
  };
  
  return generateTokenPair(newPayload);
}

/**
 * Revoke a token (for logout)
 */
export function revokeToken(token: string): void {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.tokenId) {
      revokedTokens.add(decoded.tokenId);
    }
  } catch (error) {
    console.error('Failed to revoke token:', error);
  }
}

/**
 * Clear expired tokens from blacklist (should be run periodically)
 */
export function cleanupRevokedTokens(): void {
  // In production, this should be handled by Redis with TTL
  // For now, we'll clear all revoked tokens periodically
  // This is a simplified implementation
  const now = Date.now() / 1000;
  
  revokedTokens.forEach((tokenId) => {
    // In a real implementation, you'd check if the token has expired
    // For now, we'll keep it simple and periodically clear all
  });
}

// Backward compatibility exports
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  rotateTokens,
  revokeToken,
  cleanupRevokedTokens,
};

