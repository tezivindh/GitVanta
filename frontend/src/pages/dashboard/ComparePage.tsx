import React, { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { getApiError } from '../../api/client';
import { Button, Card, ErrorState, LoadingRegion, PageHeader, Skeleton } from '../../components/ui';
import { CategoryRadarChart } from '../../components/charts';
import AnalysisGate from '../../components/AnalysisGate';
import { ProfileComparison } from '../../types';
import { CATEGORIES, toCategoryArray } from '../../lib/scoring';

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const HEAD = 'max-w-none text-lg font-medium tracking-[-0.01em] text-ink';

/** Series keys, matched to the radar: you are a solid amber line, they are a dashed cool one. */
const Swatch: React.FC<{ who: 'you' | 'them' }> = ({ who }) => (
  <span
    aria-hidden="true"
    className={
      who === 'you'
        ? 'mr-1.5 inline-block w-4 border-t-2 border-accent align-middle'
        : 'mr-1.5 inline-block w-4 border-t-2 border-dashed border-cool align-middle'
    }
  />
);

const Signed: React.FC<{ d: number }> = ({ d }) => (
  <span className={d > 0 ? 'text-ok' : d < 0 ? 'text-bad' : 'text-muted'}>{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : d}</span>
);

const Results: React.FC<{ c: ProfileComparison }> = ({ c }) => {
  const you = c.user1;
  const them = c.user2;
  const diff = you.overallScore - them.overallScore;

  return (
    <div className="space-y-6">
      <div className="panels sm:grid-cols-2">
        {[you, them].map((p, i) => (
          <section key={p.username} className="p-6" aria-label={i === 0 ? `You (@${you.username})` : `@${them.username}`}>
            <p className="text-sm text-muted">
              <Swatch who={i === 0 ? 'you' : 'them'} />
              {i === 0 ? `You (@${you.username})` : `@${them.username}`}
            </p>
            <p className="measured mt-2 text-[3.5rem] leading-none tracking-[-0.04em] text-ink">
              {p.overallScore}
              <span className="ml-1 text-xl tracking-normal text-muted">/100</span>
            </p>
            <h2 className="mt-6 max-w-none text-sm font-medium tracking-normal text-ink">
              {i === 0 ? 'Your top skills' : `@${p.username}’s top skills`}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-2">
              {p.topSkills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              <span className="measured text-ink-2">{p.badges}</span> badges earned
            </p>
          </section>
        ))}
        <div className="px-6 py-4 sm:col-span-2">
          <p className="text-sm font-medium text-ink">
            {diff === 0 ? (
              'Level'
            ) : diff > 0 ? (
              <>
                You lead by <span className="measured rounded-chip bg-ok-soft px-1.5 text-ok">{diff}</span>
              </>
            ) : (
              <>
                @{them.username} leads by <span className="measured rounded-chip bg-bad-soft px-1.5 text-bad">{-diff}</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Both profiles are scored by the same engine. Theirs uses public repositories only; yours includes private ones.
          </p>
        </div>
      </div>

      <div className="panels lg:grid-cols-5">
        <section className="p-6 lg:col-span-3" aria-labelledby="by-category-heading">
          <h2 id="by-category-heading" className={HEAD}>By category</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <caption className="sr-only">Category scores for you and @{them.username}</caption>
              <thead className="text-muted">
                <tr className="border-b border-rule-2">
                  <th scope="col" className="py-2 font-medium whitespace-nowrap">Category</th>
                  <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">
                    <Swatch who="you" />You
                  </th>
                  <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">
                    <Swatch who="them" />@{them.username}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">Difference</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                {CATEGORIES.map((cat) => {
                  const a = you.categoryScores[cat.key];
                  const b = them.categoryScores[cat.key];
                  const d = a - b;
                  return (
                    <tr key={cat.key} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="py-2 font-normal text-ink">{cat.label}</th>
                      <td className="measured py-2 text-right">{a}</td>
                      <td className="measured py-2 text-right">{b}</td>
                      <td className="measured py-2 text-right">
                        <Signed d={d} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="p-6 lg:col-span-2" aria-labelledby="shape-heading">
          <h2 id="shape-heading" className={HEAD}>Shape</h2>
          <CategoryRadarChart
            categoryScores={toCategoryArray(you.categoryScores)}
            compareScores={toCategoryArray(them.categoryScores)}
            seriesNames={['You', `@${them.username}`]}
            height={300}
          />
        </section>
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
      setFieldError('Enter a valid GitHub username, for example “octocat”.');
      return;
    }
    setFieldError(null);
    setLoading(true);
    setError(null);
    try {
      setComparison(await analysisApi.compareProfiles(name));
    } catch (err) {
      setError((await getApiError(err, 'The comparison didn’t finish. Check the username and try again.')).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalysisGate header={<PageHeader title="Compare" />}>
      {() => (
        <div className="space-y-8">
          <PageHeader title="Compare" description="Score any public GitHub account with the same engine and see where you differ." />

          <Card>
            <form onSubmit={compare} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="compare-username" className="block text-sm font-medium text-ink">
                  GitHub username
                </label>
                <input
                  id="compare-username"
                  className="input mt-1.5 h-9 px-3 text-sm"
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
              <p id="compare-error" role="alert" className="mt-2 min-h-[1lh] text-sm text-bad">
                {fieldError}
              </p>
            ) : (
              <p id="compare-hint" className="mt-2 min-h-[1lh] text-sm text-muted">
                Scoring another account takes up to a minute. You can run 15 comparisons an hour.
              </p>
            )}
          </Card>

          {loading && (
            <LoadingRegion label="Scoring profile" className="space-y-4">
              <div className="grid gap-px sm:grid-cols-2">
                <Skeleton className="h-56 rounded-none sm:rounded-l-[10px]" />
                <Skeleton className="h-56 rounded-none sm:rounded-r-[10px]" />
              </div>
              <div className="grid gap-4 lg:grid-cols-5">
                <Skeleton className="h-72 lg:col-span-3" />
                <Skeleton className="h-72 lg:col-span-2" />
              </div>
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
