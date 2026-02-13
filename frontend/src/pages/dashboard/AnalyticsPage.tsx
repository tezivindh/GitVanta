// =====================================================
// ANALYTICS PAGE - Detailed score analysis
// =====================================================

import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, CardHeader, Alert, ScoreCircle, ProgressBar } from '../../components/ui';
import { CategoryRadarChart, ScoreBreakdownChart } from '../../components/charts';

const AnalyticsPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to see detailed analytics.
      </Alert>
    );
  }

  const { result } = currentReport;
  const { score, repositories } = result;

  // Calculate additional stats
  const totalStars = repositories.reduce((sum, r) => sum + (r.stars || 0), 0);
  const totalForks = repositories.reduce((sum, r) => sum + (r.forks || 0), 0);
  const avgRepoScore =
    repositories.filter((r) => r.score !== undefined).length > 0
      ? repositories.reduce((sum, r) => sum + (r.score || 0), 0) /
        repositories.filter((r) => r.score !== undefined).length
      : 0;

  // Find best and worst categories
  const sortedCategories = [...score.categories].sort(
    (a, b) => (b.score / b.maxScore) - (a.score / a.maxScore)
  );
  const bestCategory = sortedCategories[0];
  const worstCategory = sortedCategories[sortedCategories.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Detailed breakdown of your portfolio score
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <ScoreCircle score={score.overall} size="xl" label="Overall Score" />
        </Card>

        <Card className="md:col-span-2">
          <CardHeader
            title="Score Categories"
            icon={<BarChart3 className="w-5 h-5 text-primary-600" />}
          />
          <CategoryRadarChart categoryScores={score.categories} height={250} />
        </Card>
      </div>

      {/* Best & Worst Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Strongest Category"
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          />
          <div className="flex items-center gap-4">
            <ScoreCircle
              score={bestCategory.score}
              maxScore={bestCategory.maxScore}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {bestCategory.category.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bestCategory.score}/{bestCategory.maxScore} points
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Great job! This is your strongest area. Consider mentoring others
            or contributing to projects that highlight this strength.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Area for Improvement"
            icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
          />
          <div className="flex items-center gap-4">
            <ScoreCircle
              score={worstCategory.score}
              maxScore={worstCategory.maxScore}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {worstCategory.category.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {worstCategory.score}/{worstCategory.maxScore} points
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            This is your biggest opportunity for growth. Focus on improving
            this area to see a significant boost in your overall score.
          </p>
        </Card>
      </div>

      {/* Detailed Score Breakdown */}
      <Card>
        <CardHeader
          title="Category Breakdown"
          icon={<Target className="w-5 h-5 text-primary-600" />}
        />
        <ScoreBreakdownChart categoryScores={score.categories} height={300} />
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader
          title="Score Explanation"
          icon={<Info className="w-5 h-5 text-primary-600" />}
        />
        <div className="space-y-6">
          {score.categories.map((category) => (
            <div key={category.category} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {category.category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {category.score}/{category.maxScore}
                </span>
              </div>
              <ProgressBar value={category.score} max={category.maxScore} />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {getCategoryDescription(category.category)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Portfolio Stats */}
      <Card>
        <CardHeader title="Portfolio Statistics" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{repositories.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Repositories</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalStars}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Stars</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalForks}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Forks</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(avgRepoScore)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Repo Score</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper function for category descriptions
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    codeQuality:
      'Measures code organization, testing presence, and adherence to best practices.',
    documentation:
      'Evaluates README quality, code comments, and project documentation.',
    activity:
      'Assesses commit frequency, recent updates, and project maintenance.',
    diversity:
      'Considers variety of languages, frameworks, and project types.',
    community:
      'Measures stars, forks, and community engagement with your projects.',
    professionalism:
      'Evaluates profile completeness and presentation quality.',
  };
  return descriptions[category] || 'Score for this category based on multiple factors.';
}

export default AnalyticsPage;
