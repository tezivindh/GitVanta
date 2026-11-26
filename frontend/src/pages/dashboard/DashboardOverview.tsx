import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Lock, Star } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, Button, PageHeader } from '../../components/ui';
import { ScoreHistoryChart } from '../../components/charts';
import AnalysisGate, { runAnalysisWithFeedback } from '../../components/AnalysisGate';
import LatticeLoader from '../../components/LatticeLoader';
import QuickWinsCard from '../../components/QuickWinsCard';
import { CATEGORIES, CategoryKey } from '../../lib/scoring';

const SHORT_LABELS: Partial<Record<CategoryKey, string>> = { professionalism: 'Profile' };
import { formatRelative } from '../../lib/errors';

const HEAD = 'max-w-none text-lg font-medium tracking-[-0.01em] text-ink';

/** What changed since the last analysis, set as a diff: the struck previous value and the signed change. */
const ScoreDiff: React.FC<{ score: number; change: number | null }> = ({ score, change }) => {
  if (change === null) return <p className="mt-4 text-sm text-muted">Your first analysis</p>;
  if (change === 0) return <p className="mt-4 text-sm text-muted">No change since last analysis</p>;
  const up = change > 0;
  return (
    <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted">
      <del className="measured text-lg text-muted decoration-1">
        <span className="sr-only">Previously </span>
        {score - change}
      </del>
      <span
        className={
          up
            ? 'measured rounded-chip bg-ok-soft px-1.5 text-lg text-ok'
            : 'measured rounded-chip bg-bad-soft px-1.5 text-lg text-bad'
        }
      >
        {up ? `+${change}` : `−${-change}`}
      </span>
      <span>since last analysis</span>
    </p>
  );
};

const DashboardOverview: React.FC = () => {
  const { isAnalyzing, history, fetchHistory } = useAnalysisStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // While a re-analysis runs, the button gives way to the lattice loader and its timer;
  // the current score stays on screen underneath.
  const reanalyse = isAnalyzing ? (
    <span className="inline-flex h-9 items-center rounded-pill border border-rule-2 bg-paper-2 px-3.5">
      <LatticeLoader label="Analysing" pattern="snake" fontSize={14} className="text-ink" />
    </span>
  ) : (
    <Button variant="outline" className="disabled:cursor-not-allowed" onClick={runAnalysisWithFeedback} leftIcon={<RefreshCw className="h-4 w-4" />}>
      Analyse again
    </Button>
  );

  return (
    <AnalysisGate header={<PageHeader title="Overview" />}>
      {(a) => {
        const points = history?.points ?? [];
        const repos = a.repositories ?? [];
        const privateCount = repos.filter((r) => r.isPrivate).length;
        const topRepos = [...repos].sort((x, y) => (y.stars || 0) - (x.stars || 0)).slice(0, 4);
        const weightCols = CATEGORIES.map((c) => `${c.weight}fr`).join(' ');

        return (
          <div className="space-y-8">
            <PageHeader
              title="Overview"
              description={
                <>
                  Last analysed {formatRelative(a.generatedAt)}. You can run 3 analyses a day.
                </>
              }
              actions={reanalyse}
            />

            <section aria-labelledby="score-heading" className="space-y-6">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <h2 id="score-heading" className="max-w-none text-sm font-medium tracking-normal text-muted">
                    Overall score
                  </h2>
                  <p className="reading mt-3 text-[clamp(4.5rem,8vw+1rem,7.5rem)]">
                    {a.overallScore}
                    <span className="measured ml-1 text-2xl tracking-normal text-muted">/100</span>
                  </p>
                  <ScoreDiff score={a.overallScore} change={history?.change ?? null} />
                </div>

                <dl className="grid grid-cols-3 gap-x-10 gap-y-1 lg:pb-1">
                  {[
                    ['Repositories', repos.length],
                    ['Skills', a.skills.length],
                    ['Badges', a.badges.length],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex flex-col">
                      <dt className="text-sm text-muted">{label}</dt>
                      <dd className="measured order-first text-3xl text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <ul
                  className="panels grid-cols-2 sm:grid-cols-3 md:grid-cols-(--weights)"
                  style={{ '--weights': weightCols } as React.CSSProperties}
                  aria-label="Score by category"
                >
                  {CATEGORIES.map((c) => {
                    const score = a.categoryScores[c.key];
                    const short = SHORT_LABELS[c.key];
                    return (
                      <li key={c.key} className="min-w-0 p-4">
                        <p className="measured text-2xl text-ink">{Math.round(score)}</p>
                        <p className="mt-1 truncate text-sm text-ink-2" title={c.label}>
                          {short && c.weight <= 0.1 ? (
                            <>
                              <span aria-hidden="true" className="hidden md:inline">{short}</span>
                              <span className="md:sr-only">{c.label}</span>
                            </>
                          ) : (
                            c.label
                          )}
                        </p>
                        <p className="text-sm text-muted">
                          <span className="sr-only">counts </span>
                          <span className="measured">{Math.round(c.weight * 100)}%</span>
                        </p>
                        <div className="mt-3 h-1 overflow-hidden rounded-[2px] bg-paper-3" aria-hidden="true">
                          <div
                            className="h-full origin-left ramp-cool"
                            style={{ transform: `scaleX(${Math.max(0, Math.min(100, score)) / 100})` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <p className="text-sm text-muted">
                    Each segment is as wide as the category’s weight and filled to your score in it.{' '}
                    <Link to="/dashboard/analytics" className="text-sm text-ink-2 underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent focus-visible:text-accent active:text-accent">
                      See every metric
                    </Link>
                  </p>
                  {privateCount > 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      {privateCount} private {privateCount === 1 ? 'repo is' : 'repos are'} counted but hidden from your public profile
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-5">
              <QuickWinsCard quickWins={a.quickWins} className="lg:col-span-3" />

              <Card className="lg:col-span-2">
                <h2 className={HEAD}>Score history</h2>
                {points.length >= 2 ? (
                  <>
                    <p className="mt-1 text-sm text-muted">
                      {points.length} analyses since {new Date(points[0].generatedAt).toLocaleDateString()}.
                    </p>
                    <div className="mt-4">
                      <ScoreHistoryChart points={points} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    Your trend appears here after your next analysis. Make one of the suggested fixes, then analyse again to
                    see the change.
                  </p>
                )}
              </Card>
            </div>

            <div className="panels lg:grid-cols-2">
              <section className="p-6" aria-labelledby="skills-heading">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="skills-heading" className={HEAD}>Top skills</h2>
                  <Link to="/dashboard/skills" className="text-sm text-ink-2 underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent focus-visible:text-accent active:text-accent">
                    All skills
                  </Link>
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-ink-2">
                  {a.skills.slice(0, 12).map((s) => (
                    <li key={s.name} className="text-sm">
                      {s.name}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="p-6" aria-labelledby="stars-heading">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="stars-heading" className={HEAD}>Most starred</h2>
                  <Link to="/dashboard/repositories" className="text-sm text-ink-2 underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent focus-visible:text-accent active:text-accent">
                    All repositories
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-rule">
                  {topRepos.map((r) => (
                    <li key={r.name} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate">
                          <span className="measured truncate text-sm text-ink">{r.name}</span>
                          {r.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Private" />}
                        </p>
                        <p className="text-sm text-muted">{r.language ?? 'No language detected'}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-2">
                        <Star className="h-3.5 w-3.5 text-muted" aria-hidden="true" /> <span className="measured">{r.stars}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        );
      }}
    </AnalysisGate>
  );
};

export default DashboardOverview;
