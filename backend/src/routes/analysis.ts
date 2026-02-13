// =====================================================
// ANALYSIS ROUTES
// =====================================================

import { Router } from 'express';
import * as analysisController from '../controllers/analysisController';
import { authenticateToken, asyncHandler, analysisLimiter, exportLimiter } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Analysis endpoints
router.post('/analyze', analysisLimiter, asyncHandler(analysisController.analyzePortfolio));
router.get('/latest', asyncHandler(analysisController.getLatestAnalysis));
router.get('/score', asyncHandler(analysisController.getScoreBreakdown));
router.get('/skills', asyncHandler(analysisController.getSkills));
router.get('/badges', asyncHandler(analysisController.getBadges));
router.get('/improvements', asyncHandler(analysisController.getImprovements));
router.get('/insights', asyncHandler(analysisController.getRepoInsights));

// Recruiter profile
router.get('/recruiter', asyncHandler(analysisController.getRecruiterProfile));

// Comparison
router.get('/compare/:username', asyncHandler(analysisController.compareProfiles));

// Export
router.get('/export/pdf', exportLimiter, asyncHandler(analysisController.exportToPDF));

export default router;
