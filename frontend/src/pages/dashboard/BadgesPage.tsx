import React, { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { Award, BookOpen, Code2, Flame, Heart, Shield, Star, Trophy, Users, Zap, type LucideIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import BadgeSeal, { type SealState } from '../../components/brand/BadgeSeal';
import { useAuthStore } from '../../store/authStore';
import { AnalysisReport } from '../../types';

// All possible badges - IDs match exactly what the backend generates
const allBadges = [
  // === Core badges (easier to earn) ===
  {
    id: 'open-source',
    name: 'Open Source Contributor',
    description: 'Contributed to open source projects',
    icon: 'heart' as const,
    variant: 'gold' as const,
    criteria: 'Fork or contribute to open source repositories',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Uses 5+ programming languages',
    icon: 'code' as const,
    variant: 'gold' as const,
    criteria: 'Use 5+ different programming languages in your projects',
  },
  {
    id: 'consistent',
    name: 'Consistent Coder',
    description: 'Regular commit activity',
    icon: 'flame' as const,
    variant: 'silver' as const,
    criteria: 'Achieve an activity score of 60 or higher',
  },
  {
    id: 'documenter',
    name: 'Great Documenter',
    description: 'Well-documented repositories',
    icon: 'book' as const,
    variant: 'silver' as const,
    criteria: 'Achieve a documentation score of 70 or higher',
  },
  {
    id: 'popular',
    name: 'Popular Developer',
    description: 'Repositories with many stars',
    icon: 'star' as const,
    variant: 'gold' as const,
    criteria: 'Earn 50+ stars across your repositories',
  },
  {
    id: 'community',
    name: 'Community Member',
    description: 'Active in the developer community',
    icon: 'users' as const,
    variant: 'bronze' as const,
    criteria: 'Have 10+ followers, 5+ forks received, or 20+ stars',
  },
  {
    id: 'professional',
    name: 'Professional Profile',
    description: 'Complete GitHub profile',
    icon: 'shield' as const,
    variant: 'bronze' as const,
    criteria: 'Achieve professionalism score of 70+ or have a profile README',
  },
  {
    id: 'innovative',
    name: 'Innovator',
    description: 'Creates diverse projects',
    icon: 'zap' as const,
    variant: 'special' as const,
    criteria: 'Achieve a diversity score of 70 or higher',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Helps others learn',
    icon: 'trophy' as const,
    variant: 'special' as const,
    criteria: 'Create educational/tutorial projects or have 30+ repos',
  },
  // === Advanced badges (harder to earn) ===
  {
    id: 'quality-coder',
    name: 'Quality Coder',
    description: 'Code quality score of 70+',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Achieve a code quality score of 70 or higher',
  },
  {
    id: 'code-master',
    name: 'Code Master',
    description: 'Code quality score of 90+',
    icon: 'trophy' as const,
    variant: 'gold' as const,
    criteria: 'Achieve a code quality score of 90 or higher',
  },
  {
    id: 'documentation-hero',
    name: 'Documentation Hero',
    description: 'Documentation score of 90+',
    icon: 'book' as const,
    variant: 'gold' as const,
    criteria: 'Achieve a documentation score of 90 or higher',
  },
  {
    id: 'active-contributor',
    name: 'Active Contributor',
    description: 'Highly active developer',
    icon: 'flame' as const,
    variant: 'gold' as const,
    criteria: 'Achieve an activity score of 80 or higher',
  },
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: 'Received 100+ stars',
    icon: 'star' as const,
    variant: 'gold' as const,
    criteria: 'Earn 100+ stars across your repositories',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: '100+ followers',
    icon: 'users' as const,
    variant: 'gold' as const,
    criteria: 'Have 100 or more GitHub followers',
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Created 20+ repositories',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Create 20 or more public repositories',
  },
  {
    id: 'prolific-creator',
    name: 'Prolific Creator',
    description: 'Created 50+ repositories',
    icon: 'zap' as const,
    variant: 'gold' as const,
    criteria: 'Create 50 or more public repositories',
  },
  {
    id: 'skilled-developer',
    name: 'Skilled Developer',
    description: 'Overall score of 75+',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Achieve an overall portfolio score of 75 or higher',
  },
  {
    id: 'elite-developer',
    name: 'Elite Developer',
    description: 'Overall score of 90+',
    icon: 'trophy' as const,
    variant: 'special' as const,
    criteria: 'Achieve an overall portfolio score of 90 or higher',
  },
];

type BadgeDef = (typeof allBadges)[number];

/** What each badge measures, with the same thresholds the backend awards on (scoringEngine.calculateBadges). */
type Measure =
  | 'codeQuality'
  | 'documentation'
  | 'activity'
  | 'diversity'
  | 'professionalism'
  | 'overall'
  | 'stars'
  | 'repos'
  | 'followers'
  | 'languages';

const MEASURES: Record<Measure, { label: string; unit: string; max: number }> = {
  overall: { label: 'Overall score', unit: 'overall score', max: 100 },
  codeQuality: { label: 'Code quality', unit: 'code quality score', max: 100 },
  documentation: { label: 'Documentation', unit: 'documentation score', max: 100 },
  activity: { label: 'Activity', unit: 'activity score', max: 100 },
  diversity: { label: 'Diversity', unit: 'diversity score', max: 100 },
  professionalism: { label: 'Professionalism', unit: 'professionalism score', max: 100 },
  stars: { label: 'Stars', unit: 'stars', max: 110 },
  repos: { label: 'Repositories', unit: 'repositories', max: 55 },
  followers: { label: 'Followers', unit: 'followers', max: 110 },
  languages: { label: 'Languages', unit: 'languages', max: 6 },
};

const RULES: Record<string, { measure: Measure; threshold: number; also?: string }> = {
  'quality-coder': { measure: 'codeQuality', threshold: 70 },
  'code-master': { measure: 'codeQuality', threshold: 90 },
  documenter: { measure: 'documentation', threshold: 70 },
  'documentation-hero': { measure: 'documentation', threshold: 90 },
  consistent: { measure: 'activity', threshold: 60 },
  'active-contributor': { measure: 'activity', threshold: 80 },
  innovative: { measure: 'diversity', threshold: 70 },
  professional: { measure: 'professionalism', threshold: 70, also: 'or a profile README' },
  'skilled-developer': { measure: 'overall', threshold: 75 },
  'elite-developer': { measure: 'overall', threshold: 90 },
  popular: { measure: 'stars', threshold: 50 },
  'star-collector': { measure: 'stars', threshold: 100 },
  builder: { measure: 'repos', threshold: 20 },
  mentor: { measure: 'repos', threshold: 30, also: 'or a tutorial or template repo' },
  'prolific-creator': { measure: 'repos', threshold: 50 },
  community: { measure: 'followers', threshold: 10, also: 'or 5 forks, or 20 stars' },
  influencer: { measure: 'followers', threshold: 100 },
  polyglot: { measure: 'languages', threshold: 5 },
};

const ICONS: Record<BadgeDef['icon'], LucideIcon> = {
  heart: Heart,
  code: Code2,
  flame: Flame,
  book: BookOpen,
  star: Star,
  users: Users,
  shield: Shield,
  zap: Zap,
  trophy: Trophy,
  award: Award,
};

const TRACK_ORDER: Measure[] = [
  'overall',
  'codeQuality',
  'documentation',
  'activity',
  'diversity',
  'professionalism',
  'stars',
  'repos',
  'followers',
  'languages',
];

function measureValues(a: AnalysisReport, followers: number | null): Record<Measure, number | null> {
  const repos = a.repositories ?? [];
  return {
    overall: a.overallScore,
    codeQuality: a.categoryScores.codeQuality,
    documentation: a.categoryScores.documentation,
    activity: a.categoryScores.activity,
    diversity: a.categoryScores.diversity,
    professionalism: a.categoryScores.professionalism,
    stars: repos.reduce((sum, r) => sum + (r.stars || 0), 0),
    repos: repos.length,
    followers,
    languages: (a.skills ?? []).filter((s) => s.category === 'language').length,
  };
}

const HOW_TO: Partial<Record<Measure, { to: string; label: string }>> = {
  overall: { to: '/dashboard', label: 'See your quick wins' },
  codeQuality: { to: '/dashboard/analytics#cat-codeQuality', label: 'See what raises code quality' },
  documentation: { to: '/dashboard/analytics#cat-documentation', label: 'See what raises documentation' },
  activity: { to: '/dashboard/analytics#cat-activity', label: 'See what raises activity' },
  diversity: { to: '/dashboard/analytics#cat-diversity', label: 'See what raises diversity' },
  professionalism: { to: '/dashboard/analytics#cat-professionalism', label: 'See what raises professionalism' },
  stars: { to: '/dashboard/repositories', label: 'See your repositories' },
  repos: { to: '/dashboard/repositories', label: 'See your repositories' },
  languages: { to: '/dashboard/skills', label: 'See your languages' },
};

const num = (n: number) => new Intl.NumberFormat().format(Math.round(n));

type TrackFilter = 'all' | 'progress' | 'complete';
const FILTERS: Array<{ id: TrackFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'progress', label: 'In progress' },
  { id: 'complete', label: 'Complete' },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * One badge on a track. Its name, rule and status live in a small card that opens
 * after a short hover, at once on keyboard focus, and on tap. Screen readers get
 * the same text as the button's description.
 */
const TierSeal: React.FC<{
  badge: BadgeDef;
  state: SealState;
  progress: number | null;
  /** Position on the line, 0 to 100. */
  left: number;
  rule: string;
  status: string;
}> = ({ badge, state, progress, left, rule, status }) => {
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<number>();
  const root = useRef<HTMLDivElement>(null);
  const descId = useId();

  // Close when a tap or click lands anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Keep the card inside the line at either end.
  const align = left < 18 ? 'left-0' : left > 82 ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={root}
      className={clsx('absolute top-0 flex flex-col items-center', left > 0 && '-translate-x-1/2')}
      style={{ left: `${left}%`, zIndex: open ? 20 : undefined }}
    >
      <button
        type="button"
        aria-describedby={descId}
        aria-expanded={open}
        className="cursor-pointer rounded-full transition-transform duration-[120ms] ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return;
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = window.setTimeout(() => setOpen(true), 350);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return;
          window.clearTimeout(hoverTimer.current);
          setOpen(false);
        }}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        {/* 36px on phones so close thresholds never overlap; 52px from 40rem. */}
        <BadgeSeal name={badge.name} icon={ICONS[badge.icon]} state={state} progress={progress} size={52} className="size-9 min-[40rem]:size-[52px]" />
      </button>
      {left > 0 && <span className="mt-1 h-3 w-px bg-rule-2" aria-hidden="true" />}

      {/* Always present for assistive tech; the visible card below mirrors it. */}
      <span id={descId} className="sr-only">
        {rule}. {status}.
      </span>
      {open && (
        <div
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute bottom-full mb-2 w-56 rounded-pill border border-rule-2 bg-paper-2 px-3 py-2.5 text-left animate-fade-in',
            align
          )}
        >
          <p className="text-sm font-medium text-ink">{badge.name}</p>
          <p className="mt-0.5 text-xs text-muted">{rule}</p>
          <p
            className={clsx(
              'mt-1.5 text-xs font-medium',
              state === 'earned' ? 'text-accent' : state === 'reached' ? 'text-ink-2' : 'text-cool'
            )}
          >
            {status}
          </p>
        </div>
      )}
    </div>
  );
};

const BadgesPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Badges" />}>{(analysis) => <BadgesContent analysis={analysis} />}</AnalysisGate>
);

const BadgesContent: React.FC<{ analysis: AnalysisReport }> = ({ analysis }) => {
  const followers = useAuthStore((s) => (typeof s.user?.followers === 'number' ? s.user.followers : null));
  const values = measureValues(analysis, followers);
  const earnedAt = new Map(analysis.badges.map((b) => [b.id, b.earnedAt]));

  const stateOf = (b: BadgeDef): SealState => {
    if (earnedAt.has(b.id)) return 'earned';
    const rule = RULES[b.id];
    const v = rule ? values[rule.measure] : null;
    return rule && v != null && v >= rule.threshold ? 'reached' : 'locked';
  };
  const progressOf = (b: BadgeDef): number | null => {
    const rule = RULES[b.id];
    const v = rule ? values[rule.measure] : null;
    return rule && v != null ? Math.min(1, v / rule.threshold) : null;
  };

  const earned = allBadges.filter((b) => stateOf(b) === 'earned');
  const closest = allBadges
    .filter((b) => stateOf(b) === 'locked' && (progressOf(b) ?? 0) > 0)
    .sort((x, y) => (progressOf(y) ?? 0) - (progressOf(x) ?? 0))
    .slice(0, 4);
  const next = closest[0];
  const alsoClose = closest.slice(1);

  // Track filter lives in the URL so it survives reloads and back navigation.
  const [params, setParams] = useSearchParams();
  const filter: TrackFilter = (FILTERS.some((f) => f.id === params.get('tracks')) ? params.get('tracks') : 'all') as TrackFilter;
  const setFilter = (f: TrackFilter) => {
    const nextParams = new URLSearchParams(params);
    if (f === 'all') nextParams.delete('tracks');
    else nextParams.set('tracks', f);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-10">
      <PageHeader title="Badges" description="Progress is measured from your latest analysis." />

      {/* Summary: the count as a reading, every badge as one cell, and the single next step. */}
      <section aria-label="Badge progress" className="panels min-[60rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="p-6">
          <p className="text-sm text-muted">Badges earned</p>
          <p className="reading mt-2 text-5xl">
            {earned.length}
            <span className="text-2xl text-muted"> / {allBadges.length}</span>
          </p>
          <ul className="mt-5 flex flex-wrap gap-1" aria-label={`${earned.length} of ${allBadges.length} badges earned`}>
            {allBadges.map((b) => {
              const st = stateOf(b);
              return (
                <li
                  key={b.id}
                  title={b.name}
                  className={clsx(
                    'size-4 rounded-[3px] border',
                    st === 'earned' && 'border-accent bg-accent',
                    st === 'reached' && 'border-accent bg-transparent',
                    st === 'locked' && 'border-rule-2 bg-heat-0'
                  )}
                >
                  <span className="sr-only">
                    {b.name}: {st === 'earned' ? 'earned' : st === 'reached' ? 'reached' : 'not yet'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-accent" aria-hidden="true" /> Earned
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] border border-accent" aria-hidden="true" /> Reached
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] border border-rule-2 bg-heat-0" aria-hidden="true" /> Not yet
            </span>
          </p>
        </div>
        <div className="flex items-center gap-5 p-6">
          {next ? (
            <>
              <BadgeSeal name={next.name} icon={ICONS[next.icon]} state="locked" progress={progressOf(next)} size={96} />
              <div className="min-w-0">
                <p className="text-sm text-muted">Next up</p>
                <p className="mt-0.5 text-lg font-medium text-ink">{next.name}</p>
                <p className="mt-1 text-sm text-ink-2">
                  <span className="measured text-cool">{num(Math.max(0, RULES[next.id].threshold - (values[RULES[next.id].measure] ?? 0)))}</span>{' '}
                  {MEASURES[RULES[next.id].measure].unit} to go
                </p>
                {HOW_TO[RULES[next.id].measure] && (
                  <Link
                    to={HOW_TO[RULES[next.id].measure]!.to}
                    className="mt-2 inline-block text-sm text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent"
                  >
                    {HOW_TO[RULES[next.id].measure]!.label}
                  </Link>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-2">Every badge with a measurable rule is earned or reached.</p>
          )}
        </div>
      </section>

      {/* Closest: the locked badges you are nearest to, each with its gap and where to close it. */}
      {alsoClose.length > 0 && (
        <section aria-labelledby="badges-closest">
          <h2 id="badges-closest" className="max-w-none text-lg font-medium tracking-[-0.01em] text-ink">
            Also within reach
          </h2>
          <ul className="panels mt-4 sm:grid-cols-3">
            {alsoClose.map((b) => {
              const rule = RULES[b.id];
              const m = MEASURES[rule.measure];
              const v = values[rule.measure] ?? 0;
              const gap = Math.max(0, Math.ceil(rule.threshold - v));
              const how = HOW_TO[rule.measure];
              return (
                <li key={b.id} className="flex flex-col items-center gap-4 px-5 py-7 text-center">
                  <BadgeSeal name={b.name} icon={ICONS[b.icon]} state="locked" progress={progressOf(b)} size={128} />
                  <div className="flex flex-col items-center">
                    <h3 className="max-w-none text-md font-medium text-ink">{b.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      <span className="measured text-ink-2">
                        {num(v)} / {num(rule.threshold)}
                      </span>{' '}
                      {m.unit}
                    </p>
                    <p className="mt-2 inline-flex rounded-chip bg-cool-soft px-2 py-0.5 text-sm text-ink">
                      <span className="measured">{num(gap)}</span>&nbsp;to go
                    </p>
                    {how && (
                      <Link
                        to={how.to}
                        className="mt-3 text-sm text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent"
                      >
                        {how.label}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Earned: struck seals, the person's own, in amber. */}
      <section aria-labelledby="badges-earned">
        <h2 id="badges-earned" className="flex max-w-none items-baseline gap-2 text-lg font-medium tracking-[-0.01em] text-ink">
          Earned
          <span className="measured text-sm font-normal text-muted">{earned.length}</span>
        </h2>
        {earned.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {earned.map((b) => {
              const when = earnedAt.get(b.id);
              return (
                <li key={b.id} className="flex flex-col items-center text-center">
                  <BadgeSeal
                    name={b.name}
                    icon={ICONS[b.icon]}
                    state="earned"
                    size={128}
                    rimNote={when ? String(new Date(when).getFullYear()) : undefined}
                  />
                  <p className="mt-3 max-w-[28ch] text-sm text-ink-2">{b.description}</p>
                  {when && <p className="measured mt-1 text-xs text-muted">Earned {fmtDate(when)}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-dashed border-rule-2 px-4 py-8 text-center text-sm text-muted">
            No badges earned yet. The tracks below show the rule and your progress for each one.
          </p>
        )}
      </section>

      {/* Tracks: every measure as a line, tiers at their thresholds, you on the line. */}
      <section aria-labelledby="badges-tracks">
        <h2 id="badges-tracks" className="max-w-none text-lg font-medium tracking-[-0.01em] text-ink">
          Tracks
        </h2>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[60ch] text-sm text-muted">
            Each line is one measure, and the amber marker is you. Hover over or tap a badge for its rule and how far you have
            to go.
          </p>
          <div role="radiogroup" aria-label="Show tracks" className="inline-flex shrink-0 rounded-pill border border-rule-2 bg-paper-3 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'h-8 cursor-pointer rounded-chip border px-3 text-sm transition-colors duration-[120ms] ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed pointer-coarse:h-10',
                  filter === f.id ? 'border-rule-2 bg-paper-2 text-ink' : 'border-transparent text-muted hover:text-ink active:text-ink'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <ul className="card mt-4 divide-y divide-rule">
          {TRACK_ORDER.map((measure) => {
            const tiers = allBadges
              .filter((b) => RULES[b.id]?.measure === measure)
              .sort((x, y) => RULES[x.id].threshold - RULES[y.id].threshold);
            if (!tiers.length) return null;
            const done = tiers.every((b) => stateOf(b) !== 'locked');
            if ((filter === 'progress' && done) || (filter === 'complete' && !done)) return null;
            const m = MEASURES[measure];
            const v = values[measure];
            const pct = (n: number) => Math.min(100, (n / m.max) * 100);
            const nextTier = tiers.find((b) => stateOf(b) === 'locked');
            return (
              <li key={measure} className="grid gap-x-8 gap-y-2 px-5 py-5 min-[60rem]:grid-cols-[12rem_minmax(0,1fr)]">
                <div>
                  <h3 className="max-w-none text-sm font-medium text-ink">{m.label}</h3>
                  <p className="measured mt-1 text-2xl text-ink">
                    {v == null ? 'Unknown' : num(v)}
                    <span className="text-sm text-muted">{m.max === 100 ? ' / 100' : ` ${m.unit}`}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {nextTier && v != null ? (
                      <>
                        Next: {nextTier.name},{' '}
                        <span className="measured text-cool">{num(Math.max(0, RULES[nextTier.id].threshold - v))}</span> to go
                      </>
                    ) : nextTier ? (
                      `Next: ${nextTier.name}`
                    ) : (
                      'Track complete'
                    )}
                  </p>
                </div>

                <div className="relative mx-7 h-[5.5rem] min-[40rem]:h-[6.75rem]">
                  <div className="absolute inset-x-0 top-[3.5rem] h-1.5 rounded-full bg-heat-0 min-[40rem]:top-[4.75rem]" aria-hidden="true">
                    {v != null && <div className="h-full rounded-full ramp-cool" style={{ width: `${pct(v)}%` }} />}
                  </div>
                  {v != null && (
                    <div className="absolute top-[3rem] -translate-x-1/2 min-[40rem]:top-[4.25rem]" style={{ left: `${pct(v)}%` }} aria-hidden="true">
                      <span className="block size-4 rounded-full border-2 border-paper-2 bg-accent" />
                      <span
                        className={clsx(
                          'measured absolute top-6 whitespace-nowrap text-xs text-accent',
                          pct(v) > 90 ? 'right-0' : pct(v) < 10 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                        )}
                      >
                        you {num(v)}
                      </span>
                    </div>
                  )}
                  {tiers.map((b) => {
                    const rule = RULES[b.id];
                    const st = stateOf(b);
                    const when = earnedAt.get(b.id);
                    const status =
                      st === 'earned'
                        ? when
                          ? `Earned ${fmtDate(when)}`
                          : 'Earned'
                        : st === 'reached'
                          ? tiers.some((t) => t !== b && earnedAt.has(t.id) && RULES[t.id].threshold > rule.threshold)
                            ? 'Passed; the higher tier on this track counts instead'
                            : 'Reached; awarded when you next analyse'
                          : v == null
                            ? 'Not measured yet'
                            : `${Math.max(0, Math.ceil(rule.threshold - v))} to go`;
                    return (
                      <TierSeal
                        key={b.id}
                        badge={b}
                        state={st}
                        progress={progressOf(b)}
                        left={pct(rule.threshold)}
                        rule={`${rule.threshold} ${m.unit}${rule.also ? `, ${rule.also}` : ''}`}
                        status={status}
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}

          {/* Open source has a yes-or-no rule, so its line has no scale. */}
          {(() => {
            const b = allBadges.find((x) => x.id === 'open-source')!;
            const st = stateOf(b);
            const when = earnedAt.get(b.id);
            if ((filter === 'progress' && st === 'earned') || (filter === 'complete' && st !== 'earned')) return null;
            return (
              <li className="grid gap-x-8 gap-y-2 px-5 py-5 min-[60rem]:grid-cols-[12rem_minmax(0,1fr)]">
                <div>
                  <h3 className="max-w-none text-sm font-medium text-ink">Open source</h3>
                  <p className="mt-1 text-sm text-muted">{st === 'earned' ? 'Contributing' : 'Not yet'}</p>
                </div>
                <div className="relative h-16">
                  <TierSeal
                    badge={b}
                    state={st}
                    progress={null}
                    left={0}
                    rule={b.criteria}
                    status={st === 'earned' ? (when ? `Earned ${fmtDate(when)}` : 'Earned') : 'Fork a project you contribute to'}
                  />
                </div>
              </li>
            );
          })()}
        </ul>
      </section>
    </div>
  );
};

export default BadgesPage;

