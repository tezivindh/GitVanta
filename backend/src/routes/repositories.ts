// =====================================================
// REPOSITORIES ROUTES
// =====================================================

import { Router } from 'express';
import * as repositoryController from '../controllers/repositoryController';
import { authenticateToken, asyncHandler } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Repository endpoints
router.get('/', asyncHandler(repositoryController.getRepositories));
router.get('/stats', asyncHandler(repositoryController.getRepositoriesStats));
router.get('/:repoName', asyncHandler(repositoryController.getRepository));
router.get('/:repoName/languages', asyncHandler(repositoryController.getRepositoryLanguages));
router.get('/:repoName/readme', asyncHandler(repositoryController.getRepositoryReadme));
router.get('/:repoName/commits', asyncHandler(repositoryController.getRepositoryCommits));

export default router;
