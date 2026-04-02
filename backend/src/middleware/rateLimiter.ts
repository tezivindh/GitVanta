import { NextFunction, Response } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

const DAILY_ANALYSIS_LIMIT = 3;
const fallbackAnalysisCounters = new Map<string, { count: number; resetAt: number }>();

function getSecondsUntilUtcMidnight(now: Date = new Date()): number {
  const tomorrowUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );

  return Math.max(1, Math.ceil((tomorrowUtcMidnight - now.getTime()) / 1000));
}

function setAnalysisRateHeaders(res: Response, currentCount: number): void {
  res.setHeader('X-RateLimit-Limit', DAILY_ANALYSIS_LIMIT.toString());
  res.setHeader(
    'X-RateLimit-Remaining',
    Math.max(DAILY_ANALYSIS_LIMIT - currentCount, 0).toString()
  );
}

async function incrementRedisAnalysisCounter(
  userId: string
): Promise<{ count: number; retryAfterSeconds: number }> {
  const redisClient = getRedisClient();

  if (!redisClient) {
    throw new Error('Redis client unavailable');
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const redisKey = `rate_limit:analysis:${userId}:${dateKey}`;
  const count = await redisClient.incr(redisKey);

  if (count === 1) {
    await redisClient.expire(redisKey, getSecondsUntilUtcMidnight());
  }

  const ttl = await redisClient.ttl(redisKey);

  return {
    count,
    retryAfterSeconds: ttl > 0 ? ttl : getSecondsUntilUtcMidnight(),
  };
}


export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequest,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

//strict for auth
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hr
  max: 50,
  message: {
    success: false,
    error: 'AI request limit reached, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function analysisLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId || req.user?._id?.toString();

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required for analysis requests.',
    });
    return;
  }

  try {
    if (isRedisAvailable()) {
      const { count, retryAfterSeconds } = await incrementRedisAnalysisCounter(userId);
      setAnalysisRateHeaders(res, count);

      if (count > DAILY_ANALYSIS_LIMIT) {
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        res.status(429).json({
          success: false,
          error: 'Daily analysis limit reached (3 requests/day). Please try again tomorrow.',
        });
        return;
      }

      next();
      return;
    }

    const now = Date.now();
    const resetInSeconds = getSecondsUntilUtcMidnight(new Date(now));
    const existingCounter = fallbackAnalysisCounters.get(userId);

    if (!existingCounter || now >= existingCounter.resetAt) {
      fallbackAnalysisCounters.set(userId, {
        count: 1,
        resetAt: now + resetInSeconds * 1000,
      });
      setAnalysisRateHeaders(res, 1);
      next();
      return;
    }

    existingCounter.count += 1;
    fallbackAnalysisCounters.set(userId, existingCounter);
    setAnalysisRateHeaders(res, existingCounter.count);

    if (existingCounter.count > DAILY_ANALYSIS_LIMIT) {
      res.setHeader(
        'Retry-After',
        Math.ceil((existingCounter.resetAt - now) / 1000).toString()
      );
      res.status(429).json({
        success: false,
        error: 'Daily analysis limit reached (3 requests/day). Please try again tomorrow.',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Analysis daily limiter error:', error);
    next();
  }
}

export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hr
  max: 30,
  message: {
    success: false,
    error: 'Export request limit reached, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
