import { Router } from 'express';
import * as analysisController from '../controllers/analysisController';
import { authenticateToken, asyncHandler, analysisLimiter, exportLimiter, compareLimiter } from '../middleware';

const router = Router();

router.use(authenticateToken);

// Analysis endpoints
router.post('/analyze', analysisLimiter, asyncHandler(analysisController.analyzePortfolio));
router.get('/latest', asyncHandler(analysisController.getLatestAnalysis));
router.get('/history', asyncHandler(analysisController.getHistory));
router.get('/score', asyncHandler(analysisController.getScoreBreakdown));
router.get('/skills', asyncHandler(analysisController.getSkills));
router.get('/badges', asyncHandler(analysisController.getBadges));
router.get('/improvements', asyncHandler(analysisController.getImprovements));
router.get('/insights', asyncHandler(analysisController.getRepoInsights));

// Professional profile view
router.get('/professional-profile', asyncHandler(analysisController.getProfessionalProfile));

// Comparison
router.get('/compare/:username', compareLimiter, asyncHandler(analysisController.compareProfiles));

// Export
router.get('/export/pdf', exportLimiter, asyncHandler(analysisController.exportToPDF));

export default router;
