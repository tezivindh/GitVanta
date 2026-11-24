import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ExternalLink, Star, GitFork, Search, Lock, Sparkles, ChevronDown } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { enhancementApi } from '../../api/enhancement';
import { getApiError } from '../../api/client';
import { needsAISettings, formatRelative } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { AIAttribution, Button, Card, EmptyState, PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { AnalyzedRepository, RepoReview, RepoReviews } from '../../types';

type SortOption = 'rating' | 'stars' | 'name' | 'updated';

const RatingPill: React.FC<{ rating: number }> = ({ rating }) => (
  <span
    className="inline-flex h-7 min-w-[3.25rem] items-center justify-center rounded-full bg-primary-50 px-2 text-sm font-semibold tabular-nums text-primary-800 dark:bg-primary-950 dark:text-primary-200"
    aria-label={`AI rating ${rating} out of 10`}
  >
    {rating}/10
  </span>
);

const RepoRow: React.FC<{ repo: AnalyzedRepository; review?: RepoReview }> = ({ repo, review }) => {
  const [open, setOpen] = useState(false);
  const panelId = `review-${repo.name}`;
  return (
    <li className="py-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {repo.isPrivate ? (
              <span className="font-medium text-gray-900 dark:text-white">{repo.name}</span>
            ) : (
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-gray-900 hover:underline dark:text-white"
              >
                {repo.name}
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                <span className="sr-only">(opens GitHub)</span>
              </a>
            )}
            {repo.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Lock className="h-3 w-3" aria-hidden="true" /> Private
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {review?.summary || repo.description || 'No description'}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {repo.language && <span>{repo.language}</span>}
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" aria-hidden="true" /> {repo.stars}
              <span className="sr-only">stars</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" aria-hidden="true" /> {repo.forks}
              <span className="sr-only">forks</span>
            </span>
            {repo.pushedAt && <span>Updated {formatRelative(repo.pushedAt)}</span>}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {review && <RatingPill rating={review.rating} />}
          {review && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              {open ? 'Hide review' : 'Review'}
              <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {review && open && (
        <div id={panelId} className="mt-3 grid gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2 dark:bg-gray-950/60">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Working well</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-700 dark:text-gray-300">
              {review.strengths.length ? review.strengths.map((s) => <li key={s}>{s}</li>) : <li>Nothing stood out yet.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">To improve</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-700 dark:text-gray-300">
              {review.improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
};

const RepositoriesContent: React.FC<{ repos: AnalyzedRepository[]; initialReviews?: RepoReviews }> = ({ repos, initialReviews }) => {
  const [reviews, setReviews] = useState<RepoReviews | undefined>(initialReviews);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<{ message: string; settings: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(initialReviews ? 'rating' : 'updated');
  const [language, setLanguage] = useState('all');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');

  const reviewByName = useMemo(() => new Map((reviews?.items ?? []).map((r) => [r.name, r])), [reviews]);
  const languages = useMemo(() => Array.from(new Set(repos.map((r) => r.language).filter(Boolean) as string[])).sort(), [repos]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = repos.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)) &&
        (language === 'all' || r.language === language) &&
        (visibility === 'all' || (visibility === 'private') === !!r.isPrivate)
    );
    const time = (r: AnalyzedRepository) => new Date(r.pushedAt || 0).getTime();
    const sorters: Record<SortOption, (a: AnalyzedRepository, b: AnalyzedRepository) => number> = {
      rating: (a, b) => (reviewByName.get(b.name)?.rating ?? -1) - (reviewByName.get(a.name)?.rating ?? -1) || b.stars - a.stars,
      stars: (a, b) => b.stars - a.stars,
      name: (a, b) => a.name.localeCompare(b.name),
      updated: (a, b) => time(b) - time(a),
    };
    return filtered.sort(sorters[sortBy]);
  }, [repos, query, language, visibility, sortBy, reviewByName]);

  const runReview = async () => {
    setReviewing(true);
    setReviewError(null);
    try {
      const result = await enhancementApi.reviewRepositories();
      setReviews(result);
      setSortBy('rating');
      // Keep the cached copy on the report in sync for other pages.
      useAnalysisStore.setState((s) => (s.analysis ? { analysis: { ...s.analysis, aiRepoReviews: result } } : {}));
      toast.success('Repositories reviewed', `${result.items.length} repositories rated.`);
    } catch (e) {
      const info = await getApiError(e, 'The AI review failed. Please try again.');
      setReviewError({ message: info.message, settings: needsAISettings(info) });
    } finally {
      setReviewing(false);
    }
  };

  const average = reviews?.items.length
    ? Math.round((reviews.items.reduce((s, r) => s + r.rating, 0) / reviews.items.length) * 10) / 10
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositories"
        description={`${repos.length} repositories analysed, ${repos.filter((r) => r.isPrivate).length} of them private.`}
        actions={
          <Button onClick={runReview} isLoading={reviewing} leftIcon={<Sparkles className="h-4 w-4" />}>
            {reviews ? 'Review again with AI' : 'Rate all with AI'}
          </Button>
        }
      />

      <Card>
        {reviews ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {reviews.items.length} repositories rated {formatRelative(reviews.generatedAt)}. Average rating{' '}
              <span className="font-semibold tabular-nums">{average}/10</span>.
            </p>
            <AIAttribution ai={reviews.ai} />
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Rate up to 30 of your most recently updated repositories in one AI request: a 1–10 rating, a one-line verdict
            and what to fix. README excerpts, including from private repos, are sent to your AI provider.
          </p>
        )}
        {reviewError && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
            {reviewError.message}{' '}
            {reviewError.settings && (
              <Link to="/dashboard/settings#ai-provider" className="font-medium underline">
                Open AI settings
              </Link>
            )}
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <label htmlFor="repo-search" className="sr-only">
            Search repositories
          </label>
          <input
            id="repo-search"
            type="search"
            className="input h-10 pl-9 pr-3 text-sm"
            placeholder="Search by name or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:ml-auto lg:flex">
          <label className="sr-only" htmlFor="repo-lang">Language</label>
          <select id="repo-lang" className="input h-10 px-2 text-sm" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="all">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="repo-vis">Visibility</label>
          <select id="repo-vis" className="input h-10 px-2 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
            <option value="all">Public and private</option>
            <option value="public">Public only</option>
            <option value="private">Private only</option>
          </select>
          <label className="sr-only" htmlFor="repo-sort">Sort by</label>
          <select id="repo-sort" className="input h-10 px-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            {reviews && <option value="rating">Highest rated</option>}
            <option value="updated">Recently updated</option>
            <option value="stars">Most stars</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <Card padding="none" className="px-4 sm:px-6">
        {list.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">No repositories match these filters.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {list.map((repo) => (
              <RepoRow key={repo.name} repo={repo} review={reviewByName.get(repo.name)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

const RepositoriesPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Repositories" />}>
    {(a) =>
      a.repositories.length === 0 ? (
        <EmptyState title="No repositories found" description="GitVanta didn't find any repositories you own. Create one on GitHub, then analyse again." />
      ) : (
        <RepositoriesContent repos={a.repositories} initialReviews={a.aiRepoReviews} />
      )
    }
  </AnalysisGate>
);

export default RepositoriesPage;
