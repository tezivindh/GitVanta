import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Lock, Search, ExternalLink } from 'lucide-react';
import { settingsApi } from '../../api';
import { getApiError } from '../../api/client';
import { ShowcaseRepo } from '../../types';
import { Button, EmptyState, ErrorState, LoadingRegion, Skeleton, Switch } from '../ui';
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
          <Link to="/dashboard" className="text-sm text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent">
            Go to the overview
          </Link>
        }
      />
    );
  }

  const filters: Array<[Filter, string, number]> = [
    ['all', 'All', repos.length],
    ['visible', 'Visible', visibleCount],
    ['hidden', 'Hidden', repos.length - visibleCount],
    ['private', 'Private', repos.filter((r) => r.isPrivate).length],
  ];

  return (
    <div className="space-y-4">
      <p className="max-w-[68ch] text-sm text-muted">
        Public repositories are shown unless you hide them. Private repositories stay hidden unless you turn them on, and then
        visitors see the name and description only, with no link.{' '}
        {username && (
          <Link
            to={`/profile/${username}`}
            className="inline-flex items-center gap-1 text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent"
          >
            View your public profile <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <label htmlFor="showcase-search" className="sr-only">
            Search repositories
          </label>
          <input
            id="showcase-search"
            type="search"
            name="showcase-search"
            autoComplete="off"
            className="input h-9 pl-9 pr-3 text-sm"
            placeholder="Search repositories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter repositories">
          {filters.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={
                filter === key
                  ? 'inline-flex h-8 items-center gap-1 rounded-chip border border-rule-2 bg-paper-3 px-2.5 text-xs font-medium text-ink'
                  : 'inline-flex h-8 items-center gap-1 rounded-chip border border-transparent px-2.5 text-xs font-medium text-muted transition-colors duration-[120ms] ease-out hover:text-ink'
              }
            >
              {label} <span className="measured">({count})</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="max-h-[28rem] divide-y divide-rule overflow-y-auto border-y border-rule" aria-label="Repositories">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-muted">No repositories match.</li>}
        {filtered.map((r) => {
          const visible = isVisible(r);
          const id = `showcase-${r.name}`;
          return (
            <li key={r.name} className="flex items-center gap-4 py-2.5 pr-1">
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
                  <span className="measured truncate">{r.name}</span>
                  {r.isPrivate && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-chip border border-rule px-1.5 text-xs text-muted">
                      <Lock className="h-3 w-3" aria-hidden="true" /> Private
                    </span>
                  )}
                </label>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {[r.language, r.stars ? `${r.stars} stars` : null, r.description].filter(Boolean).join('. ') || 'No description'}
                </p>
              </div>
              <Switch
                id={id}
                label={r.name}
                hideLabel
                checked={visible}
                onChange={() => toggle(r)}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant={dirty ? 'primary' : 'secondary'} onClick={save} isLoading={saving} disabled={!dirty}>
          Save profile repositories
        </Button>
        <span className="min-h-[1lh] text-sm text-muted" aria-live="polite">
          {dirty ? 'You have unsaved changes.' : ''}
        </span>
      </div>
    </div>
  );
};

export default ShowcaseSection;
