import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Lock, Star } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, Button, PageHeader } from '../../components/ui';
import ScoreFormula from '../../components/brand/ScoreFormula';
import { ScoreHistoryChart } from '../../components/charts';
import AnalysisGate, { runAnalysisWithFeedback } from '../../components/AnalysisGate';
import QuickWinsCard from '../../components/QuickWinsCard';
import { CATEGORIES, CategoryKey } from '../../lib/scoring';

const SHORT_LABELS: Partial<Record<CategoryKey, string>> = { professionalism: 'Profile' };
import { formatRelative } from '../../lib/errors';

const ChangeChip: React.FC<{ change: number | null }> = ({ change }) => {
  if (change === null) return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Your first analysis</p>;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  return (
    <p
      className={
        change > 0
          ? 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-gain-50 px-2.5 py-1 text-sm font-medium text-gain-700 dark:bg-gain-700/20 dark:text-gain-300'
          : 'mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {change === 0 ? 'No change' : change > 0 ? `+${change}` : change} since last analysis
    </p>
  );
};

const DashboardOverview: React.FC = () => {
  const { isAnalyzing, history, fetchHistory } = useAnalysisStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const reanalyse = (
    <Button variant="outline" onClick={runAnalysisWithFeedback} isLoading={isAnalyzing} leftIcon={<RefreshCw className="h-4 w-4" />}>
      {isAnalyzing ? 'Analysing…' : 'Analyse again'}
    </Button>
  );

  return (
    <AnalysisGate header={<PageHeader title="Overview" />}>
      {(a) => {
        const points = history?.points ?? [];
        const repos = a.repositories ?? [];
        const privateCount = repos.filter((r) => r.isPrivate).length;
        const topRepos = [...repos].sort((x, y) => (y.stars || 0) - (x.stars || 0)).slice(0, 4);

        return (
          <div className="space-y-6">
            <PageHeader
              title="Overview"
              description={
                <>
                  Last analysed {formatRelative(a.generatedAt)}. You can run 3 analyses a day.
                </>
              }
              actions={reanalyse}
            />

            <section aria-labelledby="score-heading" className="card p-6 sm:p-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                <div className="shrink-0">
                  <h2 id="score-heading" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Overall score
                  </h2>
                  <p className="font-display mt-1 text-[5rem] leading-[0.85] text-gray-950 dark:text-white">
                    {a.overallScore}
                    <span className="text-2xl text-gray-500 dark:text-gray-400">/100</span>
                  </p>
                  <ChangeChip change={history?.change ?? null} />
                </div>
                <div className="min-w-0 flex-1">
                  <ScoreFormula
                    parts={CATEGORIES.map((c) => ({
                      label: c.label,
                      short: SHORT_LABELS[c.key],
                      weight: c.weight,
                      score: a.categoryScores[c.key],
                    }))}
                  />
                  <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
                    Each segment is as wide as the category’s weight and filled to your score in it.{' '}
                    <Link to="/dashboard/analytics" className="font-medium text-primary-700 underline-offset-4 hover:underline dark:text-primary-400">
                      See every metric
                    </Link>
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-gray-200 pt-5 dark:border-gray-800">
                <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ['Repositories', repos.length],
                  ['Skills', a.skills.length],
                  ['Badges', a.badges.length],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline gap-2">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">{label}</dt>
                    <dd className="font-display order-first text-2xl text-gray-950 dark:text-white">{value}</dd>
                  </div>
                ))}
                </dl>
                {privateCount > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    {privateCount} private {privateCount === 1 ? 'repo is' : 'repos are'} counted but hidden from your public profile
                  </p>
                )}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-5">
              <QuickWinsCard quickWins={a.quickWins} className="lg:col-span-3" />

              <Card className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Score history</h2>
                {points.length >= 2 ? (
                  <>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {points.length} analyses since {new Date(points[0].generatedAt).toLocaleDateString()}.
                    </p>
                    <div className="mt-4">
                      <ScoreHistoryChart points={points} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Your trend appears here after your next analysis. Make one of the suggested fixes, then analyse again to
                    see the change.
                  </p>
                )}
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top skills</h2>
                  <Link to="/dashboard/skills" className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
                    All skills
                  </Link>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {a.skills.slice(0, 12).map((s) => (
                    <li
                      key={s.name}
                      className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200"
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Most starred</h2>
                  <Link to="/dashboard/repositories" className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
                    All repositories
                  </Link>
                </div>
                <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
                  {topRepos.map((r) => (
                    <li key={r.name} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-gray-900 dark:text-white">
                          {r.name}
                          {r.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Private" />}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{r.language ?? 'No language detected'}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                        <Star className="h-4 w-4" aria-hidden="true" /> {r.stars}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        );
      }}
    </AnalysisGate>
  );
};

export default DashboardOverview;
