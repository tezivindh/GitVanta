import { Response } from 'express';
import { analysisService, pdfService } from '../services';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export async function analyzePortfolio(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const result = await analysisService.analyzePortfolio(
      user._id,
      user.username,
      user.accessToken
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio',
    });
  }
}


export async function getLatestAnalysis(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found. Please run an analysis first.',
      });
      return;
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    logger.error('Get analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis',
    });
  }
}


export async function getRepoInsights(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const insights = await analysisService.getRepoInsights(user._id);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    logger.error('Get insights error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get repository insights',
    });
  }
}


export async function getProfessionalProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const profile = await analysisService.generateProfessionalProfile(
      user._id,
      user.username,
      user.accessToken
    );

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    logger.error('Professional profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate professional profile',
    });
  }
}


export async function compareProfiles(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;
  const { username: compareUsername } = req.params;

  if (!compareUsername) {
    res.status(400).json({
      success: false,
      error: 'Username to compare is required',
    });
    return;
  }

  try {
    const comparison = await analysisService.compareProfiles(
      user._id,
      user.username,
      compareUsername,
      user.accessToken
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    logger.error('Compare profiles error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to compare profiles',
    });
  }
}


export async function exportToPDF(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found. Please run an analysis first.',
      });
      return;
    }

    const pdfBuffer = await pdfService.generatePDFReport({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      overallScore: analysis.overallScore,
      categoryScores: analysis.categoryScores,
      skills: analysis.skills,
      badges: analysis.badges,
      weaknesses: analysis.weaknesses,
      improvements: analysis.improvements,
      generatedAt: analysis.generatedAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="portfolio-report-${user.username}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('PDF export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export PDF',
      details: error.message || 'Unknown error',
    });
  }
}


export async function getScoreBreakdown(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        overallScore: analysis.overallScore,
        categoryScores: analysis.categoryScores,
        detailedBreakdown: analysis.detailedBreakdown,
      },
    });
  } catch (error: any) {
    logger.error('Score breakdown error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get score breakdown',
    });
  }
}


export async function getSkills(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        skills: analysis.skills,
      },
    });
  } catch (error: any) {
    logger.error('Get skills error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get skills',
    });
  }
}


export async function getBadges(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        badges: analysis.badges,
      },
    });
  } catch (error: any) {
    logger.error('Get badges error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get badges',
    });
  }
}

export async function getImprovements(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const user = req.user!;

  try {
    const analysis = await analysisService.getLatestAnalysis(user._id);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        weaknesses: analysis.weaknesses,
        improvements: analysis.improvements,
      },
    });
  } catch (error: any) {
    logger.error('Get improvements error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get improvements',
    });
  }
}
