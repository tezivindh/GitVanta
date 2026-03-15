import React, { useState } from 'react';
import { GitCompare, ArrowRight, Trophy, AlertCircle } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { analysisApi } from '../../api/analysis';
import { Card, CardHeader, Button, Input, Alert, ScoreCircle, ProgressBar, Loader } from '../../components/ui';
import { ProfileComparison } from '../../types';

const ComparePage: React.FC = () => {
  const { currentReport } = useAnalysisStore();
  const [compareUsername, setCompareUsername] = useState('');
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!compareUsername.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await analysisApi.compareProfiles(compareUsername.trim());
      setComparison(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to compare profiles');
    } finally {
      setLoading(false);
    }
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard first to compare profiles.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Profiles</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          See how your portfolio stacks up against other developers
        </p>
      </div>

      {/* Compare Input */}
      <Card>
        <CardHeader
          title="Compare with another developer"
          icon={<GitCompare className="w-5 h-5 text-primary-600" />}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Enter GitHub username"
              value={compareUsername}
              onChange={(e) => setCompareUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
          </div>
          <Button
            onClick={handleCompare}
            loading={loading}
            leftIcon={<GitCompare className="w-4 h-4" />}
          >
            Compare
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Comparison Failed">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Card className="py-12">
          <div className="flex flex-col items-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing profiles...</p>
          </div>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && !loading && (
        <div className="space-y-6">
          {/* Score Comparison */}
          <Card>
            <CardHeader title="Overall Score Comparison" />
            <div className="flex items-center justify-around py-8">
              <div className="text-center">
                <ScoreCircle
                  score={comparison.yourScore.overall}
                  size="lg"
                  label="Your Score"
                />
                <p className="mt-2 font-medium text-gray-900 dark:text-white">You</p>
              </div>

              <div className="text-4xl text-gray-300 dark:text-gray-600">VS</div>

              <div className="text-center">
                <ScoreCircle
                  score={comparison.theirScore.overall}
                  size="lg"
                  label="Their Score"
                />
                <p className="mt-2 font-medium text-gray-900 dark:text-white">
                  {compareUsername}
                </p>
              </div>
            </div>

            {/* Winner indicator */}
            <div className="text-center pb-4">
              {comparison.yourScore.overall > comparison.theirScore.overall ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  <Trophy className="w-5 h-5" />
                  You're ahead by {comparison.yourScore.overall - comparison.theirScore.overall} points!
                </div>
              ) : comparison.yourScore.overall < comparison.theirScore.overall ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                  <AlertCircle className="w-5 h-5" />
                  They're ahead by {comparison.theirScore.overall - comparison.yourScore.overall} points
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  It's a tie!
                </div>
              )}
            </div>
          </Card>

          {/* Category Comparison */}
          <Card>
            <CardHeader title="Category Breakdown" />
            <div className="space-y-6">
              {comparison.yourScore.categories.map((yourCat, index) => {
                const theirCat = comparison.theirScore.categories[index];
                const diff = yourCat.score - (theirCat?.score || 0);
                return (
                  <div key={yourCat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {yourCat.category.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          diff > 0
                            ? 'text-green-600'
                            : diff < 0
                            ? 'text-red-600'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">You</div>
                        <ProgressBar
                          value={yourCat.score}
                          max={yourCat.maxScore}
                          showValue
                          size="sm"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{compareUsername}</div>
                        <ProgressBar
                          value={theirCat?.score || 0}
                          max={theirCat?.maxScore || 20}
                          showValue
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Insights */}
          {comparison.insights && comparison.insights.length > 0 && (
            <Card>
              <CardHeader title="Comparison Insights" />
              <ul className="space-y-3">
                {comparison.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparePage;
