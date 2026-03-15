import rateLimit from 'express-rate-limit';
import config from '../config';


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

export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    error: 'Analysis request limit reached, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
