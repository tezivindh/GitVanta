// =====================================================
// DASHBOARD OVERVIEW PAGE - Main dashboard view
// =====================================================

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, TrendingUp, ArrowRight } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAuthStore } from '../../store/authStore';
import { Card, CardHeader, Button, ScoreCircle, ProgressBar, Alert } from '../../components/ui';
import { CategoryRadarChart } from '../../components/charts';
import { Loader } from '../../components/ui';

const DashboardOverview: React.FC = () => {
  const { user } = useAuthStore();
  const {
    currentReport,
    isAnalyzing,
    error,
    fetchLatestReport,
    runAnalysis,
  } = useAnalysisStore();

  useEffect(() => {
    fetchLatestReport();
  }, [fetchLatestReport]);

  const handleRunAnalysis = async () => {
    if (user?.username) {
      await runAnalysis(user.username);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Analyzing your portfolio...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a few minutes depending on the number of repositories.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert variant="error" title="Analysis Error">
          {error}
        </Alert>
        <div className="mt-4">
          <Button onClick={handleRunAnalysis} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="py-20 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Portfolio Analyzer
          </h2>
          <p className="text-gray-600 mb-8">
            Run your first analysis to get a comprehensive score and insights
            about your GitHub portfolio.
          </p>
          <Button
            size="lg"
            onClick={handleRunAnalysis}
            loading={isAnalyzing}
            leftIcon={<TrendingUp className="w-5 h-5" />}
          >
            Analyze My Portfolio
          </Button>
        </div>
      </div>
    );
  }

  const { result } = currentReport;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Last analyzed:{' '}
            {new Date(currentReport.createdAt).toLocaleDateString('en-US', {
              dateStyle: 'medium',
            })}
          </p>
        </div>
        <Button
          onClick={handleRunAnalysis}
          variant="outline"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Re-analyze
        </Button>
      </div>

      {/* Main Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Score */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-center py-8">
          <ScoreCircle
            score={result.score.overall}
            size="xl"
            label="Overall Score"
          />
          <div className="mt-6 w-full px-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.repositories.length}
                </div>
                <div className="text-sm text-gray-500">Repositories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.skills.length}
                </div>
                <div className="text-sm text-gray-500">Skills</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Category Scores Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Score Breakdown" />
          <div className="grid md:grid-cols-2 gap-6">
            <CategoryRadarChart
              categoryScores={result.score.categories}
              height={250}
            />
            <div className="space-y-4">
              {result.score.categories.map((category) => (
                <ProgressBar
                  key={category.category}
                  value={category.score}
                  max={category.maxScore}
                  label={category.category.replace(/([A-Z])/g, ' $1').trim()}
                  showValue
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Weaknesses Alert */}
      {result.weaknesses && result.weaknesses.length > 0 && (
        <Alert variant="warning" title="Areas for Improvement">
          <ul className="list-disc list-inside mt-2 space-y-1">
            {result.weaknesses.slice(0, 3).map((weakness, index) => (
              <li key={index}>{weakness}</li>
            ))}
          </ul>
          <Link
            to="/dashboard/enhancements"
            className="inline-flex items-center gap-1 mt-3 text-yellow-800 hover:text-yellow-900 font-medium"
          >
            View all suggestions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Alert>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Stars</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.repositories.reduce((sum, r) => sum + (r.stars || 0), 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Forks</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.repositories.reduce((sum, r) => sum + (r.forks || 0), 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Languages</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(result.repositories.map((r) => r.language).filter(Boolean)).size}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Badges Earned</div>
          <div className="text-2xl font-bold text-gray-900">
            {result.badges?.length || 0}
          </div>
        </Card>
      </div>

      {/* Top Skills & Top Repos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <CardHeader
            title="Top Skills"
            action={
              <Link
                to="/dashboard/skills"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            }
          />
          <div className="flex flex-wrap gap-2">
            {result.skills.slice(0, 8).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* Top Repositories */}
        <Card>
          <CardHeader
            title="Top Repositories"
            action={
              <Link
                to="/dashboard/repositories"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            }
          />
          <div className="space-y-3">
            {result.repositories
              .sort((a, b) => (b.stars || 0) - (a.stars || 0))
              .slice(0, 3)
              .map((repo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{repo.name}</div>
                    <div className="text-sm text-gray-500">{repo.language}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {repo.stars} stars
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
