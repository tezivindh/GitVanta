import { Router } from 'express';
import * as repositoryController from '../controllers/repositoryController';
import { authenticateToken, asyncHandler } from '../middleware';
import { validate } from '../middleware/validate';
import { commitsQuery, repoListQuery, repoParams } from '../validation/schemas';

const router = Router();

router.use(authenticateToken);

router.get('/', validate({ query: repoListQuery }), asyncHandler(repositoryController.getRepositories));
router.get('/stats', asyncHandler(repositoryController.getRepositoriesStats));
router.get('/:repoName', validate({ params: repoParams }), asyncHandler(repositoryController.getRepository));
router.get('/:repoName/languages', validate({ params: repoParams }), asyncHandler(repositoryController.getRepositoryLanguages));
router.get('/:repoName/readme', validate({ params: repoParams }), asyncHandler(repositoryController.getRepositoryReadme));
router.get(
  '/:repoName/commits',
  validate({ params: repoParams, query: commitsQuery }),
  asyncHandler(repositoryController.getRepositoryCommits)
);

export default router;
