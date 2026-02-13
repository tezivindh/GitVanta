// =====================================================
// ENHANCEMENT CONTROLLER (AI)
// =====================================================

import { Response } from 'express';
import { aiService, githubService, analysisService } from '../services';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Check AI availability
 */
export async function checkAiStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  res.json({
    success: true,
    data: {
      available: aiService.isAiAvailable(),
      message: aiService.isAiAvailable() 
        ? 'AI features are available' 
        : 'AI features require a Google API key',
    },
  });
}

/**
 * Enhance README
 */
export async function enhanceReadme(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get current README
    const currentReadme = await githubService.getReadmeContent(
      user.accessToken,
      user.username,
      repoName
    );

    // Get repo info
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );
    const repo = repos.find(r => r.name === repoName);

    if (!repo) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }

    // Get languages
    const languages = await githubService.getRepositoryLanguages(
      user.accessToken,
      user.username,
      repoName
    );

    // Enhance README
    const enhancement = await aiService.enhanceReadme(
      repoName,
      currentReadme || '',
      repo.description || '',
      Object.keys(languages),
      repo.topics
    );

    res.json({
      success: true,
      data: enhancement,
    });
  } catch (error: any) {
    logger.error('Enhance README error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance README',
    });
  }
}

/**
 * Generate resume bullets
 */
export async function generateResumeBullets(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get repo info
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );
    const repo = repos.find(r => r.name === repoName);

    if (!repo) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }

    // Get languages and README
    const [languages, readme] = await Promise.all([
      githubService.getRepositoryLanguages(user.accessToken, user.username, repoName),
      githubService.getReadmeContent(user.accessToken, user.username, repoName),
    ]);

    const bullets = await aiService.generateResumeBullets(repo, languages, readme);

    res.json({
      success: true,
      data: bullets,
    });
  } catch (error: any) {
    logger.error('Generate resume bullets error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate resume bullets',
    });
  }
}

/**
 * Generate all resume bullets
 */
export async function generateAllResumeBullets(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get top repos
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );
    const topRepos = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, limit);

    // Generate bullets for each repo
    const results = await Promise.all(
      topRepos.map(async (repo) => {
        try {
          const [languages, readme] = await Promise.all([
            githubService.getRepositoryLanguages(user.accessToken, user.username, repo.name),
            githubService.getReadmeContent(user.accessToken, user.username, repo.name),
          ]);
          return await aiService.generateResumeBullets(repo, languages, readme);
        } catch (error) {
          return null;
        }
      })
    );

    res.json({
      success: true,
      data: results.filter(Boolean),
    });
  } catch (error: any) {
    logger.error('Generate all resume bullets error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate resume bullets',
    });
  }
}

/**
 * Generate portfolio summary
 */
export async function generatePortfolioSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get analysis
    let analysis = await analysisService.getLatestAnalysis(user._id);
    if (!analysis) {
      analysis = await analysisService.analyzePortfolio(
        user._id,
        user.username,
        user.accessToken
      );
    }

    // Get repos
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );

    const summary = await aiService.generatePortfolioSummary(
      user.username,
      repos,
      analysis.skills,
      analysis.overallScore
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('Generate portfolio summary error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate portfolio summary',
    });
  }
}

/**
 * Generate improvement roadmap
 */
export async function generateImprovementRoadmap(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get analysis
    let analysis = await analysisService.getLatestAnalysis(user._id);
    if (!analysis) {
      analysis = await analysisService.analyzePortfolio(
        user._id,
        user.username,
        user.accessToken
      );
    }

    // Get repos
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );

    const roadmap = await aiService.generateImprovementRoadmap(
      user.username,
      analysis.overallScore,
      analysis.skills,
      analysis.weaknesses.map((w: any) => w.issue),
      repos
    );

    res.json({
      success: true,
      data: roadmap,
    });
  } catch (error: any) {
    logger.error('Generate improvement roadmap error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate improvement roadmap',
    });
  }
}

/**
 * Analyze README quality
 */
export async function analyzeReadmeQuality(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  try {
    const readme = await githubService.getReadmeContent(
      user.accessToken,
      user.username,
      repoName
    );

    if (!readme) {
      res.json({
        success: true,
        data: {
          score: 0,
          feedback: ['No README file found'],
          missingElements: ['README file'],
        },
      });
      return;
    }

    if (aiService.isAiAvailable()) {
      const analysis = await aiService.analyzeReadmeQuality(readme);
      res.json({
        success: true,
        data: analysis,
      });
    } else {
      // Basic analysis without AI
      const score = calculateBasicReadmeScore(readme);
      res.json({
        success: true,
        data: {
          score,
          feedback: ['Basic analysis (AI not available)'],
          missingElements: [],
        },
      });
    }
  } catch (error: any) {
    logger.error('Analyze README quality error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze README',
    });
  }
}

/**
 * Generate project description
 */
export async function generateProjectDescription(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { repoName } = req.params;

  if (!aiService.isAiAvailable()) {
    res.status(503).json({
      success: false,
      error: 'AI features are not available. Please configure Google API key.',
    });
    return;
  }

  try {
    // Get repo info
    const repos = await githubService.getAllUserRepositories(
      user.accessToken,
      user.username
    );
    const repo = repos.find(r => r.name === repoName);

    if (!repo) {
      res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
      return;
    }

    // Get languages
    const languages = await githubService.getRepositoryLanguages(
      user.accessToken,
      user.username,
      repoName
    );

    const description = await aiService.generateProjectDescription(
      repoName,
      Object.keys(languages),
      repo.topics,
      repo.description
    );

    res.json({
      success: true,
      data: {
        description,
      },
    });
  } catch (error: any) {
    logger.error('Generate project description error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate project description',
    });
  }
}

// Helper function
function calculateBasicReadmeScore(content: string): number {
  let score = 0;
  if (content.length > 100) score += 10;
  if (content.length > 500) score += 15;
  if (content.length > 1000) score += 10;
  if (content.includes('#')) score += 10;
  if (content.includes('```')) score += 15;
  if (content.includes('install')) score += 10;
  if (content.includes('usage') || content.includes('example')) score += 10;
  if (content.includes('license') || content.includes('License')) score += 10;
  if (content.includes('contributing') || content.includes('Contributing')) score += 10;
  return Math.min(100, score);
}
