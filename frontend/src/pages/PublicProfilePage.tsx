import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Star,
  GitFork,
  MapPin,
  Building2,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Link as LinkIcon,
  Lock,
  Users,
  Check,
  Copy,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getApiError } from '../api/client';
import { Badge, CategoryScores, ExtractedSkill, PublicRepo } from '../types';
import { CATEGORIES } from '../lib/scoring';
import { ErrorState, LoadingRegion, Logo, Skeleton } from '../components/ui';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PublicProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  profileUrl: string;
  followers: number;
  publicRepos: number;
  socialAccounts: { provider: string; url: string }[];
  overallScore: number;
  categoryScores: CategoryScores;
  skills: ExtractedSkill[];
  badges: Badge[];
  repositories: PublicRepo[];
  headline: string | null;
  summary: string | null;
  generatedAt: string;
}

const SOCIAL: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  twitter: { label: 'X / Twitter', icon: Twitter },
  instagram: { label: 'Instagram', icon: Instagram },
  youtube: { label: 'YouTube', icon: Youtube },
};

function socialInfo(account: { provider: string; url: string }) {
  const provider = account.provider.toLowerCase();
  const url = account.url.toLowerCase();
  const key = Object.keys(SOCIAL).find((k) => provider.includes(k) || url.includes(k === 'twitter' ? 'x.com' : k) || url.includes(k));
  if (key) return SOCIAL[key];
  try {
    return { label: new URL(account.url).hostname.replace(/^www\./, ''), icon: LinkIcon };
  } catch {
    return { label: account.provider || 'Link', icon: LinkIcon };
  }
}

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** Console links: underline in rule-2, amber on hover. */
const linkClass =
  'inline-flex items-center gap-1.5 text-ink-2 underline decoration-rule-2 underline-offset-4 transition-[color,text-decoration-color] duration-[120ms] ease-out hover:text-accent hover:decoration-accent';

const wrap = 'mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8';

const RepoRow: React.FC<{ repo: PublicRepo }> = ({ repo }) => (
  <li className="grid gap-x-6 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,15rem)_1fr_auto] sm:items-baseline">
    <p className="flex min-w-0 items-center gap-1.5 measured text-[0.9375rem]">
      {repo.url ? (
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-ink underline decoration-rule-2 underline-offset-4 transition-[color,text-decoration-color] duration-[120ms] ease-out hover:text-accent hover:decoration-accent"
        >
          {repo.name}
        </a>
      ) : (
        <span className="truncate text-ink">{repo.name}</span>
      )}
      {repo.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Private project, no public link" />}
    </p>
    <p className="text-sm text-muted">{repo.description || (repo.isPrivate ? 'Private project' : 'No description')}</p>
    <p className="flex items-center gap-4 text-sm text-muted sm:justify-end">
      {repo.language && <span className="text-ink-2">{repo.language}</span>}
      {!repo.isPrivate && repo.stars > 0 && (
        <span className="inline-flex items-center gap-1 measured">
          <Star className="h-3.5 w-3.5" aria-hidden="true" /> {repo.stars}
          <span className="sr-only">stars</span>
        </span>
      )}
      {!repo.isPrivate && repo.forks > 0 && (
        <span className="inline-flex items-center gap-1 measured">
          <GitFork className="h-3.5 w-3.5" aria-hidden="true" /> {repo.forks}
          <span className="sr-only">forks</span>
        </span>
      )}
    </p>
  </li>
);

/** One section of the résumé layout: heading on the left, content on the right. */
const Band: React.FC<{ id: string; title: React.ReactNode; children: React.ReactNode; first?: boolean }> = ({
  id,
  title,
  children,
  first,
}) => (
  <section
    aria-labelledby={id}
    className={`grid gap-6 py-14 lg:grid-cols-12 lg:gap-8 lg:py-16 ${first ? '' : 'border-t border-rule'}`}
  >
    <h2
      id={id}
      className="max-w-none font-display text-[2rem] font-medium leading-[1.05] tracking-[-0.03em] text-ink lg:col-span-4 lg:text-[2.5rem]"
    >
      {title}
    </h2>
    <div className="min-w-0 lg:col-span-8">{children}</div>
  </section>
);

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const viewer = useAuthStore((s) => s.user?.username);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/profile/${encodeURIComponent(username ?? '')}`, { timeout: 30_000 });
      setProfile(res.data.data);
    } catch (e) {
      const info = await getApiError(e, 'This profile could not be loaded.');
      setError({ message: info.message, notFound: info.status === 404 || info.status === 400 });
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  // Per-profile title and description for shared links and browser tabs.
  useEffect(() => {
    if (!profile) return;
    const prevTitle = document.title;
    document.title = `${profile.displayName} (@${profile.username}): GitVanta score ${profile.overallScore}`;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content;
    if (meta) {
      meta.content = profile.headline || profile.bio || `${profile.displayName}'s developer portfolio on GitVanta.`;
    }
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.content = prevDesc;
    };
  }, [profile]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const nav = (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper pt-[env(safe-area-inset-top)]">
      <div className={`${wrap} flex h-16 items-center justify-between gap-3`}>
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          {profile && (
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-sm font-medium text-ink-2 transition-[background-color,color,transform] duration-[120ms] ease-out hover:bg-paper-2 hover:text-ink active:translate-y-px pointer-coarse:h-11"
            >
              {copied ? <Check className="h-4 w-4 text-ok" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          )}
          {!viewer && (
            <Link
              to="/"
              className="hidden h-9 items-center rounded-pill border border-accent bg-accent px-3.5 text-sm font-medium text-accent-ink transition-[filter,transform] duration-[120ms] ease-out hover:brightness-[1.06] active:translate-y-px sm:inline-flex"
            >
              Get your score
            </Link>
          )}
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-dvh bg-paper text-ink">
        {nav}
        <LoadingRegion label="Loading profile" className={`${wrap} pt-12 sm:pt-16`}>
          {/* Same shape as the hero: identity left, reading right, six panels beneath. */}
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="flex gap-6 lg:col-span-8">
              <Skeleton className="h-20 w-20 shrink-0 rounded-card" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-12 w-80 max-w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-[28rem] max-w-full" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
            </div>
            <div className="space-y-3 lg:col-span-4 lg:flex lg:flex-col lg:items-end">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="panels mt-10 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="space-y-3 p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-1.5" />
              </div>
            ))}
          </div>
          <div className="mt-14 space-y-4 border-t border-rule pt-14">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        </LoadingRegion>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper text-ink">
        {nav}
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          {error?.notFound ? (
            <div className="w-full max-w-[44ch]">
              <Github className="h-8 w-8 text-muted" aria-hidden="true" />
              <h1 className="mt-6 max-w-none font-display text-display-s font-medium leading-[1.02] tracking-[-0.03em] text-ink">
                No GitVanta profile here
              </h1>
              <p className="mt-4 text-lead text-ink-2">{error.message}</p>
              <Link to="/" className={`mt-8 text-md ${linkClass}`}>
                Score your own GitHub profile
              </Link>
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <h1 className="sr-only">Profile for @{username}</h1>
              <ErrorState message={error?.message ?? 'Something went wrong.'} onRetry={load} />
            </div>
          )}
        </main>
      </div>
    );
  }

  const repos = [...profile.repositories].sort((a, b) => Number(a.isPrivate) - Number(b.isPrivate) || b.stars - a.stars);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {nav}
      <main>
        {/* Banner: identity and the score as a reading, then the six measurements. */}
        <div className="border-b border-rule">
          <div className={`${wrap} pb-12 pt-12 sm:pt-16`}>
            <section className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
              <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start lg:col-span-8">
                <img src={profile.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-card border border-rule" />
                <div className="min-w-0 flex-1">
                  <h1 className="max-w-none font-display text-display-s font-medium leading-[1.02] tracking-[-0.03em] text-ink">
                    {profile.displayName}
                  </h1>
                  <p className="mt-2 measured text-sm text-muted">@{profile.username}</p>
                  {profile.headline && <p className="mt-5 max-w-[60ch] text-lead leading-[1.45] text-ink-2">{profile.headline}</p>}
                  {profile.bio && <p className="mt-2 max-w-[65ch] text-muted">{profile.bio}</p>}
                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                    {profile.company && (
                      <li className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" aria-hidden="true" /> {profile.company}
                      </li>
                    )}
                    {profile.location && (
                      <li className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" /> {profile.location}
                      </li>
                    )}
                    <li className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" aria-hidden="true" /> <span className="measured">{profile.followers}</span> followers
                    </li>
                  </ul>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <li>
                      <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        <Github className="h-4 w-4" aria-hidden="true" /> GitHub
                      </a>
                    </li>
                    {profile.blog && (
                      <li>
                        <a href={withProtocol(profile.blog)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          <Globe className="h-4 w-4" aria-hidden="true" /> {profile.blog.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </li>
                    )}
                    {profile.socialAccounts.map((acc) => {
                      const { label, icon: Icon } = socialInfo(acc);
                      return (
                        <li key={acc.url}>
                          <a href={acc.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-4 lg:text-right">
                <p className="text-sm font-medium text-muted">GitVanta score</p>
                <p className="mt-2 reading text-[6rem] sm:text-[7.5rem]">
                  {profile.overallScore}
                  <span className="ml-1 text-[1.75rem] tracking-normal text-muted">/100</span>
                </p>
                <p className="mt-4 text-sm text-muted">
                  Analysed{' '}
                  <span className="measured text-ink-2">
                    {new Date(profile.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  .{' '}
                  <Link to="/#scoring" className={linkClass}>
                    How it’s scored
                  </Link>
                </p>
              </div>
            </section>

            <section aria-labelledby="score-title" className="mt-10">
              <h2 id="score-title" className="sr-only">
                Score by category
              </h2>
              <ul className="panels grid-cols-2 md:grid-cols-3 lg:grid-cols-6" aria-label="Score by category">
                {CATEGORIES.map((c) => {
                  const score = Math.round(profile.categoryScores[c.key] ?? 0);
                  return (
                    <li key={c.key} className="flex flex-col p-4">
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate text-ink-2" title={c.label}>
                          {c.label}
                        </span>
                        <span className="shrink-0 measured text-xs text-muted">
                          <span className="sr-only">counts </span>
                          {Math.round(c.weight * 100)}%
                        </span>
                      </p>
                      <p className="mt-3 measured text-[1.75rem] leading-none text-ink">{score}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-heat-0" aria-hidden="true">
                        <div className="h-full rounded-full ramp-cool" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>

        <div className={`${wrap} pb-16`}>
          {profile.summary && (
            <Band id="about-title" title="About" first>
              <p className="max-w-[65ch] text-lead leading-[1.6] text-ink-2">{profile.summary}</p>
            </Band>
          )}

          <Band
            id="projects-title"
            first={!profile.summary}
            title={
              <>
                Projects <span className="measured text-muted">{repos.length}</span>
              </>
            }
          >
            {repos.length === 0 ? (
              <p className="text-muted">No public projects to show yet.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {repos.map((r) => (
                  <RepoRow key={r.name} repo={r} />
                ))}
              </ul>
            )}
          </Band>

          <Band id="skills-title" title="Skills">
            <ul className="grid grid-cols-2 gap-x-6 border-t border-rule sm:grid-cols-3">
              {profile.skills.slice(0, 30).map((s) => (
                <li key={s.name} className="truncate border-b border-rule py-2.5 text-ink-2">
                  {s.name}
                </li>
              ))}
            </ul>
          </Band>

          {profile.badges.length > 0 && (
            <Band
              id="badges-title"
              title={
                <>
                  Badges <span className="measured text-muted">{profile.badges.length}</span>
                </>
              }
            >
              <dl className="panels sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                {profile.badges.map((b) => (
                  <div key={b.id} className="p-5">
                    <dt className="font-medium text-ink">{b.name}</dt>
                    <dd className="mt-1 text-sm text-muted">{b.description}</dd>
                  </div>
                ))}
              </dl>
            </Band>
          )}
        </div>
      </main>

      <footer className="border-t border-rule py-8 text-center text-sm text-muted">
        Portfolio scored by{' '}
        <Link to="/" className={linkClass}>
          GitVanta
        </Link>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
