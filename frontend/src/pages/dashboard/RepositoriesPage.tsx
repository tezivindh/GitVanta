import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ExternalLink, Star, GitFork, Search, Lock, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { enhancementApi } from '../../api/enhancement';
import { getApiError } from '../../api/client';
import { needsAISettings, formatRelative } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { AIAttribution, Button, EmptyState, PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { AnalyzedRepository, RepoReview, RepoReviews } from '../../types';

type SortOption = 'rating' | 'stars' | 'name' | 'updated';

/** Column head: label face, a step smaller, sentence case, muted. */
const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th scope="col" className={clsx('px-3 py-2.5 text-left text-xs font-medium text-muted', className)}>
    {children}
  </th>
);

/** On phones each cell restacks as a labelled line; from md up it is a table cell. */
const Cell: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <td
    className={clsx(
      'max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-4 max-md:py-1 md:px-3 md:py-3 md:align-top',
      className
    )}
  >
    <span className="text-xs text-muted md:hidden">{label}</span>
    {children}
  </td>
);

const RatingValue: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="measured text-sm text-ink" aria-label={`AI rating ${rating} out of 10`}>
    {rating}
    <span className="text-muted">/10</span>
  </span>
);

const RepoRow: React.FC<{
  repo: AnalyzedRepository;
  review?: RepoReview;
  onRate: (name: string) => void;
  rating: boolean;
  rateDisabled: boolean;
  justRated: boolean;
}> = ({ repo, review, onRate, rating, rateDisabled, justRated }) => {
  const [open, setOpen] = useState(false);
  // Show the new review as soon as this repository's rating arrives.
  useEffect(() => {
    if (justRated) setOpen(true);
  }, [justRated]);
  const panelId = `review-${repo.name}`;
  return (
    <>
      <tr className={clsx('border-t border-rule first:border-t-0 max-md:block max-md:px-4 max-md:py-3', open && 'bg-paper-3')}>
        <td className="max-md:block max-md:pb-1 md:py-3 md:pl-4 md:pr-3 md:align-top">
          <div className="flex flex-wrap items-center gap-2">
            {repo.isPrivate ? (
              <span className="measured text-sm text-ink">{repo.name}</span>
            ) : (
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="measured inline-flex items-center gap-1 text-sm text-ink underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent hover:decoration-accent"
              >
                {repo.name}
                <ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="sr-only">(opens GitHub)</span>
              </a>
            )}
            {repo.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-chip border border-rule bg-cool-soft px-1.5 py-px text-xs text-ink">
                <Lock className="h-3 w-3" aria-hidden="true" /> Private
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 max-w-[60ch] text-sm text-muted">{review?.summary || repo.description || 'No description'}</p>
        </td>
        <Cell label="Language" className="text-sm text-ink-2">
          {repo.language ? <span>{repo.language}</span> : <span className="text-muted">None</span>}
        </Cell>
        <Cell label="Stars" className="md:text-right">
          <span className="measured inline-flex items-center gap-1 text-sm text-ink-2">
            <Star className="h-3.5 w-3.5 text-muted" aria-hidden="true" /> {repo.stars}
            <span className="sr-only">stars</span>
          </span>
        </Cell>
        <Cell label="Forks" className="md:text-right">
          <span className="measured inline-flex items-center gap-1 text-sm text-ink-2">
            <GitFork className="h-3.5 w-3.5 text-muted" aria-hidden="true" /> {repo.forks}
            <span className="sr-only">forks</span>
          </span>
        </Cell>
        <Cell label="Rating" className="md:text-right">
          {review ? <RatingValue rating={review.rating} /> : <span className="text-sm text-muted">Not rated</span>}
        </Cell>
        <Cell label="Updated" className="md:whitespace-nowrap">
          {repo.pushedAt ? (
            <span className="measured text-xs text-muted">
              <span className="sr-only">Updated </span>
              {formatRelative(repo.pushedAt)}
            </span>
          ) : (
            <span className="text-xs text-muted">Unknown</span>
          )}
        </Cell>
        <td className="max-md:block max-md:pt-2 md:py-2 md:pl-3 md:pr-4 md:text-right md:align-top">
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => onRate(repo.name)}
            disabled={rateDisabled}
            aria-busy={rating || undefined}
            aria-label={`${review ? 'Rate again' : 'Rate'} ${repo.name} with AI`}
            className="relative inline-flex h-8 cursor-pointer items-center gap-1 whitespace-nowrap rounded-pill border border-rule-2 px-2.5 text-xs font-medium text-ink-2 transition-[background-color,color,border-color] duration-[120ms] ease-out after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] hover:border-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-55 pointer-coarse:after:-inset-y-2"
          >
            {rating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {rating ? 'Rating…' : review ? 'Rate again' : 'Rate'}
          </button>
          {review && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="relative inline-flex h-8 items-center gap-1 rounded-pill border border-rule-2 px-2.5 text-xs font-medium text-ink-2 transition-[background-color,color,border-color] duration-[120ms] ease-out after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] hover:border-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:bg-paper-3 disabled:opacity-55 pointer-coarse:after:-inset-y-2"
            >
              {open ? 'Hide review' : 'Review'}
              <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform duration-[220ms] ease-out motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
            </button>
          )}
          </div>
        </td>
      </tr>
      {review && open && (
        <tr className="bg-paper-3 max-md:block">
          <td colSpan={7} className="max-md:block md:px-4 md:pb-4">
            <div id={panelId} className="grid gap-5 border-l border-rule-2 py-1 pl-4 text-sm max-md:mx-4 max-md:mb-4 sm:grid-cols-2">
              <div>
                <h3 className="max-w-none text-sm font-medium text-ink">Working well</h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-2 marker:text-muted">
                  {review.strengths.length ? review.strengths.map((s) => <li key={s}>{s}</li>) : <li>Nothing stood out yet.</li>}
                </ul>
              </div>
              <div>
                <h3 className="max-w-none text-sm font-medium text-ink">To improve</h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-2 marker:text-muted">
                  {review.improvements.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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

  // Rating one repository merges its review into the cached reviews on the report.
  const [ratingName, setRatingName] = useState<string | null>(null);
  const [justRated, setJustRated] = useState<string | null>(null);
  const rateOne = async (name: string) => {
    setRatingName(name);
    setJustRated(null);
    setReviewError(null);
    try {
      const { reviews: merged, item } = await enhancementApi.reviewRepository(name);
      setReviews(merged);
      useAnalysisStore.setState((s) => (s.analysis ? { analysis: { ...s.analysis, aiRepoReviews: merged } } : {}));
      setJustRated(name);
      toast.success(`Rated ${name}`, `${item.rating}/10. ${item.summary}`);
    } catch (e) {
      const info = await getApiError(e, `Rating ${name} failed. Please try again.`);
      setReviewError({ message: info.message, settings: needsAISettings(info) });
    } finally {
      setRatingName(null);
    }
  };

  const average = reviews?.items.length
    ? Math.round((reviews.items.reduce((s, r) => s + r.rating, 0) / reviews.items.length) * 10) / 10
    : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Repositories"
        description={`${repos.length} repositories analysed, ${repos.filter((r) => r.isPrivate).length} of them private.`}
        actions={
          <Button onClick={runReview} isLoading={reviewing} disabled={ratingName !== null} leftIcon={<Sparkles className="h-4 w-4" />}>
            {reviews ? 'Review again with AI' : 'Rate all with AI'}
          </Button>
        }
      />

      {/* The AI review status line: what was rated and by which model. */}
      <div className="flex flex-col gap-2 border-y border-rule py-3 sm:flex-row sm:items-center sm:justify-between">
        {reviews ? (
          <>
            <p className="text-sm text-ink-2">
              <span className="measured">{reviews.items.length}</span> {reviews.items.length === 1 ? 'repository' : 'repositories'} rated{' '}
              <span className="measured">{formatRelative(reviews.generatedAt)}</span>. Average rating{' '}
              <span className="measured text-ink">{average}/10</span>.
            </p>
            <AIAttribution ai={reviews.ai} />
          </>
        ) : (
          <p className="max-w-[72ch] text-sm text-ink-2">
            Rate up to 30 of your most recently updated repositories in one AI request: a rating from 1 to 10, a one-line verdict
            and what to fix. README excerpts, including from private repos, are sent to your AI provider.
          </p>
        )}
      </div>
      {reviewError && (
        <p role="alert" className="rounded-pill border border-rule bg-bad-soft px-3 py-2 text-sm text-bad">
          {reviewError.message}{' '}
          {reviewError.settings && (
            <Link
              to="/dashboard/settings#ai-provider"
              className="font-medium text-ink underline decoration-rule-2 underline-offset-4 hover:text-accent hover:decoration-accent"
            >
              Open AI settings
            </Link>
          )}
        </p>
      )}

      <div className="card overflow-hidden">
        {/* Toolbar: search, then filters and sort. */}
        <div className="flex flex-col gap-2 border-b border-rule p-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="repo-search" className="sr-only">
              Search repositories
            </label>
            <input
              id="repo-search"
              type="search"
              className="input h-9 pl-9 pr-3 text-sm pointer-coarse:h-11"
              placeholder="Search by name or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 lg:ml-auto lg:flex">
            <label className="sr-only" htmlFor="repo-lang">Language</label>
            <select id="repo-lang" className="input h-9 px-2 text-sm pointer-coarse:h-11" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="all">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="repo-vis">Visibility</label>
            <select
              id="repo-vis"
              className="input h-9 px-2 text-sm pointer-coarse:h-11"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            >
              <option value="all">Public and private</option>
              <option value="public">Public only</option>
              <option value="private">Private only</option>
            </select>
            <label className="sr-only" htmlFor="repo-sort">Sort by</label>
            <select
              id="repo-sort"
              className="input h-9 px-2 text-sm pointer-coarse:h-11"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              {reviews && <option value="rating">Highest rated</option>}
              <option value="updated">Recently updated</option>
              <option value="stars">Most stars</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">No repositories match these filters.</div>
        ) : (
          <table className="w-full border-collapse max-md:block">
            <caption className="sr-only">Repositories</caption>
            <thead className="max-md:sr-only">
              <tr className="border-b border-rule">
                <Th className="pl-4">Repository</Th>
                <Th>Language</Th>
                <Th className="text-right">Stars</Th>
                <Th className="text-right">Forks</Th>
                <Th className="text-right">Rating</Th>
                <Th>Updated</Th>
                <Th className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {list.map((repo) => (
                <RepoRow
                  key={repo.name}
                  repo={repo}
                  review={reviewByName.get(repo.name)}
                  onRate={rateOne}
                  rating={ratingName === repo.name}
                  rateDisabled={reviewing || ratingName !== null}
                  justRated={justRated === repo.name}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const RepositoriesPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Repositories" />}>
    {(a) =>
      a.repositories.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description="GitVanta didn’t find any repositories you own. Create one on GitHub, then analyse again."
        />
      ) : (
        <RepositoriesContent repos={a.repositories} initialReviews={a.aiRepoReviews} />
      )
    }
  </AnalysisGate>
);

export default RepositoriesPage;
