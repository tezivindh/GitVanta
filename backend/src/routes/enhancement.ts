import { Router } from 'express';
import * as enhancementController from '../controllers/enhancementController';
import { authenticateToken, asyncHandler, aiLimiter } from '../middleware';
import { validate } from '../middleware/validate';
import { repoParams, resumeQuery } from '../validation/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/status', asyncHandler(enhancementController.checkAiStatus));

const repo = validate({ params: repoParams });

router.post('/readme/:repoName', repo, aiLimiter, asyncHandler(enhancementController.enhanceReadme));
router.get('/readme/:repoName/analyze', repo, aiLimiter, asyncHandler(enhancementController.analyzeReadmeQuality));
router.post('/resume/:repoName', repo, aiLimiter, asyncHandler(enhancementController.generateResumeBullets));
router.post('/resume', validate({ query: resumeQuery }), aiLimiter, asyncHandler(enhancementController.generateAllResumeBullets));
router.post('/summary', aiLimiter, asyncHandler(enhancementController.generatePortfolioSummary));
router.post('/roadmap', aiLimiter, asyncHandler(enhancementController.generateImprovementRoadmap));
router.post('/description/:repoName', repo, aiLimiter, asyncHandler(enhancementController.generateProjectDescription));

export default router;
