import { Router } from 'express';
import * as enhancementController from '../controllers/enhancementController';
import { authenticateToken, asyncHandler, aiLimiter } from '../middleware';

const router = Router();

router.use(authenticateToken);

// AI status
router.get('/status', asyncHandler(enhancementController.checkAiStatus));

// README enhancement
router.post('/readme/:repoName', aiLimiter, asyncHandler(enhancementController.enhanceReadme));
router.get('/readme/:repoName/analyze', asyncHandler(enhancementController.analyzeReadmeQuality));

// Resume bullets
router.post('/resume/:repoName', aiLimiter, asyncHandler(enhancementController.generateResumeBullets));
router.post('/resume', aiLimiter, asyncHandler(enhancementController.generateAllResumeBullets));

// Portfolio summary
router.post('/summary', aiLimiter, asyncHandler(enhancementController.generatePortfolioSummary));

// Improvement roadmap
router.post('/roadmap', aiLimiter, asyncHandler(enhancementController.generateImprovementRoadmap));

// Project description
router.post('/description/:repoName', aiLimiter, asyncHandler(enhancementController.generateProjectDescription));

export default router;
