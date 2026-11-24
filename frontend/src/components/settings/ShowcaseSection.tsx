import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Lock, Search, ExternalLink } from 'lucide-react';
import { settingsApi } from '../../api';
import { getApiError } from '../../api/client';
import { ShowcaseRepo } from '../../types';
import { Button, EmptyState, ErrorState, LoadingRegion, Skeleton } from '../ui';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

type Filter = 'all' | 'visible' | 'hidden' | 'private';

/** Choose which repositories visitors see on the public and professional profile. */
const ShowcaseSection: React.FC = () => {
  const username = useAuthStore((s) => s.user?.username);
  const [repos, setRepos] = useState<ShowcaseRepo[]>([]);
  const [hasAnalysis, setHasAnalysis] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [shownPrivate, setShownPrivate] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<{ hidden: string[]; shown: string[] }>({ hidden: [], shown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsApi.getShowcase();
      setRepos(data.repos);
      setHasAnalysis(data.hasAnalysis);
      setHidden(new Set(data.hiddenRepos));
      setShownPrivate(new Set(data.shownPrivateRepos));
      setSaved({ hidden: [...data.hiddenRepos].sort(), shown: [...data.shownPrivateRepos].sort() });
    } catch (e) {
      setError((await getApiError(e, 'Could not load your repositories.')).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isVisible = (r: ShowcaseRepo) => (r.isPrivate ? shownPrivate.has(r.name) : !hidden.has(r.name));

  const toggle = (r: ShowcaseRepo) => {
    const update = (set: Set<string>) => {
      const next = new Set(set);
      if (next.has(r.name)) next.delete(r.name);
      else next.add(r.name);
      return next;
    };
    if (r.isPrivate) setShownPrivate(update);
    else setHidden(update);
  };

  const dirty =
    JSON.stringify([...hidden].sort()) !== JSON.stringify(saved.hidden) ||
    JSON.stringify([...shownPrivate].sort()) !== JSON.stringify(saved.shown);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false;
      if (filter === 'visible') return isVisible(r);
      if (filter === 'hidden') return !isVisible(r);
      if (filter === 'private') return r.isPrivate;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, query, filter, hidden, shownPrivate]);

  const visibleCount = repos.filter(isVisible).length;

  const save = async () => {
    setSaving(true);
    try {
      const data = await settingsApi.saveShowcase({ hiddenRepos: [...hidden], shownPrivateRepos: [...shownPrivate] });
      setRepos(data.repos);
      setSaved({ hidden: [...data.hiddenRepos].sort(), shown: [...data.shownPrivateRepos].sort() });
      toast.success('Profile repositories saved', `${data.repos.filter((r) => r.visible).length} repositories are now visible.`);
    } catch (e) {
      toast.error('Could not save', (await getApiError(e)).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingRegion label="Loading repositories" className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </LoadingRegion>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!hasAnalysis || repos.length === 0) {
    return (
      <EmptyState
        icon={FolderGit2}
        title="No repositories yet"
        description="Run an analysis first. Your repositories will appear here so you can choose which ones to show."
        action={
          <Link to="/dashboard" className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
            Go to the overview
          </Link>
        }
      />
    );
  }

  const filters: Array<[Filter, string]> = [
    ['all', `All (${repos.length})`],
    ['visible', `Visible (${visibleCount})`],
    ['hidden', `Hidden (${repos.length - visibleCount})`],
    ['private', `Private (${repos.filter((r) => r.isPrivate).length})`],
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Public repositories are shown unless you hide them. Private repositories stay hidden unless you turn them on, and then
        visitors see the name and description only, with no link.{' '}
        {username && (
          <Link
            to={`/profile/${username}`}
            className="inline-flex items-center gap-0.5 font-medium text-primary-700 hover:underline dark:text-primary-400"
          >
            View your public profile <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <label htmlFor="showcase-search" className="sr-only">
            Search repositories
          </label>
          <input
            id="showcase-search"
            type="search"
            className="input h-9 pl-9 pr-3 text-sm"
            placeholder="Search repositories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter repositories">
          {filters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={
                filter === key
                  ? 'rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900'
                  : 'rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="max-h-[28rem] divide-y divide-gray-200 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No repositories match.</li>}
        {filtered.map((r) => {
          const visible = isVisible(r);
          const id = `showcase-${r.name}`;
          return (
            <li key={r.name} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <span className="truncate">{r.name}</span>
                  {r.isPrivate && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      <Lock className="h-3 w-3" aria-hidden="true" /> Private
                    </span>
                  )}
                </label>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {[r.language, r.stars ? `${r.stars} stars` : null, r.description].filter(Boolean).join('. ') || 'No description'}
                </p>
              </div>
              <button
                id={id}
                type="button"
                role="switch"
                aria-checked={visible}
                onClick={() => toggle(r)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  visible ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span className="sr-only">{visible ? 'Shown on profile' : 'Hidden from profile'}</span>
                <span
                  aria-hidden="true"
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} isLoading={saving} disabled={!dirty}>
          Save profile repositories
        </Button>
        {dirty && <span className="text-sm text-gray-600 dark:text-gray-400">You have unsaved changes.</span>}
      </div>
    </div>
  );
};

export default ShowcaseSection;
