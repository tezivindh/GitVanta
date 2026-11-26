import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, RefreshCw, Star, Lock, Globe, Mail, Github } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { getApiError } from '../../api/client';
import { reportError } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { AIAttribution, Button, ErrorState, LoadingRegion, PageHeader, ScoreCircle, Skeleton } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { ProfessionalProfile } from '../../types';

/** Absolute API base, so README badges work when pasted anywhere. */
function apiBase(): string {
  return new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin).href.replace(/\/+$/, '');
}

const headClass = 'max-w-none text-lg font-medium leading-snug tracking-[-0.01em] text-ink';
const linkClass =
  'text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent active:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

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
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={`input h-9 min-w-0 flex-1 px-3 text-sm disabled:cursor-not-allowed ${mono ? 'measured' : ''}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={copy}
          leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
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
  if (error || !profile) return <ErrorState message={error ?? 'Could not load your professional profile.'} onRetry={load} />;

  const badgeUrl = `${apiBase()}/badge/${profile.username}.svg`;
  const badgeMarkdown = `[![GitVanta score](${badgeUrl})](${profile.publicUrl})`;

  return (
    <div className="space-y-6">
      {/* Who you are, what the AI wrote about you, and the score */}
      <section aria-labelledby="pro-name" className="panels min-[60rem]:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full border border-rule"
            />
            <div className="min-w-0">
              <h2 id="pro-name" className="max-w-none text-xl font-medium leading-tight tracking-[-0.02em] text-ink">
                {profile.displayName}
              </h2>
              <p className="mt-0.5 text-sm text-ink-2">{profile.headline}</p>
            </div>
          </div>

          <div className="mt-5 rounded-card bg-paper-3 p-4 sm:p-5">
            <div className="prose-gv max-w-[68ch] text-md">
              <p>{profile.summary}</p>
              {profile.highlights.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm marker:text-muted">
                  {profile.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
              {profile.ai ? (
                <AIAttribution ai={profile.ai} />
              ) : (
                <p className="text-xs text-muted">
                  This summary was built without AI.{' '}
                  <Link to="/dashboard/settings#ai-provider" className={linkClass}>
                    Set up AI
                  </Link>{' '}
                  to have one written for you.
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={regenerate}
                isLoading={refreshing}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                {profile.ai ? 'Rewrite summary' : 'Write summary with AI'}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-5 sm:p-6">
          <ScoreCircle score={profile.overallScore} size="lg" label="GitVanta score" />
        </div>
      </section>

      {/* Share */}
      <section aria-labelledby="pro-share" className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 id="pro-share" className={headClass}>
              Share
            </h2>
            <p className="mt-1 text-sm text-muted">
              Anyone with the link sees your score, skills, badges and the projects you choose.
            </p>
          </div>
          <a
            href={`/profile/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex shrink-0 items-center gap-1.5 text-sm ${linkClass}`}
          >
            Open public profile <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <CopyField label="Public profile link" value={profile.publicUrl} />
          <div>
            <CopyField label="README badge (Markdown)" value={badgeMarkdown} mono />
            <div className="mt-2 flex min-h-[1lh] items-center gap-2 text-xs text-muted">
              Preview: <img src={badgeUrl} alt={`GitVanta score ${profile.overallScore} of 100`} height={20} className="h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Projects, strengths, contact: one surface */}
      <div className="panels lg:grid-cols-3">
        <section aria-labelledby="pro-projects" className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <h2 id="pro-projects" className={headClass}>
              Featured projects
            </h2>
            <Link to="/dashboard/settings#public-profile" className={`shrink-0 text-sm ${linkClass}`}>
              Choose projects
            </Link>
          </div>
          {profile.topProjects.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted sm:px-6">
              No projects are visible. Turn some on in Settings, under Public profile.
            </p>
          ) : (
            <ul className="divide-y divide-rule border-t border-rule">
              {profile.topProjects.map((p) => {
                const body = (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-ink">
                      <span className="measured truncate">{p.name}</span>
                      {p.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Private, not linked" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{p.description || 'No description'}</span>
                    <span className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                      {p.language && <span>{p.language}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" aria-hidden="true" /> <span className="measured">{p.stars}</span>
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
                        className="block px-5 py-3 transition-colors duration-[120ms] ease-out hover:bg-paper-3 active:bg-paper-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus sm:px-6"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="px-5 py-3 sm:px-6">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="divide-y divide-rule">
          {profile.strengths.length > 0 && (
            <section aria-labelledby="pro-strengths" className="p-5 sm:p-6">
              <h2 id="pro-strengths" className={headClass}>
                Strengths
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                {profile.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="pro-contact" className="p-5 sm:p-6">
            <h2 id="pro-contact" className={headClass}>
              Contact
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={profile.contact.github}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 ${linkClass}`}
                >
                  <Github className="h-4 w-4 text-muted" aria-hidden="true" /> GitHub
                </a>
              </li>
              {profile.contact.website && (
                <li>
                  <a
                    href={/^https?:\/\//.test(profile.contact.website) ? profile.contact.website : `https://${profile.contact.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 break-all ${linkClass}`}
                  >
                    <Globe className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /> {profile.contact.website}
                  </a>
                </li>
              )}
              {profile.contact.email && (
                <li>
                  <a href={`mailto:${profile.contact.email}`} className={`inline-flex items-center gap-2 break-all ${linkClass}`}>
                    <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /> {profile.contact.email}
                  </a>
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Skills and badges */}
      <div className="panels md:grid-cols-2">
        <section aria-labelledby="pro-skills" className="p-5 sm:p-6">
          <h2 id="pro-skills" className={headClass}>
            Top skills
          </h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {profile.topSkills.map((s) => (
              <li key={s.name} className="rounded-chip border border-rule bg-paper-3 px-2 py-0.5 text-sm text-ink-2">
                {s.name}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="pro-badges" className="p-5 sm:p-6">
          <h2 id="pro-badges" className={headClass}>
            Badges <span className="measured text-muted">({profile.badges.length})</span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {profile.badges.map((b) => (
              <li key={b.id} className="rounded-chip border border-rule px-2 py-0.5 text-sm text-ink-2">
                {b.name}
              </li>
            ))}
          </ul>
        </section>
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
