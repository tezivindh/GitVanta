import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticateToken, asyncHandler, aiTestLimiter } from '../middleware';
import { validate } from '../middleware/validate';
import { aiSettingsBody, aiTestBody, aiToggleBody } from '../validation/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/ai/providers', asyncHandler(settingsController.getProviders));
router.get('/ai', asyncHandler(settingsController.getAISettings));
router.put('/ai', validate({ body: aiSettingsBody }), asyncHandler(settingsController.saveAISettings));
router.patch('/ai', validate({ body: aiToggleBody }), asyncHandler(settingsController.toggleAISettings));
router.delete('/ai', asyncHandler(settingsController.deleteAISettings));
router.post('/ai/test', aiTestLimiter, validate({ body: aiTestBody }), asyncHandler(settingsController.testAIConnection));
router.post('/ai/models', aiTestLimiter, validate({ body: aiTestBody }), asyncHandler(settingsController.listAIModels));

export default router;
