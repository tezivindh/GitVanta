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
import { ErrorState, LoadingRegion, Logo, Skeleton, ThemeToggle } from '../components/ui';
import ScoreFormula from '../components/brand/ScoreFormula';

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

const linkClass = 'inline-flex items-center gap-1.5 text-gray-800 underline-offset-4 hover:underline dark:text-gray-200';

const RepoRow: React.FC<{ repo: PublicRepo }> = ({ repo }) => (
  <li className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:items-baseline">
    <p className="flex min-w-0 items-center gap-1.5 font-semibold">
      {repo.url ? (
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-gray-950 underline decoration-gray-300 underline-offset-4 transition-colors hover:decoration-primary-500 dark:text-white dark:decoration-gray-600"
        >
          {repo.name}
        </a>
      ) : (
        <span className="truncate text-gray-950 dark:text-white">{repo.name}</span>
      )}
      {repo.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-label="Private project, no public link" />}
    </p>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      {repo.description || (repo.isPrivate ? 'Private project' : 'No description')}
    </p>
    <p className="flex items-center gap-3 text-sm tabular-nums text-gray-600 sm:justify-end dark:text-gray-400">
      {repo.language && <span>{repo.language}</span>}
      {!repo.isPrivate && repo.stars > 0 && (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5" aria-hidden="true" /> {repo.stars}
          <span className="sr-only">stars</span>
        </span>
      )}
      {!repo.isPrivate && repo.forks > 0 && (
        <span className="inline-flex items-center gap-1">
          <GitFork className="h-3.5 w-3.5" aria-hidden="true" /> {repo.forks}
          <span className="sr-only">forks</span>
        </span>
      )}
    </p>
  </li>
);

/** One band of the résumé layout: heading on the left, content on the right. */
const Band: React.FC<{ id: string; title: React.ReactNode; children: React.ReactNode; first?: boolean }> = ({
  id,
  title,
  children,
  first,
}) => (
  <section
    aria-labelledby={id}
    className={`grid gap-4 py-10 lg:grid-cols-12 lg:gap-8 ${first ? '' : 'border-t border-gray-200 dark:border-gray-800'}`}
  >
    <h2 id={id} className="font-display text-xl text-gray-950 lg:col-span-3 dark:text-white">
      {title}
    </h2>
    <div className="min-w-0 lg:col-span-9">{children}</div>
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
    <header className="dark sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {profile && (
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-gray-800 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-gray-200/60 active:scale-[0.97] pointer-coarse:h-11 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          )}
          {!viewer && (
            <Link
              to="/"
              className="hidden h-10 items-center rounded-md bg-primary-400 px-3.5 text-sm font-semibold text-gray-950 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primary-300 active:scale-[0.97] sm:inline-flex"
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
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        {nav}
        <LoadingRegion label="Loading profile" className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-9 w-72 max-w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </LoadingRegion>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
        {nav}
        <main className="mx-auto max-w-lg px-4 py-20">
          {error?.notFound ? (
            <div className="text-center">
              <Github className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
              <h1 className="font-display mt-4 text-2xl text-gray-950 dark:text-white">No GitVanta profile here</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{error.message}</p>
              <Link to="/" className="mt-6 inline-block font-semibold text-primary-700 underline-offset-4 hover:underline dark:text-primary-400">
                Score your own GitHub profile
              </Link>
            </div>
          ) : (
            <>
              <h1 className="sr-only">Profile for @{username}</h1>
              <ErrorState message={error?.message ?? 'Something went wrong.'} onRetry={load} />
            </>
          )}
        </main>
      </div>
    );
  }

  const repos = [...profile.repositories].sort((a, b) => Number(a.isPrivate) - Number(b.isPrivate) || b.stars - a.stars);

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {nav}
      <main>
      <div className="dark bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        {/* Identity and score */}
        <section className="grid gap-10 pb-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start lg:col-span-8">
            <img src={profile.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg ring-1 ring-gray-200 dark:ring-gray-800" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[2.25rem] leading-none text-gray-950 sm:text-[2.75rem] dark:text-white">
                {profile.displayName}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">@{profile.username}</p>
              {profile.headline && <p className="mt-4 max-w-2xl text-lg text-gray-900 dark:text-gray-100">{profile.headline}</p>}
              {profile.bio && <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{profile.bio}</p>}
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
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
                  <Users className="h-4 w-4" aria-hidden="true" /> {profile.followers} followers
                </li>
              </ul>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
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
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GitVanta score</p>
            <p className="font-display mt-1 text-[5.5rem] leading-[0.85] text-gray-950 dark:text-white">
              {profile.overallScore}
              <span className="text-2xl text-gray-500 dark:text-gray-400">/100</span>
            </p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Analysed {new Date(profile.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}.{' '}
              <Link to="/#scoring" className="font-medium text-gray-900 underline underline-offset-4 dark:text-gray-100">
                How it’s scored
              </Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="score-title" className="pb-12">
          <h2 id="score-title" className="sr-only">
            Score by category
          </h2>
          <ScoreFormula
            parts={CATEGORIES.map((c) => ({
              label: c.label,
              short: c.key === 'professionalism' ? 'Profile' : undefined,
              weight: c.weight,
              score: profile.categoryScores[c.key],
            }))}
          />
        </section>
      </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
        {profile.summary && (
          <Band id="about-title" title="About" first>
            <p className="max-w-3xl text-lg leading-relaxed text-gray-800 dark:text-gray-200">{profile.summary}</p>
          </Band>
        )}

        <Band
          id="projects-title"
          title={
            <>
              Projects <span className="text-gray-500 dark:text-gray-400">{repos.length}</span>
            </>
          }
        >
          {repos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No public projects to show yet.</p>
          ) : (
            <ul className="-mt-4 divide-y divide-gray-200 dark:divide-gray-800">
              {repos.map((r) => (
                <RepoRow key={r.name} repo={r} />
              ))}
            </ul>
          )}
        </Band>

        <Band id="skills-title" title="Skills">
          <ul className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 30).map((s) => (
              <li
                key={s.name}
                className="rounded-md border border-gray-200 bg-paper px-2.5 py-1 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              >
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
                Badges <span className="text-gray-500 dark:text-gray-400">{profile.badges.length}</span>
              </>
            }
          >
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {profile.badges.map((b) => (
                <div key={b.id}>
                  <dt className="font-semibold text-gray-950 dark:text-white">{b.name}</dt>
                  <dd className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{b.description}</dd>
                </div>
              ))}
            </dl>
          </Band>
        )}
      </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
        Portfolio scored by{' '}
        <Link to="/" className="font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-gray-100">
          GitVanta
        </Link>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
