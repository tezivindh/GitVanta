import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Star,
  GitFork,
  MapPin,
  Building2,
  Globe,
  ExternalLink,
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
import { ErrorState, LoadingRegion, Logo, ScoreCircle, Skeleton, ThemeToggle } from '../components/ui';

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

const RepoCard: React.FC<{ repo: PublicRepo }> = ({ repo }) => {
  const body = (
    <>
      <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
        <span className="truncate">{repo.name}</span>
        {repo.isPrivate ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Private project, no public link" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        )}
      </span>
      <span className="mt-1.5 line-clamp-2 block text-sm text-gray-600 dark:text-gray-400">
        {repo.description || 'No description'}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {repo.language && <span>{repo.language}</span>}
        {!repo.isPrivate && (
          <>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" aria-hidden="true" /> {repo.stars}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" aria-hidden="true" /> {repo.forks}
            </span>
          </>
        )}
        {repo.isPrivate && <span>Private project</span>}
      </span>
    </>
  );
  return repo.url ? (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
    >
      {body}
    </a>
  ) : (
    <div className="h-full rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">{body}</div>
  );
};

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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {profile && (
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          )}
          {!viewer && (
            <Link
              to="/"
              className="hidden h-9 items-center rounded-lg bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700 sm:inline-flex dark:bg-primary-500 dark:text-gray-950"
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {nav}
        <LoadingRegion label="Loading profile" className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </LoadingRegion>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {nav}
        <main className="mx-auto max-w-lg px-4 py-20">
          {error?.notFound ? (
            <div className="text-center">
              <Github className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No GitVanta profile here</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{error.message}</p>
              <Link to="/" className="mt-6 inline-block font-medium text-primary-700 hover:underline dark:text-primary-400">
                Score your own GitHub profile
              </Link>
            </div>
          ) : (
            <ErrorState message={error?.message ?? 'Something went wrong.'} onRetry={load} />
          )}
        </main>
      </div>
    );
  }

  const repos = [...profile.repositories].sort((a, b) => Number(a.isPrivate) - Number(b.isPrivate) || b.stars - a.stars);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {nav}
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        {/* Identity */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img src={profile.avatarUrl} alt="" className="h-24 w-24 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{profile.displayName}</h1>
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">@{profile.username}</p>
            {profile.headline && <p className="mt-3 text-lg text-primary-700 dark:text-primary-400">{profile.headline}</p>}
            {profile.bio && <p className="mt-2 max-w-2xl text-gray-700 dark:text-gray-300">{profile.bio}</p>}
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
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
              {profile.blog && (
                <li>
                  <a href={withProtocol(profile.blog)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                    <Globe className="h-4 w-4" aria-hidden="true" /> {profile.blog.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-2">
              <li>
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-white dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  <Github className="h-4 w-4" aria-hidden="true" /> GitHub
                </a>
              </li>
              {profile.socialAccounts.map((acc) => {
                const { label, icon: Icon } = socialInfo(acc);
                return (
                  <li key={acc.url}>
                    <a
                      href={acc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-white dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Score */}
        <section aria-labelledby="score-title" className="card grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex justify-center">
            <ScoreCircle score={profile.overallScore} size="lg" label="GitVanta score" />
          </div>
          <div>
            <h2 id="score-title" className="sr-only">
              Score by category
            </h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <dt className="text-gray-700 dark:text-gray-300">{c.label}</dt>
                    <dd className="tabular-nums text-gray-500 dark:text-gray-400">{profile.categoryScores[c.key]}</dd>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${profile.categoryScores[c.key]}%` }} />
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Analysed {new Date(profile.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}.{' '}
              <Link to="/#scoring" className="underline">
                How the score works
              </Link>
            </p>
          </div>
        </section>

        {profile.summary && (
          <section aria-labelledby="about-title">
            <h2 id="about-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              About
            </h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-gray-700 dark:text-gray-300">{profile.summary}</p>
          </section>
        )}

        {/* Projects */}
        <section aria-labelledby="projects-title">
          <h2 id="projects-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects ({repos.length})
          </h2>
          {repos.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No public projects to show yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {repos.map((r) => (
                <li key={r.name}>
                  <RepoCard repo={r} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <section aria-labelledby="skills-title">
            <h2 id="skills-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Skills
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.skills.slice(0, 24).map((s) => (
                <li key={s.name} className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
                  {s.name}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="badges-title">
            <h2 id="badges-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Badges ({profile.badges.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {profile.badges.map((b) => (
                <li key={b.id} className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
                  <span className="text-gray-600 dark:text-gray-400">: {b.description}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        Portfolio scored by{' '}
        <Link to="/" className="font-medium text-primary-700 hover:underline dark:text-primary-400">
          GitVanta
        </Link>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
