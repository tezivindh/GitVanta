// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { AuthenticationError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

    const user = await User.findById(decoded.userId).select('+accessToken');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      const user = await User.findById(decoded.userId).select('+accessToken');
      
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, username: string): string {
  const payload: JWTPayload = {
    userId,
    username,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  } as jwt.SignOptions);
}

/**
 * Verify token without middleware
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
}
