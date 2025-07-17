import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';

// JWT Configuration
const JWT_CONFIG = {
  issuer: 'restaurant-inventory-system',
  audience: 'restaurant-app',
  algorithm: 'HS256' as const,
  accessTokenExpiry: '24h',
  // In production, we'd want shorter access tokens and refresh tokens
  // accessTokenExpiry: '15m',
  // refreshTokenExpiry: '7d',
};

interface CustomJWTPayload {
  userId: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Get JWT secret with proper validation
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    const errorMsg = 'JWT_SECRET environment variable is required but not set';
    console.error('🚨 SECURITY ERROR:', errorMsg);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    } else {
      console.warn('⚠️ Using fallback secret for development - DO NOT use in production');
      return 'dev-fallback-secret-change-in-production';
    }
  }
  
  if (secret.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters for security');
  }
  
  return secret;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<CustomJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
  try {
    const secret = getJWTSecret();
    
    const options: SignOptions = {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithm: JWT_CONFIG.algorithm,
    };
    
    return jwt.sign(payload, secret, options);
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyAccessToken(token: string): CustomJWTPayload {
  try {
    const secret = getJWTSecret();
    
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: [JWT_CONFIG.algorithm],
    });
    
    // Type assertion after verification
    const payload = decoded as CustomJWTPayload;
    
    // Validate required fields
    if (!payload.userId || !payload.email || !payload.role) {
      throw new Error('Invalid token payload: missing required fields');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      console.error('Token verification error:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode token without verification (for inspecting expired tokens)
 */
export function decodeToken(token: string): CustomJWTPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as CustomJWTPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Create auth response object
 */
export function createAuthResponse(user: { id: number; username: string; email: string; fullName: string; role: Role }) {
  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    expiresAt: getTokenExpiration(token),
  };
}

export { JWT_CONFIG };

// Type exports
export type { CustomJWTPayload };
