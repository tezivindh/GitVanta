// =====================================================
// ROUTES INDEX
// =====================================================

import { Router } from 'express';
import authRoutes from './auth';
import analysisRoutes from './analysis';
import enhancementRoutes from './enhancement';
import repositoriesRoutes from './repositories';
import profileRoutes from './profile';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/analysis', analysisRoutes);
router.use('/enhance', enhancementRoutes);
router.use('/repositories', repositoriesRoutes);
router.use('/profile', profileRoutes);

export default router;
