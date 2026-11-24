import { Router } from 'express';
import * as analysisController from '../controllers/analysisController';
import { authenticateToken, asyncHandler, analysisLimiter, exportLimiter, compareLimiter, aiLimiter } from '../middleware';
import { validate } from '../middleware/validate';
import { historyQuery, usernameParams } from '../validation/schemas';

const router = Router();

router.use(authenticateToken);

router.post('/analyze', analysisLimiter, asyncHandler(analysisController.analyzePortfolio));
router.get('/latest', asyncHandler(analysisController.getLatestAnalysis));
router.get('/history', validate({ query: historyQuery }), asyncHandler(analysisController.getHistory));
router.get('/score', asyncHandler(analysisController.getScoreBreakdown));
router.get('/skills', asyncHandler(analysisController.getSkills));
router.get('/badges', asyncHandler(analysisController.getBadges));
router.get('/improvements', asyncHandler(analysisController.getImprovements));
router.get('/insights', asyncHandler(analysisController.getRepoInsights));

// Regenerating the AI summary counts against the AI limit; plain views don't.
router.get(
  '/professional-profile',
  (req, res, next) => (req.query.refresh === 'true' ? aiLimiter(req, res, next) : next()),
  asyncHandler(analysisController.getProfessionalProfile)
);

router.get(
  '/compare/:username',
  validate({ params: usernameParams }),
  compareLimiter,
  asyncHandler(analysisController.compareProfiles)
);

router.get('/export/pdf', exportLimiter, asyncHandler(analysisController.exportToPDF));

export default router;
