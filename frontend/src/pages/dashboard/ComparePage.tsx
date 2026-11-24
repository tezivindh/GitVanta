import React, { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { getApiError } from '../../api/client';
import { Button, Card, ErrorState, LoadingRegion, PageHeader, ScoreCircle, Skeleton } from '../../components/ui';
import { CategoryRadarChart } from '../../components/charts';
import AnalysisGate from '../../components/AnalysisGate';
import { ProfileComparison } from '../../types';
import { CATEGORIES, toCategoryArray } from '../../lib/scoring';
import { useChartTheme } from '../../lib/chartTheme';

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const Swatch: React.FC<{ color: string; dashed?: boolean }> = ({ color, dashed }) => (
  <span
    aria-hidden="true"
    className="inline-block h-0.5 w-4 align-middle"
    style={dashed ? { borderTop: `2px dashed ${color}` } : { backgroundColor: color, height: 2 }}
  />
);

const Results: React.FC<{ c: ProfileComparison }> = ({ c }) => {
  const t = useChartTheme();
  const you = c.user1;
  const them = c.user2;
  const diff = you.overallScore - them.overallScore;

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
          <div className="text-center">
            <ScoreCircle score={you.overallScore} size="lg" label={`You (@${you.username})`} />
          </div>
          <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {diff === 0 ? 'Level' : diff > 0 ? `You lead by ${diff}` : `@${them.username} leads by ${-diff}`}
          </p>
          <div className="text-center">
            <ScoreCircle score={them.overallScore} size="lg" label={`@${them.username}`} />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Both profiles are scored by the same engine. Theirs uses public repositories only; yours includes private ones.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shape</h2>
          <CategoryRadarChart
            categoryScores={toCategoryArray(you.categoryScores)}
            compareScores={toCategoryArray(them.categoryScores)}
            seriesNames={['You', `@${them.username}`]}
            height={300}
          />
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">By category</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <caption className="sr-only">Category scores for you and @{them.username}</caption>
              <thead className="text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th scope="col" className="py-2 font-medium">Category</th>
                  <th scope="col" className="py-2 text-right font-medium">
                    <Swatch color={t.you} /> You
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    <Swatch color={t.them} dashed /> @{them.username}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">Difference</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-gray-800 dark:text-gray-200">
                {CATEGORIES.map((cat) => {
                  const a = you.categoryScores[cat.key];
                  const b = them.categoryScores[cat.key];
                  const d = a - b;
                  return (
                    <tr key={cat.key} className="border-b border-gray-100 dark:border-gray-800/60">
                      <th scope="row" className="py-2 font-normal">{cat.label}</th>
                      <td className="py-2 text-right">{a}</td>
                      <td className="py-2 text-right">{b}</td>
                      <td className="py-2 text-right">{d > 0 ? `+${d}` : d}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[you, them].map((p, i) => (
          <Card key={p.username}>
            <h2 className="font-semibold text-gray-900 dark:text-white">{i === 0 ? 'Your top skills' : `@${p.username}'s top skills`}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.topSkills.map((s) => (
                <li key={s} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{p.badges} badges earned</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ComparePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const compare = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = username.trim().replace(/^@/, '');
    if (!USERNAME_RE.test(name)) {
      setFieldError('Enter a valid GitHub username, for example "octocat".');
      return;
    }
    setFieldError(null);
    setLoading(true);
    setError(null);
    try {
      setComparison(await analysisApi.compareProfiles(name));
    } catch (err) {
      setError((await getApiError(err, 'The comparison failed.')).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalysisGate header={<PageHeader title="Compare" />}>
      {() => (
        <div className="space-y-6">
          <PageHeader title="Compare" description="Score any public GitHub account with the same engine and see where you differ." />

          <Card>
            <form onSubmit={compare} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="compare-username" className="block text-sm font-medium text-gray-900 dark:text-white">
                  GitHub username
                </label>
                <input
                  id="compare-username"
                  className="input mt-1.5 h-10 px-3 text-sm"
                  placeholder="octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? 'compare-error' : 'compare-hint'}
                />
              </div>
              <Button type="submit" isLoading={loading} leftIcon={<GitCompare className="h-4 w-4" />}>
                Compare
              </Button>
            </form>
            {fieldError ? (
              <p id="compare-error" role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
                {fieldError}
              </p>
            ) : (
              <p id="compare-hint" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Scoring another account takes up to a minute. You can run 15 comparisons an hour.
              </p>
            )}
          </Card>

          {loading && (
            <LoadingRegion label="Scoring profile" className="space-y-4">
              <Skeleton className="h-44" />
              <Skeleton className="h-72" />
            </LoadingRegion>
          )}
          {error && !loading && <ErrorState title="Comparison failed" message={error} onRetry={() => compare()} />}
          {comparison && !loading && !error && <Results c={comparison} />}
        </div>
      )}
    </AnalysisGate>
  );
};

export default ComparePage;
