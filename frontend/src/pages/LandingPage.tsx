import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Github, Lock, Check, Copy } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/ui';
import HeatGrid from '../components/brand/HeatGrid';
import ScoreFormula, { FormulaPart } from '../components/brand/ScoreFormula';

/* ------------------------------------------------------------------ data */

// One consistent example portfolio used across the page: these six scores,
// weighted, give 66.
const EXAMPLE: FormulaPart[] = [
  { label: 'Code quality', short: 'Code', weight: 0.25, score: 78 },
  { label: 'Documentation', short: 'Docs', weight: 0.2, score: 61 },
  { label: 'Activity', short: 'Activity', weight: 0.2, score: 70 },
  { label: 'Diversity', short: 'Diversity', weight: 0.15, score: 66 },
  { label: 'Community', short: 'Community', weight: 0.1, score: 34 },
  { label: 'Professionalism', short: 'Profile', weight: 0.1, score: 72 },
];

const METRICS: Array<{ category: string; items: Array<[string, number]> }> = [
  { category: 'Code quality', items: [['Portfolio size', 25], ['Language range', 25], ['Repos with tests', 25], ['Descriptive commit messages', 25]] },
  { category: 'Documentation', items: [['README present', 30], ['README depth', 30], ['Licenses', 20], ['Contributing guides', 20]] },
  { category: 'Activity', items: [['Repos pushed in the last 30 days', 35], ['Days with commits this year', 35], ['Repos updated this year', 30]] },
  { category: 'Diversity', items: [['Languages', 40], ['Topics', 30], ['Kinds of projects', 30]] },
  { category: 'Community', items: [['Stars', 30], ['Followers', 25], ['Forks', 25], ['Follower balance', 20]] },
  { category: 'Professionalism', items: [['Profile completeness', 25], ['Profile README', 20], ['Repo naming', 20], ['Repo descriptions', 20], ['Linked accounts', 15]] },
];

const DOC_METRICS: Array<{ name: string; got: number; max: number; note: string }> = [
  { name: 'README present', got: 24, max: 30, note: '24 of 30 repos have one' },
  { name: 'README depth', got: 12, max: 30, note: 'Most are under 150 words' },
  { name: 'Licenses', got: 10, max: 20, note: '15 of 30 repos' },
  { name: 'Contributing guides', got: 15, max: 20, note: 'In your 4 largest repos' },
];

const FIXES: Array<[string, string, string]> = [
  ['Add a LICENSE to', 'weather-cli', '+0.9'],
  ['Add tests to', 'todo-api', '+0.9'],
  ['Expand the README in', 'portfolio-site', '+0.6'],
];

const PROVIDERS = ['OpenAI', 'Anthropic', 'Gemini', 'Groq', 'OpenRouter', 'Mistral', 'DeepSeek', 'Together'];

const FAQS = [
  {
    q: 'Is GitVanta free?',
    a: 'Yes. You can run three analyses a day. AI features use a shared key with an hourly limit, or your own key with a much higher one.',
  },
  {
    q: 'Why does it ask for access to my repositories?',
    a: 'To score private projects, GitHub requires the “repo” permission, which is broader than GitVanta needs. GitVanta only reads: it never pushes code, opens issues or changes settings. You can revoke access at any time in your GitHub settings, or by deleting your GitVanta account.',
  },
  {
    q: 'Will my private repositories appear on my public profile?',
    a: 'No. Private repos count towards your score but stay off your public profile unless you turn them on one by one in Settings. Even then, visitors see the name and description only, with no link.',
  },
  {
    q: 'Which AI model writes the suggestions?',
    a: 'GitVanta’s built-in AI, unless you add your own key in Settings. With your own key, each result names the provider and model that wrote it.',
  },
  {
    q: 'Can someone game the score?',
    a: 'Not cheaply. Most points come from things a reviewer would also notice: tests, documentation, real commit history and maintained projects. Empty repos and one-word commit messages lower the score.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes. Settings has a JSON export of everything GitVanta stores about you, a button to sign out of every device, and account deletion, which also revokes GitVanta’s access on GitHub.',
  },
];

/* ------------------------------------------------------------- pieces */

const badgeBase = () =>
  new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin).href.replace(/\/+$/, '');

/** The one container: 1440 cap, 64px gutter (24 and 16 on smaller screens).
 *  The steps are spelled out because tokens.css sets --gutter and the section
 *  gaps unlayered, which outranks base.css's smaller-screen overrides. */
const wrap = 'mx-auto w-full max-w-[var(--container)] px-4 sm:px-6 min-[60rem]:px-[var(--gutter)]';
const gapS = 'pt-14 sm:pt-20 min-[60rem]:pt-[var(--section-gap-s)]';
const gapM = 'pt-[4.5rem] sm:pt-24 min-[60rem]:pt-[var(--section-gap)]';
const gapL = 'pt-24 sm:pt-[7.5rem] min-[60rem]:pt-[var(--section-gap-l)]';

const primaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-pill border border-accent bg-accent px-5 text-md font-medium text-accent-ink transition-[filter,transform] duration-[120ms] ease-out motion-reduce:transition-none hover:brightness-[1.06] active:translate-y-px';

const secondaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-pill border border-rule-2 bg-paper-2 px-5 text-md font-medium text-ink transition-[background-color,border-color,transform] duration-[120ms] ease-out motion-reduce:transition-none hover:border-muted hover:bg-paper-3 active:translate-y-px';

const SignInButton: React.FC<{ className?: string }> = ({ className }) => (
  <Link to="/login" className={clsx(primaryAction, className)}>
    <Github className="h-[18px] w-[18px]" aria-hidden="true" />
    Sign in with GitHub
  </Link>
);

/** The README badge, drawn the way the API renders it, in the page's tokens. */
const BadgePreview: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="138" height="20" viewBox="0 0 138 20" role="img" aria-label="GitVanta score: 66/100" className={clsx('h-7 w-auto', className)}>
    <clipPath id="badge-r">
      <rect width="138" height="20" rx="3" />
    </clipPath>
    <g clipPath="url(#badge-r)">
      <rect width="92" height="20" style={{ fill: 'var(--color-ink-2)' }} />
      <rect x="92" width="46" height="20" style={{ fill: 'var(--color-ok)' }} />
    </g>
    <g textAnchor="middle" fontSize="11" style={{ fill: 'var(--color-paper)', fontFamily: 'var(--font-body)' }}>
      <text x="46" y="14">GitVanta score</text>
      <text x="115" y="14">66/100</text>
    </g>
  </svg>
);

const CopySnippet: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="overflow-hidden rounded-pill border border-rule-2 bg-paper-3">
      <code
        tabIndex={0}
        aria-label="Badge Markdown"
        className="measured block min-w-0 break-all px-4 py-3.5 text-sm text-ink-2"
      >
        {text}
      </code>
      <div className="flex justify-end border-t border-rule bg-paper-2 p-1.5">
      <button
        type="button"
        onClick={copy}
        className="flex h-11 shrink-0 items-center gap-2 rounded-pill border border-rule-2 bg-paper-2 px-4 text-sm font-medium text-ink transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:bg-paper-3 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
        aria-live="polite"
      >
        {copied ? <Check className="h-4 w-4 text-ok" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      </div>
    </div>
  );
};

/** The fix rows as a diff: an ok gutter with the gain, the change in the row. */
const FixDiff: React.FC<{ className?: string }> = ({ className }) => (
  <ul className={clsx('divide-y divide-rule', className)}>
    {FIXES.map(([verb, repo, gain]) => (
      <li key={repo} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center bg-ok-soft">
        <span className="measured self-stretch border-r border-rule px-4 py-3 text-sm text-ok">{gain}</span>
        <span className="min-w-0 px-4 py-3 text-sm text-ink-2">
          {verb} <span className="measured text-ink">{repo}</span>
        </span>
      </li>
    ))}
  </ul>
);

/** The signature: the example portfolio's score as a reading, struck 66 to 69. */
const ScoreReading: React.FC = () => (
  <figure aria-label="Example portfolio score after three fixes" className="card overflow-hidden">
    <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3.5 text-sm">
      <span className="font-medium text-ink">Overall score</span>
      <span className="text-muted">Example portfolio</span>
    </div>

    <div className="px-5 pb-6 pt-5 sm:px-7">
      <p className="flex items-baseline gap-3 text-lg">
        <s className="measured text-bad decoration-1">
          <span className="sr-only">was </span>66
        </s>
        <span className="measured text-sm text-ok">up 3</span>
      </p>
      <p className="mt-1 flex items-baseline gap-3">
        <span className="reading text-[clamp(6rem,4rem+7vw,10.5rem)]">69</span>
        <span className="measured text-xl text-muted">/100</span>
      </p>
    </div>

    <FixDiff className="border-t border-rule" />

    <dl className="grid grid-cols-3 divide-x divide-rule border-t border-rule">
      <div className="min-w-0 px-5 py-3.5">
        <dt className="text-xs text-muted">Who</dt>
        <dd className="mt-1 truncate text-sm text-accent">Priya Raman</dd>
      </div>
      <div className="min-w-0 px-5 py-3.5">
        <dt className="text-xs text-muted">When</dt>
        <dd className="measured mt-1 text-sm text-cool">run 2</dd>
      </div>
      <div className="min-w-0 px-5 py-3.5">
        <dt className="text-xs text-muted">Why</dt>
        <dd className="mt-1 text-sm text-ink">Three fixes worth 2.4 points</dd>
      </div>
    </dl>
  </figure>
);

/* ------------------------------------------------- how a score goes up */

const STEPS: Array<{ title: string; body?: string; value?: string; diff?: string; fixes?: boolean }> = [
  {
    title: 'Sign in with GitHub',
    body: 'GitVanta reads your profile, repositories and commits. It never pushes, comments or changes settings.',
  },
  {
    title: 'Run an analysis',
    value: '66',
    body: 'GitVanta inspects your 30 most recently updated repos and your own commits in the 10 most recently pushed. It usually takes under a minute.',
  },
  {
    title: 'Make the fixes it ranks highest',
    fixes: true,
    body: 'Each gain is measured: GitVanta re-runs the scoring with the fix applied.',
  },
  { title: 'Analyse again', value: '69', diff: 'up 3', body: 'Each run is kept, so your dashboard charts the change over time.' },
  { title: 'Share it', body: 'Put your profile link on your resume and the live badge in your README.' },
];

/** The trail the steps leave: one row per step, lit up to the step in view. */
const ScoreTrail: React.FC<{ active: number }> = ({ active }) => {
  const row = (step: number) =>
    clsx(
      'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 transition-opacity duration-[220ms] ease-out motion-reduce:transition-none',
      step > active && 'opacity-35'
    );
  const marker = (step: number) =>
    step === active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-accent" />;
  return (
    <figure aria-label="The example portfolio’s score log" className="card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-6 py-3.5 text-sm">
        <span className="font-medium text-ink">Score log</span>
        <span className="text-muted">Example portfolio</span>
      </div>
      <ol className="divide-y divide-rule">
        <li className={row(0)}>
          {marker(0)}
          <span className="text-md text-ink-2">Sign in with GitHub</span>
          <span className="rounded-chip border border-rule bg-cool-soft px-2 py-0.5 text-xs text-ink">read only</span>
        </li>
        <li className={row(1)}>
          {marker(1)}
          <span className="text-md text-ink-2">Run an analysis</span>
          <span className="measured text-3xl leading-none text-ink">66</span>
        </li>
        <li
          className={clsx(
            'relative transition-opacity duration-[220ms] ease-out motion-reduce:transition-none',
            2 > active && 'opacity-35'
          )}
        >
          {marker(2)}
          <FixDiff />
        </li>
        <li className={row(3)}>
          {marker(3)}
          <span className="text-md text-ink-2">Analyse again</span>
          <span className="flex items-baseline gap-3">
            <span className="measured text-sm text-ok">up 3</span>
            <span className="measured text-3xl leading-none text-ink">69</span>
          </span>
        </li>
        <li className={row(4)}>
          {marker(4)}
          <span className="text-md text-ink-2">Share it</span>
          <BadgePreview className="h-6" />
        </li>
      </ol>
    </figure>
  );
};

const HowItWorks: React.FC = () => {
  const last = STEPS.length - 1;
  // Without script, or under 60rem, every row of the trail is lit.
  const [active, setActive] = useState(last);
  const refs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 60rem)');
    let io: IntersectionObserver | null = null;
    const start = () => {
      io?.disconnect();
      if (!wide.matches || !('IntersectionObserver' in window)) {
        setActive(last);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
          });
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      refs.current.forEach((el) => el && io?.observe(el));
    };
    start();
    wide.addEventListener('change', start);
    return () => {
      io?.disconnect();
      wide.removeEventListener('change', start);
    };
  }, [last]);

  return (
    <section id="how-it-works" aria-labelledby="how-head" className={clsx('scroll-mt-24', gapM)}>
      <div className={wrap}>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 id="how-head" className="text-section lg:col-span-6">
            How a score goes up.
          </h2>
          <p className="lead text-ink-2 lg:col-span-5 lg:col-start-8">
            You make the fixes in your own repositories. GitVanta only reads them and tells you what changed.
          </p>
        </div>

        <div className="mt-12 grid gap-10 min-[60rem]:mt-16 min-[60rem]:grid-cols-12 min-[60rem]:gap-8">
          <div className="min-w-0 min-[60rem]:col-span-7">
            <div className="min-[60rem]:sticky min-[60rem]:top-[calc(50dvh-13rem)]">
              <ScoreTrail active={active} />
            </div>
          </div>

          <ol className="min-w-0 min-[60rem]:col-span-5">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-step={i}
                className="border-t border-rule py-8 first:border-t-0 first:pt-0 min-[60rem]:flex min-[60rem]:min-h-[52dvh] min-[60rem]:flex-col min-[60rem]:justify-center min-[60rem]:border-t-0 min-[60rem]:py-0 min-[60rem]:first:pt-0"
              >
                <p className="measured text-sm text-muted" aria-hidden="true">
                  {i + 1}/{STEPS.length}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className={clsx('text-title', i === active ? 'text-ink' : 'text-ink-2')}>{s.title}</h3>
                  {s.value && <span className="measured text-title text-ink">{s.value}</span>}
                  {s.diff && <span className="measured text-sm text-ok">{s.diff}</span>}
                </div>
                {s.body && <p className="mt-3 max-w-[44ch] text-md text-muted">{s.body}</p>}
                {s.fixes && (
                  <ul className="mt-4 space-y-2 text-sm">
                    {FIXES.map(([verb, repo, gain]) => (
                      <li key={repo} className="flex items-baseline gap-3">
                        <span className="min-w-0 flex-1 text-muted">
                          {verb} <span className="measured text-ink">{repo}</span>
                        </span>
                        <span className="measured text-ok">{gain}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

/** A small rendering of a public profile. */
const ProfilePreview: React.FC = () => (
  <figure aria-label="Example public profile" className="card overflow-hidden">
    <div className="flex items-center gap-4 border-b border-rule p-6 sm:p-8">
      <div className="grid h-12 w-12 shrink-0 grid-cols-3 gap-[2px] rounded-pill bg-paper-3 p-1.5" aria-hidden="true">
        {[1, 0, 1, 0, 1, 0, 1, 1, 1].map((on, i) => (
          <span key={i} className={on ? 'rounded-[2px] bg-heat-3' : ''} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">Priya Raman</p>
        <p className="truncate text-sm text-muted">Backend developer, Go and Postgres</p>
      </div>
      <p className="reading text-[3.25rem]">
        66<span className="sr-only"> out of 100</span>
      </p>
    </div>
    <ul className="divide-y divide-rule text-sm">
      {[
        { name: 'weather-cli', lang: 'Go', text: 'Forecasts in your terminal, cached offline.', link: true },
        { name: 'todo-api', lang: 'Go', text: 'REST API with Postgres and JWT auth.', link: true },
        { name: 'billing-service', lang: 'Go', text: 'Private client project, shown without a link.', link: false },
      ].map((r) => (
        <li key={r.name} className="flex items-start gap-3 px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className={clsx('measured text-ink', r.link && 'underline decoration-rule-2 underline-offset-4')}>
              {r.name}
              {!r.link && <Lock className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px text-muted" aria-label="Private" />}
            </p>
            <p className="mt-0.5 truncate text-muted">{r.text}</p>
          </div>
          <span className="shrink-0 text-muted">{r.lang}</span>
        </li>
      ))}
    </ul>
  </figure>
);

/* ---------------------------------------------------------------- page */

const navLinks = [
  ['#scoring', 'Scoring'],
  ['#how-it-works', 'How it works'],
  ['#sharing', 'Sharing'],
  ['#ai', 'AI'],
  ['#faq', 'FAQ'],
];

const scoreOf = (label: string) => EXAMPLE.find((p) => p.label === label);

const CategoryTile: React.FC<{ category: string; className?: string }> = ({ category, className }) => {
  const m = METRICS.find((x) => x.category === category)!;
  const p = scoreOf(category)!;
  return (
    <div className={clsx('flex flex-col p-6 sm:p-8 lg:p-10', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl">{m.category}</h3>
          <p className="mt-1 text-sm text-muted">
            Counts <span className="measured">{Math.round(p.weight * 100)}%</span>
          </p>
        </div>
        <p className="measured text-3xl leading-none text-ink">
          {p.score}
          <span className="sr-only"> out of 100 in the example</span>
        </p>
      </div>
      <dl className="mt-auto space-y-3 pt-10 text-md">
        {m.items.map(([name, pts]) => (
          <div key={name} className="flex items-baseline gap-2">
            <dt className="text-muted">{name}</dt>
            <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-rule-2" />
            <dd className="measured text-ink-2">{pts}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  // An answer is in the page only while its question is open, so a closed list
  // stays one screen of questions.
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-dvh overflow-x-clip bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:border focus:border-rule-2 focus:bg-paper-2 focus:px-3 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      {/* ------------------------------------------------- Nav: floating pill */}
      <header className="sticky top-0 z-50 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className={wrap}>
          <div className="card flex h-16 items-center justify-between gap-4 pl-5 pr-2">
            <Logo />
            <nav aria-label="Main" className="hidden items-center gap-1 text-sm text-muted md:flex">
              {navLinks.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="inline-flex h-11 items-center rounded-pill px-3 transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1">
              <Link
                to="/login"
                className="inline-flex h-11 items-center whitespace-nowrap rounded-pill border border-rule-2 px-4 text-sm font-medium text-ink transition-[background-color,border-color,transform] duration-[120ms] ease-out motion-reduce:transition-none hover:border-muted hover:bg-paper-3 active:translate-y-px"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ------------------------------------------------- Hero: Settled */}
        <section aria-labelledby="hero-head" className="flex min-h-[calc(100dvh-5rem)] items-center py-12 lg:py-10">
          <div className={clsx(wrap, 'grid items-center gap-[var(--space-xl)] lg:grid-cols-2 lg:gap-[var(--space-3xl)]')}>
            <div className="min-w-0">
              <h1 id="hero-head" className="text-display">
                Your GitHub, scored out of 100.
              </h1>
              <p className="lead mt-6 text-ink-2">GitVanta scores your repos in six categories and ranks the fixes.</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <SignInButton />
                <a href="#scoring" className={secondaryAction}>
                  See how it’s scored
                </a>
              </div>
            </div>
            <div className="min-w-0">
              <ScoreReading />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ Scoring: Bento */}
        <section id="scoring" aria-labelledby="scoring-head" className={clsx('scroll-mt-24', gapS)}>
          <div className={wrap}>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
              <h2 id="scoring-head" className="text-section lg:col-span-6">
                Six categories, one weighted score.
              </h2>
              <p className="lead text-ink-2 lg:col-span-5 lg:col-start-8">
                Each category is scored from 0 to 100 and counts for a fixed share of the total.
              </p>
            </div>

            <div className="panels mt-12 grid-cols-1 lg:mt-16 lg:grid-cols-12">
              {/* Lead tile: the whole score, and the year it came from */}
              <div className="p-6 sm:p-8 lg:col-span-12 lg:px-10 lg:py-14">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
                  <p className="reading shrink-0 text-[clamp(4.5rem,3rem+5vw,7.5rem)]">
                    66<span className="sr-only"> out of 100 equals</span>
                  </p>
                  <div className="min-w-0 flex-1 md:pt-2">
                    <ScoreFormula parts={EXAMPLE} />
                    <p className="mt-6 max-w-[68ch] text-sm text-muted">
                      A segment’s width is its weight, its fill the score: the filled area is your number.
                    </p>
                  </div>
                </div>
                <div className="mt-10 border-t border-rule pt-8 lg:mt-14 lg:pt-14">
                  <p className="sr-only">An example contribution graph with the score 66 drawn into it.</p>
                  <HeatGrid value="66" animate={false} showMonths={false} />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1.5" aria-hidden="true">
                      Less
                      {[0, 1, 2, 3, 4].map((l) => (
                        <span key={l} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: `var(--color-heat-${l})` }} />
                      ))}
                      More
                    </span>
                    <span>
                      Example portfolio: <span className="measured">30</span> repos, <span className="measured">412</span> commits in the last year
                    </span>
                  </div>
                </div>
              </div>

              {/* Documentation, opened: every point comes with a reason */}
              <figure aria-label="Example category breakdown" className="flex flex-col lg:col-span-7 lg:row-span-2">
                <div className="p-6 sm:p-8 lg:p-10">
                  <h3 id="explained" className="text-xl">
                    Every point comes with a reason.
                  </h3>
                </div>
                <div className="flex items-end justify-between gap-4 border-y border-rule bg-paper-3 px-6 py-4 sm:px-8">
                  <div>
                    <p className="font-medium text-ink">Documentation</p>
                    <p className="text-sm text-muted">
                      Counts for <span className="measured">20%</span> of the overall score
                    </p>
                  </div>
                  <p className="measured text-3xl leading-none text-ink">
                    61<span className="text-md text-muted">/100</span>
                  </p>
                </div>
                <table className="w-full text-left text-md">
                  <caption className="sr-only">Documentation metrics</caption>
                  <thead>
                    <tr className="text-xs text-muted">
                      <th scope="col" className="pb-1 pl-6 pr-3 pt-4 font-normal sm:pl-8">Metric</th>
                      <th scope="col" className="px-3 pb-1 pt-4 font-normal">Points</th>
                      <th scope="col" className="hidden pb-1 pl-3 pr-8 pt-4 font-normal sm:table-cell">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {DOC_METRICS.map((m) => (
                      <tr key={m.name}>
                        <th scope="row" className="py-6 pl-6 pr-3 font-medium text-ink sm:pl-8">
                          {m.name}
                          <span className="mt-0.5 block font-normal text-muted sm:hidden">{m.note}</span>
                        </th>
                        <td className="w-28 px-3 py-6 sm:w-40">
                          <div className="flex items-center gap-2.5">
                            <span className="measured w-12 shrink-0 text-ink">
                              {m.got}/{m.max}
                            </span>
                            <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-heat-0 sm:block" aria-hidden="true">
                              <span className="block h-full ramp-cool" style={{ width: `${(m.got / m.max) * 100}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className="hidden py-6 pl-3 pr-8 text-muted sm:table-cell">{m.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>

              <CategoryTile category="Code quality" className="lg:col-span-5" />
              <CategoryTile category="Activity" className="lg:col-span-5" />
              <CategoryTile category="Diversity" className="lg:col-span-4" />
              <CategoryTile category="Community" className="lg:col-span-4" />
              <CategoryTile category="Professionalism" className="lg:col-span-4" />
            </div>
            <p className="mt-4 text-sm text-muted">Points available per metric. Each category totals 100.</p>
          </div>
        </section>

        {/* ------------------------------------- How it works: Pinned run */}
        <HowItWorks />

        {/* ------------------------------------ Sharing: the code sample */}
        <section id="sharing" aria-labelledby="sharing-head" className={clsx('scroll-mt-24', gapL)}>
          <div className={clsx(wrap, 'grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8')}>
            <div className="min-w-0 lg:col-span-5">
              <h2 id="sharing-head" className="text-section">
                Your public profile and badge.
              </h2>
              <p className="mt-5 max-w-[48ch] text-md text-muted">
                Your public page shows your score, skills, badges and the projects you pick. Hide any repo. Private ones
                appear only if you list them, and without a link.
              </p>

              <div className="card mt-10 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4">
                  <div>
                    <h3 className="text-md font-medium">A badge for your README</h3>
                    <p className="text-sm text-muted">It updates after every analysis.</p>
                  </div>
                  <BadgePreview />
                </div>
                <div className="p-4">
                  <CopySnippet text={`![GitVanta score](${badgeBase()}/badge/your-username.svg)`} />
                </div>
              </div>
            </div>
            <div className="min-w-0 lg:col-span-6 lg:col-start-7">
              <ProfilePreview />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- FAQ: Rows */}
        <section id="faq" aria-labelledby="faq-head" className={clsx('scroll-mt-24', gapL)}>
          <div className={clsx(wrap, 'grid gap-10 lg:grid-cols-12 lg:gap-8')}>
            <h2 id="faq-head" className="text-section lg:col-span-4">
              Questions.
            </h2>
            <div className="divide-y divide-rule border-y border-rule lg:col-span-8">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group"
                  onToggle={(e) => {
                    const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                    setOpenFaqs((prev) => ({ ...prev, [f.q]: isOpen }));
                  }}
                >
                  <summary className="flex min-h-[6rem] cursor-pointer list-none items-center justify-between gap-6 py-5 text-title text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="relative h-3.5 w-3.5 shrink-0 text-muted before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-[220ms] after:ease-out motion-reduce:after:transition-none group-open:after:scale-y-0"
                    />
                  </summary>
                  {openFaqs[f.q] && <p className="max-w-[62ch] pb-7 text-md text-muted">{f.a}</p>}
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- AI */}
        <section id="ai" aria-labelledby="ai-head" className={clsx('scroll-mt-24', gapL)}>
          <div className={clsx(wrap, 'grid gap-12 lg:grid-cols-12 lg:gap-8')}>
            <div className="min-w-0 lg:col-span-6">
              <h2 id="ai-head" className="text-section">
                AI help, on our key or yours.
              </h2>
              <p className="mt-5 max-w-[50ch] text-md text-muted">
                Rewrite a README, draft resume bullets from a repo, get a portfolio summary and a roadmap, or rate every
                repo in one pass.
              </p>
              <ul className="mt-12 flex flex-wrap gap-3" aria-label="Supported providers">
                {PROVIDERS.map((p) => (
                  <li key={p} className="rounded-chip border border-rule bg-paper-2 px-4 py-2.5 text-lg text-ink">
                    {p}
                  </li>
                ))}
                <li className="rounded-chip border border-dashed border-rule-2 px-4 py-2.5 text-lg text-muted">
                  any OpenAI-compatible URL
                </li>
              </ul>
            </div>
            <dl className="panels content-start lg:col-span-5 lg:col-start-8">
              <div className="p-6 sm:px-10 sm:py-12">
                <dt className="text-title text-ink">Encrypted at rest</dt>
                <dd className="mt-2 text-muted">
                  <span className="measured text-ink-2">AES-256-GCM</span>, bound to your account.
                </dd>
              </div>
              <div className="p-6 sm:px-10 sm:py-12">
                <dt className="text-title text-ink">Never shown in full</dt>
                <dd className="mt-2 text-muted">
                  After saving you see <span className="measured text-ink-2">sk-…a1b2</span>. Change or delete it any time.
                </dd>
              </div>
              <div className="p-6 sm:px-10 sm:py-12">
                <dt className="text-title text-ink">Ten times the limit</dt>
                <dd className="mt-2 text-muted">
                  <span className="measured text-ink-2">500</span> AI requests an hour on your own key, instead of{' '}
                  <span className="measured text-ink-2">50</span>.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* -------------------------------------------------- Close: Band */}
        <section aria-labelledby="close-head" className="mt-[4.5rem] border-y border-rule bg-paper-2 py-14 sm:mt-24 sm:py-20 min-[60rem]:mt-[var(--section-gap)] min-[60rem]:py-[var(--section-gap-s)]">
          <div className={clsx(wrap, 'flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between')}>
            <div className="min-w-0">
              <h2 id="close-head" className="text-section">
                What’s your number?
              </h2>
              <p className="lead mt-5 text-ink-2">Sign in, run one analysis, and get your first three fixes in about a minute.</p>
            </div>
            <SignInButton className="self-start lg:self-auto" />
          </div>
        </section>
      </main>

      {/* ------------------------------------------------ Footer: colophon */}
      <footer>
        <div className={clsx(wrap, 'grid gap-8 py-16 md:grid-cols-12 md:items-start md:gap-8')}>
          <div className="md:col-span-6">
            <Logo />
            <p className="mt-4 max-w-[48ch] text-sm text-muted">
              © {new Date().getFullYear()}. Not affiliated with GitHub, Inc.
            </p>
          </div>
          <nav aria-label="Footer" className="md:col-span-6 md:justify-self-end">
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              <li>
                <a href="#scoring" className="inline-flex min-h-11 items-center transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:text-accent">
                  Scoring
                </a>
              </li>
              <li>
                <a href="#faq" className="inline-flex min-h-11 items-center transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:text-accent">
                  Privacy and data
                </a>
              </li>
              <li>
                <Link to="/login" className="inline-flex min-h-11 items-center transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:text-accent">
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/tezivindh/gitvanta"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center transition-colors duration-[120ms] ease-out motion-reduce:transition-none hover:text-accent"
                >
                  Source on GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
