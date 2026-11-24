import { Response } from 'express';
import { analysisService, pdfService } from '../services';
import { AuthenticatedRequest } from '../types';
import { NotFoundError } from '../utils/errors';

async function requireLatest(req: AuthenticatedRequest) {
  const analysis = await analysisService.getLatestAnalysis(req.user!._id);
  if (!analysis) {
    throw new NotFoundError('No analysis found. Run an analysis first.');
  }
  return analysis;
}

export async function analyzePortfolio(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const data = await analysisService.analyzePortfolio(user._id, user.username, user.accessToken);
  res.json({ success: true, data });
}

export async function getLatestAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ success: true, data: await requireLatest(req) });
}

export async function getRepoInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await analysisService.getRepoInsights(req.user!._id);
  res.json({ success: true, data });
}

export async function getProfessionalProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const refreshSummary = req.query.refresh === 'true';
  const data = await analysisService.generateProfessionalProfile(user._id, user.username, user.accessToken, {
    refreshSummary,
  });
  res.json({ success: true, data });
}

export async function compareProfiles(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { username } = req.params;
  const data = await analysisService.compareProfiles(user._id, user.username, username, user.accessToken);
  res.json({ success: true, data });
}

export async function exportToPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const analysis = await requireLatest(req);

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
  res.setHeader('Content-Disposition', `attachment; filename="gitvanta-report-${user.username}.pdf"`);
  res.send(pdfBuffer);
}

export async function getScoreBreakdown(req: AuthenticatedRequest, res: Response): Promise<void> {
  const analysis = await requireLatest(req);
  res.json({
    success: true,
    data: {
      overallScore: analysis.overallScore,
      categoryScores: analysis.categoryScores,
      detailedBreakdown: analysis.detailedBreakdown,
    },
  });
}

export async function getSkills(req: AuthenticatedRequest, res: Response): Promise<void> {
  const analysis = await requireLatest(req);
  res.json({ success: true, data: { skills: analysis.skills } });
}

export async function getBadges(req: AuthenticatedRequest, res: Response): Promise<void> {
  const analysis = await requireLatest(req);
  res.json({ success: true, data: { badges: analysis.badges } });
}

export async function getImprovements(req: AuthenticatedRequest, res: Response): Promise<void> {
  const analysis = await requireLatest(req);
  res.json({
    success: true,
    data: { weaknesses: analysis.weaknesses, improvements: analysis.improvements },
  });
}

export async function getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { limit } = req.query as unknown as { limit: number };
  const points = await analysisService.getAnalysisHistory(req.user!._id, limit);
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  res.json({
    success: true,
    data: { points, change: last && prev ? last.overallScore - prev.overallScore : null },
  });
}
