// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, asyncHandler, authLimiter } from '../middleware';

const router = Router();

// Public routes
router.get('/github', authLimiter, asyncHandler(authController.initiateOAuth));
router.get('/github/callback', asyncHandler(authController.handleCallback));

// Protected routes
router.get('/me', authenticateToken, asyncHandler(authController.getCurrentUser));
router.post('/logout', authenticateToken, asyncHandler(authController.logout));
router.post('/refresh', authenticateToken, asyncHandler(authController.refreshToken));

export default router;
