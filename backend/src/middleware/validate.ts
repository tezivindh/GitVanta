import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

interface Schemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

/**
 * Validate and coerce request params/query/body with zod. On success the
 * parsed values replace the raw ones; on failure the ZodError goes to the
 * error handler, which returns a 400 with field details.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      next();
    } catch (error) {
      next(error);
    }
  };
}
