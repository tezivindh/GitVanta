import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Github, Lock, Check, Copy } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { Logo, ThemeToggle } from '../components/ui';
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
    a: 'To score private projects, GitHub requires the "repo" permission, which is broader than GitVanta needs. GitVanta only reads: it never pushes code, opens issues or changes settings. You can revoke access at any time in your GitHub settings, or by deleting your GitVanta account.',
  },
  {
    q: 'Will my private repositories appear on my public profile?',
    a: 'No. Private repos count towards your score but stay off your public profile unless you turn them on one by one in Settings. Even then, visitors see the name and description only, with no link.',
  },
  {
    q: 'Which AI model writes the suggestions?',
    a: 'The model configured on the GitVanta server, unless you add your own key in Settings. Every AI result says which provider and model wrote it, and whose key paid for it.',
  },
  {
    q: 'Can someone game the score?',
    a: 'Not cheaply. Most points come from things a reviewer would also notice: tests, documentation, real commit history and maintained projects. Empty repos and one-word commit messages lower the score rather than raise it.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes. Settings has a JSON export of everything GitVanta stores about you, a button to sign out of every device, and account deletion, which also revokes GitVanta’s access on GitHub.',
  },
];

/* ------------------------------------------------------------- pieces */

const badgeBase = () =>
  new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin).href.replace(/\/+$/, '');

const SignInButton: React.FC<{ className?: string }> = ({ className }) => (
  <Link
    to="/login"
    className={clsx(
      'inline-flex h-12 items-center gap-2.5 rounded-md bg-primary-400 px-5 text-[15px] font-semibold text-gray-950 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primary-300 active:scale-[0.97]',
      className
    )}
  >
    <Github className="h-[18px] w-[18px]" aria-hidden="true" />
    Sign in with GitHub
  </Link>
);

const SectionHeading: React.FC<{ id?: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => (
  <h2
    id={id}
    className={clsx('font-display text-[2rem] leading-[1.05] text-gray-950 sm:text-[2.6rem] dark:text-white', className)}
  >
    {children}
  </h2>
);

/** The README badge, drawn the way the API renders it. */
const BadgePreview: React.FC = () => (
  <svg width="138" height="20" role="img" aria-label="GitVanta score: 66/100" className="h-7 w-auto">
    <clipPath id="badge-r">
      <rect width="138" height="20" rx="3" fill="#fff" />
    </clipPath>
    <g clipPath="url(#badge-r)">
      <rect width="92" height="20" fill="#555" />
      <rect x="92" width="46" height="20" fill="#7cb342" />
    </g>
    <g fill="#fff" textAnchor="middle" fontFamily="Verdana,Geneva,DejaVu Sans,sans-serif" fontSize="11">
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
    <div className="flex items-stretch overflow-hidden rounded-md border border-gray-200 bg-paper dark:border-gray-800 dark:bg-gray-950">
      <code
        tabIndex={0}
        aria-label="Badge Markdown"
        className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-3 py-2.5 font-mono text-[13px] text-gray-800 dark:text-gray-200"
      >
        {text}
      </code>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 border-l border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900 dark:active:bg-gray-800"
        aria-live="polite"
      >
        {copied ? <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

/** "How a score goes up", drawn as a git log with a branch for the fixes. */
const ScoreLog: React.FC = () => {
  const node = 'relative z-10 mt-[7px] h-3 w-3 shrink-0 rounded-full border-2 border-gray-950 bg-gray-50 dark:border-white dark:bg-gray-950';
  return (
    <ol className="relative">
      {/* trunk */}
      <span aria-hidden="true" className="absolute bottom-3 left-[5px] top-3 w-0.5 bg-gray-300 dark:bg-gray-700" />

      <li className="flex gap-5 pb-10">
        <span className={node} aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-gray-950 dark:text-white">Sign in with GitHub</h3>
          <p className="mt-1 max-w-xl text-gray-600 dark:text-gray-400">
            GitVanta reads your profile, repositories and commits. It never pushes, comments or changes settings.
          </p>
        </div>
      </li>

      <li className="flex gap-5 pb-10">
        <span className={node} aria-hidden="true" />
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-lg font-semibold text-gray-950 dark:text-white">Run an analysis</h3>
            <span className="font-display text-lg text-gray-950 dark:text-white">66</span>
          </div>
          <p className="mt-1 max-w-xl text-gray-600 dark:text-gray-400">
            Your 30 most recently updated repos are inspected, along with your own commits in the 10 most recently pushed.
            It usually takes under a minute.
          </p>
        </div>
      </li>

      {/* fixes you make in your own repos: amber commits on the same line */}
      <li className="pb-10">
        <div className="flex gap-5">
          <span className={node} aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-950 dark:text-white">Make the fixes it ranks highest</h3>
        </div>
        <ul className="mt-3 max-w-xl space-y-2.5 font-mono text-[13px] sm:text-sm">
          {FIXES.map(([verb, repo, gain]) => (
            <li key={repo} className="flex items-start gap-[22px]">
              <span aria-hidden="true" className="relative z-10 ml-[2px] mt-[6px] h-2 w-2 shrink-0 rounded-full bg-gain-500" />
              <span className="min-w-0 flex-1 text-gray-700 dark:text-gray-300">
                {verb} <span className="text-gray-950 dark:text-white">{repo}</span>
              </span>
              <span className="font-semibold text-gain-700 dark:text-gain-400">{gain}</span>
            </li>
          ))}
        </ul>
      </li>

      <li className="flex gap-5 pb-10">
        <span className={node} aria-hidden="true" />
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-lg font-semibold text-gray-950 dark:text-white">Analyse again</h3>
            <span className="font-display text-lg text-gray-950 dark:text-white">69</span>
            <span className="text-sm font-semibold text-gain-700 dark:text-gain-400">up 3</span>
          </div>
          <p className="mt-1 max-w-xl text-gray-600 dark:text-gray-400">
            Each run is kept, so your dashboard charts the change over time.
          </p>
        </div>
      </li>

      <li className="flex gap-5">
        <span className={clsx(node, 'border-primary-600 bg-primary-600 dark:border-primary-400 dark:bg-primary-400')} aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-gray-950 dark:text-white">Share it</h3>
          <p className="mt-1 max-w-xl text-gray-600 dark:text-gray-400">
            Put your profile link on your resume and the live badge in your README.
          </p>
        </div>
      </li>
    </ol>
  );
};

/** A small rendering of a public profile. */
const ProfilePreview: React.FC = () => (
  <figure
    aria-label="Example public profile"
    className="overflow-hidden rounded-lg border border-gray-200 bg-paper dark:border-gray-800 dark:bg-gray-900"
  >
    <div className="flex items-center gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
      <div className="grid h-12 w-12 shrink-0 grid-cols-3 gap-[2px] rounded-md bg-gray-100 p-1.5 dark:bg-gray-800" aria-hidden="true">
        {[1, 0, 1, 0, 1, 0, 1, 1, 1].map((on, i) => (
          <span key={i} className={on ? 'rounded-[2px] bg-heat-3' : ''} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-950 dark:text-white">Priya Raman</p>
        <p className="truncate text-sm text-gray-600 dark:text-gray-400">Backend developer, Go and Postgres</p>
      </div>
      <p className="font-display text-4xl text-gray-950 dark:text-white">
        66<span className="sr-only"> out of 100</span>
      </p>
    </div>
    <div className="p-5">
      <ScoreFormula parts={EXAMPLE} size="sm" />
    </div>
    <ul className="divide-y divide-gray-200 border-t border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
      {[
        { name: 'weather-cli', lang: 'Go', text: 'Forecasts in your terminal, cached offline.', link: true },
        { name: 'todo-api', lang: 'Go', text: 'REST API with Postgres and JWT auth.', link: true },
        { name: 'billing-service', lang: 'Go', text: 'Private client project, shown without a link.', link: false },
      ].map((r) => (
        <li key={r.name} className="flex items-start gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className={clsx('font-medium', r.link ? 'text-gray-950 underline decoration-gray-300 underline-offset-4 dark:text-white dark:decoration-gray-600' : 'text-gray-900 dark:text-gray-100')}>
              {r.name}
              {!r.link && <Lock className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px text-gray-500" aria-label="Private" />}
            </p>
            <p className="truncate text-gray-600 dark:text-gray-400">{r.text}</p>
          </div>
          <span className="shrink-0 text-gray-500 dark:text-gray-400">{r.lang}</span>
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

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-dvh overflow-x-clip bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-paper focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-gray-900"
      >
        Skip to content
      </a>

      <header className="dark sticky top-0 z-50 border-b border-gray-800/70 bg-gray-950/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-gray-600 md:flex dark:text-gray-400">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="transition-colors hover:text-gray-950 dark:hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-md px-3 text-sm font-semibold text-gray-900 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-gray-200/60 active:scale-[0.97] pointer-coarse:h-11 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------------------------------------------------- Hero */}
        <div className="dark bg-gray-950 pb-16 sm:pb-24">
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <h1 className="font-display text-[3rem] leading-[0.95] text-gray-950 sm:text-[4.5rem] lg:col-span-7 lg:text-[5.75rem] dark:text-white">
              Your GitHub, scored out of 100.
            </h1>
            <div className="lg:col-span-5 lg:pb-2">
              <p className="max-w-md text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                GitVanta reads your repositories and commits, scores six categories, and tells you which fixes raise the
                number most.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                <SignInButton />
                <a
                  href="#scoring"
                  className="text-[15px] font-semibold text-gray-900 underline decoration-gray-300 underline-offset-[6px] hover:decoration-gray-900 dark:text-gray-100 dark:decoration-gray-600 dark:hover:decoration-gray-100"
                >
                  See how it’s scored
                </a>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-16">
            <p className="sr-only">An example contribution graph with the score 66 drawn into it.</p>
            <HeatGrid value="66" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                Less
                {[0, 1, 2, 3, 4].map((l) => (
                  <span key={l} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: `var(--heat-${l})` }} />
                ))}
                More
              </span>
              <span>Example portfolio: 30 repos, 412 commits in the last year</span>
            </div>
          </div>
        </section>
        </div>

        {/* --------------------------------------------- Every point explained */}
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8" aria-labelledby="explained">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading id="explained">Every point comes with a reason.</SectionHeading>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                Open any category to see the metrics behind it, what you scored on each, and what would raise it.
              </p>
              <p className="mt-4 max-w-md leading-relaxed text-gray-600 dark:text-gray-400">
                Suggested fixes are tested before you see them: GitVanta re-runs the scoring with each fix applied, so the
                gain next to it is the real one.
              </p>
            </div>

            <figure
              aria-label="Example category breakdown"
              className="overflow-hidden rounded-lg border border-gray-200 bg-paper lg:col-span-7 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-end justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6 dark:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-950 dark:text-white">Documentation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Counts for 20% of the overall score</p>
                </div>
                <p className="font-display text-3xl text-gray-950 dark:text-white">
                  61<span className="text-base font-semibold text-gray-500 dark:text-gray-400">/100</span>
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Documentation metrics</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Points</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {DOC_METRICS.map((m) => (
                    <tr key={m.name}>
                      <th scope="row" className="py-3 pl-5 pr-3 font-medium text-gray-900 sm:pl-6 dark:text-gray-100">
                        {m.name}
                        <span className="mt-0.5 block font-normal text-gray-600 sm:hidden dark:text-gray-400">{m.note}</span>
                      </th>
                      <td className="w-28 px-3 py-3 sm:w-40">
                        <div className="flex items-center gap-2.5">
                          <span className="w-11 shrink-0 tabular-nums text-gray-900 dark:text-gray-100">
                            {m.got}/{m.max}
                          </span>
                          <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-heat-0 sm:block" aria-hidden="true">
                            <span className="block h-full bg-heat-3" style={{ width: `${(m.got / m.max) * 100}%` }} />
                          </span>
                        </div>
                      </td>
                      <td className="hidden py-3 pl-3 pr-6 text-gray-600 sm:table-cell dark:text-gray-400">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-gray-200 bg-gain-50/60 px-5 py-4 sm:px-6 dark:border-gray-800 dark:bg-gain-500/[0.06]">
                <p className="text-sm font-semibold text-gray-950 dark:text-white">Three fixes worth 2.4 points</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {FIXES.map(([verb, repo, gain]) => (
                    <li key={repo} className="flex items-baseline gap-3">
                      <span className="min-w-0 flex-1 text-gray-700 dark:text-gray-300">
                        {verb} <span className="font-mono text-[13px] text-gray-950 dark:text-white">{repo}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-gain-700 dark:text-gain-400">{gain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </figure>
          </div>
        </section>

        {/* ------------------------------------------------------- Scoring */}
        <section id="scoring" className="dark mt-24 scroll-mt-20 bg-gray-950 py-20 sm:mt-32 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <SectionHeading className="lg:col-span-7">Six categories, one weighted score.</SectionHeading>
              <p className="max-w-md leading-relaxed text-gray-600 lg:col-span-5 dark:text-gray-400">
                Each category is scored from 0 to 100 and counts for a fixed share of the total. In the bar, a segment’s width is
                its weight and the filled part is the score, so the filled area is your overall number.
              </p>
            </div>

            <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
              <p className="font-display shrink-0 text-[4.5rem] leading-[0.8] text-gray-950 md:text-[5.5rem] dark:text-white">
                66<span className="sr-only"> out of 100 equals</span>
              </p>
              <ScoreFormula parts={EXAMPLE} className="min-w-0 flex-1 md:pt-1" />
            </div>

            <div className="mt-16 grid gap-x-8 gap-y-10 border-t border-gray-200 pt-10 sm:grid-cols-2 lg:grid-cols-3 dark:border-gray-800">
              {METRICS.map((m) => (
                <div key={m.category}>
                  <h3 className="font-semibold text-gray-950 dark:text-white">{m.category}</h3>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    {m.items.map(([name, pts]) => (
                      <div key={name} className="flex items-baseline gap-2">
                        <dt className="text-gray-600 dark:text-gray-400">{name}</dt>
                        <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-gray-300 dark:border-gray-700" />
                        <dd className="tabular-nums text-gray-900 dark:text-gray-100">{pts}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">
              Points available per metric. Each category totals 100.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading>How a score goes up.</SectionHeading>
              <p className="mt-5 max-w-sm leading-relaxed text-gray-600 dark:text-gray-400">
                The fixes happen in your own repositories. GitVanta only reads them and tells you what changed.
              </p>
            </div>
            <div className="lg:col-span-8">
              <ScoreLog />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- Sharing */}
        <section id="sharing" className="scroll-mt-20 border-y border-gray-200 bg-paper py-20 sm:py-24 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
            <div className="min-w-0 lg:col-span-5">
              <SectionHeading>A profile worth linking to.</SectionHeading>
              <p className="mt-5 max-w-md leading-relaxed text-gray-600 dark:text-gray-400">
                Your public page shows your score, skills, badges and the projects you pick. Hide any repo. Private repos stay
                off it unless you list them, and even then they appear without a link.
              </p>

              <h3 className="mt-10 font-semibold text-gray-950 dark:text-white">A badge for your README</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">It updates after every analysis.</p>
              <div className="mt-4">
                <BadgePreview />
              </div>
              <div className="mt-3">
                <CopySnippet text={`![GitVanta score](${badgeBase()}/badge/your-username.svg)`} />
              </div>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <ProfilePreview />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- AI */}
        <section id="ai" className="dark scroll-mt-20 bg-gray-950 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SectionHeading>AI help, on our key or yours.</SectionHeading>
              <p className="mt-5 max-w-lg leading-relaxed text-gray-700 dark:text-gray-300">
                Rewrite a README, draft resume bullets from a repo, get a portfolio summary and a roadmap, or have every
                repo rated in one pass. It runs on GitVanta’s key by default. Add your own and it runs on that instead.
              </p>
              <p className="font-display mt-10 text-2xl leading-snug text-gray-500 sm:text-[1.9rem] dark:text-gray-500">
                {PROVIDERS.map((p, i) => (
                  <React.Fragment key={p}>
                    <span className="text-gray-950 dark:text-white">{p}</span>
                    {i < PROVIDERS.length - 1 ? ' / ' : ''}
                  </React.Fragment>
                ))}
                <span className="text-gray-500 dark:text-gray-400"> / any OpenAI-compatible URL</span>
              </p>
            </div>
            <dl className="grid content-start gap-8 border-gray-200 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-1 lg:border-l lg:pl-12 dark:border-gray-800">
              <div>
                <dt className="font-semibold text-gray-950 dark:text-white">Encrypted at rest</dt>
                <dd className="mt-1 text-gray-600 dark:text-gray-400">AES-256-GCM, bound to your account.</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-950 dark:text-white">Never shown in full</dt>
                <dd className="mt-1 text-gray-600 dark:text-gray-400">
                  After saving you see <span className="font-mono text-sm text-gray-900 dark:text-gray-100">sk-…a1b2</span>. Change or delete it any time.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-950 dark:text-white">Ten times the limit</dt>
                <dd className="mt-1 text-gray-600 dark:text-gray-400">500 AI requests an hour on your own key, instead of 50.</dd>
              </div>
            </dl>
          </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-gray-200 py-20 sm:py-24 dark:border-gray-800">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <SectionHeading className="lg:col-span-4">Questions.</SectionHeading>
            <div className="divide-y divide-gray-200 border-y border-gray-200 lg:col-span-8 dark:divide-gray-800 dark:border-gray-800">
              {FAQS.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold text-gray-950 marker:hidden dark:text-white [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="relative h-3.5 w-3.5 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-200 after:ease-[var(--ease-out)] group-open:after:scale-y-0"
                    />
                  </summary>
                  <p className="max-w-2xl animate-fade-in pb-6 leading-relaxed text-gray-600 dark:text-gray-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Closing */}
        <section className="dark bg-gray-950 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div>
              <h2 className="font-display text-[3rem] leading-[0.92] sm:text-[4.5rem]">What’s your number?</h2>
              <p className="mt-5 max-w-md text-lg text-gray-300">
                Sign in, run one analysis, and get your first three fixes in about a minute.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex h-12 shrink-0 items-center gap-2.5 self-start rounded-md bg-primary-400 px-5 text-[15px] font-semibold text-gray-950 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primary-300 active:scale-[0.97] lg:self-auto"
            >
              <Github className="h-[18px] w-[18px]" aria-hidden="true" />
              Sign in with GitHub
            </Link>
          </div>
        </section>
      </main>

      <footer className="dark border-t border-gray-800 bg-gray-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <p className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()}. Not affiliated with GitHub, Inc.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#scoring" className="hover:text-gray-950 dark:hover:text-white">Scoring</a></li>
              <li><a href="#faq" className="hover:text-gray-950 dark:hover:text-white">Privacy and data</a></li>
              <li><Link to="/login" className="hover:text-gray-950 dark:hover:text-white">Sign in</Link></li>
              <li>
                <a href="https://github.com/tezivindh/gitvanta" target="_blank" rel="noreferrer" className="hover:text-gray-950 dark:hover:text-white">
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
