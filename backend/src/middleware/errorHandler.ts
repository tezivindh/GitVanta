import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

/**
 * Every error response has the same shape:
 *   { success: false, error: string, code: string, details?: object }
 */
interface ErrorBody {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

function send(res: Response, status: number, body: Omit<ErrorBody, 'success'>): void {
  if (res.headersSent) return;
  res.status(status).json({ success: false, ...body });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Malformed JSON body from express.json()
  if ((err as any).type === 'entity.parse.failed') {
    send(res, 400, { error: 'Request body is not valid JSON.', code: 'BAD_JSON' });
    return;
  }
  if ((err as any).type === 'entity.too.large') {
    send(res, 413, { error: 'Request body is too large.', code: 'PAYLOAD_TOO_LARGE' });
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, {
      error: err.issues[0]?.message || 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    const line = `${req.method} ${req.path} -> ${err.statusCode} ${err.code}: ${err.message}`;
    if (err.statusCode >= 500) logger.error(line);
    else logger.warn(line);
    send(res, err.statusCode, {
      error: err.message,
      code: err.code,
      ...(err instanceof ValidationError && Object.keys(err.errors).length > 0
        ? { details: err.errors }
        : {}),
    });
    return;
  }

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    send(res, 400, { error: 'Invalid data.', code: 'VALIDATION_ERROR' });
    return;
  }

  if ((err as any).code === 11000) {
    send(res, 409, { error: 'Duplicate entry.', code: 'CONFLICT' });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    send(res, 401, { error: 'Invalid or expired token.', code: 'UNAUTHORIZED' });
    return;
  }

  // Unknown error: log the stack server-side, never send it in production.
  logger.error(`${req.method} ${req.path} -> 500: ${err.stack || err.message}`);
  const isProd = config.nodeEnv === 'production';
  send(res, 500, {
    error: isProd ? 'Something went wrong on our side. Please try again.' : err.message,
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  send(res, 404, { error: `Route ${req.method} ${req.path} not found`, code: 'NOT_FOUND' });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
