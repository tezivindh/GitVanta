import { CategoryScore, CategoryScores } from '../types';

export type CategoryKey = keyof CategoryScores;

/** Must match CATEGORY_WEIGHTS in backend/src/utils/scoringEngine.ts. */
export const CATEGORIES: Array<{ key: CategoryKey; label: string; weight: number; measures: string }> = [
  { key: 'codeQuality', label: 'Code quality', weight: 0.25, measures: 'Portfolio size, language range, tests, and how descriptive your commit messages are.' },
  { key: 'documentation', label: 'Documentation', weight: 0.2, measures: 'README coverage and depth, licenses and contributing guides.' },
  { key: 'activity', label: 'Activity', weight: 0.2, measures: 'Recent pushes, consistency, and how many repos are still maintained.' },
  { key: 'diversity', label: 'Diversity', weight: 0.15, measures: 'Languages, topics and the kinds of projects you build.' },
  { key: 'community', label: 'Community', weight: 0.1, measures: 'Stars, forks and followers.' },
  { key: 'professionalism', label: 'Professionalism', weight: 0.1, measures: 'Bio, website, profile README and linked social accounts.' },
];

export const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;

export function toCategoryArray(scores: CategoryScores): CategoryScore[] {
  return CATEGORIES.map((c) => ({ category: c.label, score: scores[c.key] ?? 0, maxScore: 100 }));
}

/** Points a category contributes to the overall score. */
export const contribution = (score: number, weight: number) => Math.round(score * weight * 10) / 10;
