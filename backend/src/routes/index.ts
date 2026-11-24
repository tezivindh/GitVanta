import { Router } from 'express';
import authRoutes from './auth';
import analysisRoutes from './analysis';
import enhancementRoutes from './enhancement';
import repositoriesRoutes from './repositories';
import profileRoutes from './profile';
import settingsRoutes from './settings';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/analysis', analysisRoutes);
router.use('/enhance', enhancementRoutes);
router.use('/repositories', repositoriesRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);

export default router;
