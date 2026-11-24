import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, RefreshCw, Star, Lock, Globe, Mail, Github } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { getApiError } from '../../api/client';
import { reportError } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { AIAttribution, Button, Card, ErrorState, LoadingRegion, PageHeader, ScoreCircle, Skeleton } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { ProfessionalProfile } from '../../types';

/** Absolute API base, so README badges work when pasted anywhere. */
function apiBase(): string {
  return new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin).href.replace(/\/+$/, '');
}

const CopyField: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => {
  const [copied, setCopied] = useState(false);
  const id = `copy-${label.replace(/\W+/g, '-').toLowerCase()}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed', 'Select the text and copy it manually.');
    }
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={`input h-10 min-w-0 flex-1 px-3 text-sm ${mono ? 'font-mono' : ''}`}
        />
        <Button variant="outline" onClick={copy} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
};

const ProfessionalContent: React.FC = () => {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await analysisApi.getProfessionalProfile());
    } catch (e) {
      setError((await getApiError(e, 'Could not build your professional profile.')).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const regenerate = async () => {
    setRefreshing(true);
    try {
      setProfile(await analysisApi.getProfessionalProfile(true));
      toast.success('Summary rewritten');
    } catch (e) {
      await reportError(e, 'Could not rewrite the summary');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <LoadingRegion label="Building your professional profile" className="space-y-6">
        <Skeleton className="h-40" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </LoadingRegion>
    );
  }
  if (error || !profile) return <ErrorState message={error ?? 'Something went wrong.'} onRetry={load} />;

  const badgeUrl = `${apiBase()}/badge/${profile.username}.svg`;
  const badgeMarkdown = `[![GitVanta score](${badgeUrl})](${profile.publicUrl})`;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-full ring-1 ring-gray-200 dark:ring-gray-800" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile.displayName}</h2>
            <p className="mt-0.5 text-primary-700 dark:text-primary-400">{profile.headline}</p>
            <p className="mt-3 max-w-2xl leading-relaxed text-gray-700 dark:text-gray-300">{profile.summary}</p>
            {profile.highlights.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                {profile.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {profile.ai ? (
                <AIAttribution ai={profile.ai} />
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Plain summary.{' '}
                  <Link to="/dashboard/settings#ai-provider" className="underline">
                    Set up AI
                  </Link>{' '}
                  for a written one.
                </p>
              )}
              <Button size="sm" variant="ghost" onClick={regenerate} isLoading={refreshing} leftIcon={<RefreshCw className="h-4 w-4" />}>
                {profile.ai ? 'Rewrite summary' : 'Write summary with AI'}
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 justify-center">
            <ScoreCircle score={profile.overallScore} size="lg" label="GitVanta score" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Anyone with the link sees your score, skills, badges and the projects you choose.
            </p>
          </div>
          <a
            href={`/profile/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
          >
            Open public profile <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <CopyField label="Public profile link" value={profile.publicUrl} />
          <div>
            <CopyField label="README badge (Markdown)" value={badgeMarkdown} mono />
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              Preview: <img src={badgeUrl} alt={`GitVanta score ${profile.overallScore} of 100`} height={20} className="h-5" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured projects</h2>
            <Link to="/dashboard/settings#public-profile" className="shrink-0 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
              Choose projects
            </Link>
          </div>
          {profile.topProjects.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              No projects are visible. Turn some on in Settings → Public profile.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.topProjects.map((p) => {
                const body = (
                  <>
                    <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                      <span className="truncate">{p.name}</span>
                      {p.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Private, not linked" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-gray-600 dark:text-gray-400">
                      {p.description || 'No description'}
                    </span>
                    <span className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {p.language && <span>{p.language}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" aria-hidden="true" /> {p.stars}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={p.name}>
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-full rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary-300 dark:border-gray-800 dark:hover:border-primary-800"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="h-full rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {profile.strengths.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Strengths</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                {profile.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={profile.contact.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-gray-700 hover:underline dark:text-gray-300">
                  <Github className="h-4 w-4" aria-hidden="true" /> GitHub
                </a>
              </li>
              {profile.contact.website && (
                <li>
                  <a
                    href={/^https?:\/\//.test(profile.contact.website) ? profile.contact.website : `https://${profile.contact.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 break-all text-gray-700 hover:underline dark:text-gray-300"
                  >
                    <Globe className="h-4 w-4 shrink-0" aria-hidden="true" /> {profile.contact.website}
                  </a>
                </li>
              )}
              {profile.contact.email && (
                <li>
                  <a href={`mailto:${profile.contact.email}`} className="inline-flex items-center gap-2 break-all text-gray-700 hover:underline dark:text-gray-300">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {profile.contact.email}
                  </a>
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top skills</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.topSkills.map((s) => (
              <li key={s.name} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {s.name}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Badges ({profile.badges.length})</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.badges.map((b) => (
              <li key={b.id} className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200">
                {b.name}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

const ProfessionalProfilePage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Professional view" />}>
    {() => (
      <div className="space-y-6">
        <PageHeader title="Professional view" description="How recruiters and visitors see you. Share the link or add the badge to your README." />
        <ProfessionalContent />
      </div>
    )}
  </AnalysisGate>
);

export default ProfessionalProfilePage;
