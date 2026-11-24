import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as accountController from '../controllers/accountController';
import { authenticateToken, asyncHandler } from '../middleware';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateToken);

const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req as AuthenticatedRequest).userId || req.ip || 'unknown',
  message: { success: false, error: 'Too many account requests. Try again later.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/export', accountLimiter, asyncHandler(accountController.exportData));
router.post(
  '/sessions/revoke',
  accountLimiter,
  validate({ body: z.object({ keepCurrent: z.boolean().optional() }).strict() }),
  asyncHandler(accountController.signOutEverywhere)
);
router.delete(
  '/',
  accountLimiter,
  validate({ body: z.object({ confirm: z.string().max(100) }).strict() }),
  asyncHandler(accountController.deleteAccount)
);

export default router;
