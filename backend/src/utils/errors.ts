export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  /** Stable machine-readable code the frontend can branch on. */
  public code: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code ?? defaultCode(statusCode);

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class ExternalServiceError extends AppError {
  public service: string;

  constructor(service: string, message: string = 'External service error') {
    super(message, 502);
    this.service = service;
  }
}

function defaultCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 429: return 'RATE_LIMITED';
    case 502: return 'UPSTREAM_ERROR';
    case 503: return 'UNAVAILABLE';
    default: return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
  }
}
