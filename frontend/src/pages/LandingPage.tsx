import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Github,
  Gauge,
  ListChecks,
  Award,
  LineChart,
  FileText,
  KeyRound,
  Share2,
  EyeOff,
  BadgeCheck,
  FileDown,
  GitCompare,
  Brain,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Logo, ThemeToggle } from '../components/ui';

const CATEGORIES = [
  { name: 'Code quality', weight: 25, measures: 'Portfolio size, language range, tests, and how descriptive your commit messages are' },
  { name: 'Documentation', weight: 20, measures: 'README coverage and depth, licenses, contributing guides' },
  { name: 'Activity', weight: 20, measures: 'Recent pushes, consistency, how many repos are still maintained' },
  { name: 'Diversity', weight: 15, measures: 'Languages, topics and kinds of projects you build' },
  { name: 'Community', weight: 10, measures: 'Stars, forks and followers' },
  { name: 'Professionalism', weight: 10, measures: 'Bio, website, profile README and linked social accounts' },
];

const EXAMPLE_SCORES = [78, 61, 70, 66, 34, 72];

const FEATURE_GROUPS = [
  {
    title: 'See where you stand',
    items: [
      { icon: Gauge, name: 'A score you can audit', text: 'Every point traces back to a metric, with the value that earned it.' },
      { icon: Brain, name: 'Skills from your code', text: 'Languages, frameworks, databases and tools, with a proficiency level for each.' },
      { icon: Award, name: '19 badges', text: 'From Polyglot to Documentation Hero, each with a clear rule for earning it.' },
      { icon: LineChart, name: 'Progress over time', text: 'Every analysis is kept, so you can see your score move.' },
    ],
  },
  {
    title: 'Know what to fix',
    items: [
      { icon: ListChecks, name: 'Fixes ranked by points', text: 'The three changes that raise your score most, with the gain for each.' },
      { icon: FileText, name: 'AI writing help', text: 'README rewrites, resume bullets, a portfolio summary and a growth roadmap.' },
      { icon: KeyRound, name: 'Your own AI key, if you like', text: 'OpenAI, Anthropic, Gemini, Groq, OpenRouter or any OpenAI-compatible server.' },
      { icon: GitCompare, name: 'Compare with anyone', text: 'Score any public GitHub account with the same engine, category by category.' },
    ],
  },
  {
    title: 'Show your best work',
    items: [
      { icon: Share2, name: 'A public profile link', text: 'One page with your score, skills, badges and projects, ready for a resume.' },
      { icon: EyeOff, name: 'You choose the repos', text: 'Hide any project. Private repos stay hidden unless you decide to list them.' },
      { icon: BadgeCheck, name: 'A badge for your README', text: 'A live score badge that updates after each analysis.' },
      { icon: FileDown, name: 'PDF and JSON exports', text: 'A printable report for applications, or the raw data for your own tools.' },
    ],
  },
];

const STEPS = [
  {
    title: 'Sign in with GitHub',
    text: 'GitVanta reads your profile and repositories. Nothing is posted or changed on GitHub.',
  },
  {
    title: 'Run an analysis',
    text: 'It inspects your 30 most recently updated repositories in detail and scores all six categories, usually in under a minute.',
  },
  {
    title: 'Fix, re-run, share',
    text: 'Work through the suggested fixes, analyse again to see the change, then share your profile link or badge.',
  },
];

const FAQS = [
  {
    q: 'Is GitVanta free?',
    a: 'Yes. You can run three analyses a day. AI features use a shared key with an hourly limit, or your own key with a much higher one.',
  },
  {
    q: 'Why does it ask for access to my repositories?',
    a: 'To score private projects, GitHub requires the "repo" permission, which is broader than GitVanta needs. GitVanta only reads: it never pushes code, opens issues or changes settings. You can revoke access at any time from GitHub settings, or by deleting your GitVanta account.',
  },
  {
    q: 'Will my private repositories appear on my public profile?',
    a: 'No. Private repos count towards your score but are never shown publicly unless you turn them on one by one in Settings. Even then, visitors see the name and description only, with no link.',
  },
  {
    q: 'Which AI model writes the suggestions?',
    a: 'By default, the model configured by the GitVanta server. In Settings you can use your own OpenAI, Anthropic, Gemini, Groq or OpenRouter key, or any OpenAI-compatible server. Keys are encrypted (AES-256-GCM) and never shown again in full. Each AI result says which provider and model wrote it.',
  },
  {
    q: 'How is the score calculated?',
    a: 'Six categories are each scored from 0 to 100, then weighted: code quality 25%, documentation 20%, activity 20%, diversity 15%, community 10% and professionalism 10%. Your dashboard shows every metric behind each category.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes. Settings → Account lets you download everything GitVanta stores about you as JSON, sign out of every device, or delete your account and all of its data.',
  },
];

/** The hero's product preview: an example report rendered as a diff. */
const ReportPreview: React.FC = () => (
  <figure
    aria-label="Example GitVanta report"
    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_60px_-30px_rgba(15,27,45,0.35)] dark:border-gray-800 dark:bg-gray-900"
  >
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Github className="h-4 w-4" aria-hidden="true" />
        <span>Example report</span>
      </div>
      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
        Score 66 of 100
      </span>
    </div>

    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-5 sm:grid-cols-2">
      {CATEGORIES.map((c, i) => (
        <div key={c.name}>
          <div className="flex items-baseline justify-between text-sm">
            <dt className="text-gray-700 dark:text-gray-300">{c.name}</dt>
            <dd className="tabular-nums text-gray-500 dark:text-gray-400">{EXAMPLE_SCORES[i]}</dd>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${EXAMPLE_SCORES[i]}%` }} />
          </div>
        </div>
      ))}
    </dl>

    <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/60">
      <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Fix these three to gain 2.4 points</p>
      <ul className="space-y-1 font-mono text-[13px] leading-6">
        {[
          ['Add LICENSE to weather-cli', '+0.9'],
          ['Add tests to todo-api', '+0.9'],
          ['Expand README in portfolio-site', '+0.6'],
        ].map(([line, gain]) => (
          <li key={line} className="flex items-center gap-3 rounded-md bg-primary-50/70 px-2 dark:bg-primary-950/40">
            <span className="text-primary-600 dark:text-primary-400" aria-hidden="true">+</span>
            <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{line}</span>
            <span className="tabular-nums text-gain-600 dark:text-gain-400">{gain}</span>
          </li>
        ))}
      </ul>
    </div>
  </figure>
);

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const signIn = (
    <Link
      to="/login"
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:text-gray-950 dark:hover:bg-primary-400"
    >
      <Github className="h-4 w-4" aria-hidden="true" />
      Sign in with GitHub
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-gray-900"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-gray-50/85 backdrop-blur dark:border-gray-800/80 dark:bg-gray-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-gray-600 md:flex dark:text-gray-400">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a>
            <a href="#scoring" className="hover:text-gray-900 dark:hover:text-white">Scoring</a>
            <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-white">How it works</a>
            <a href="#faq" className="hover:text-gray-900 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Your GitHub, scored and explained.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              GitVanta rates your portfolio from 0 to 100 across six categories, shows the metric behind every point, and
              tells you which fixes will raise it most.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {signIn}
              <a
                href="#scoring"
                className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-800 hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                How scoring works
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Free to use. Private repositories are never shown publicly unless you choose to list them.
            </p>
          </div>
          <ReportPreview />
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Everything you need to understand, improve and share your GitHub profile
            </h2>
            <div className="mt-12 grid gap-12 lg:grid-cols-3 lg:gap-10">
              {FEATURE_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="border-b border-gray-200 pb-3 text-lg font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                    {group.title}
                  </h3>
                  <ul className="mt-5 space-y-5">
                    {group.items.map((item) => (
                      <li key={item.name} className="flex gap-3">
                        <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scoring */}
        <section id="scoring" className="scroll-mt-20 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">What the score measures</h2>
              <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                Each category is scored from 0 to 100, then weighted into your overall score. Nothing is hidden: the
                dashboard lists every metric, its value, and what would raise it.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Score categories and their weights</caption>
                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-950/60 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Category</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">What counts</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {CATEGORIES.map((c) => (
                    <tr key={c.name}>
                      <th scope="row" className="px-4 py-3 align-top font-medium text-gray-900 dark:text-white">
                        {c.name}
                        <span className="mt-1 block font-normal text-gray-600 sm:hidden dark:text-gray-400">{c.measures}</span>
                      </th>
                      <td className="hidden px-4 py-3 text-gray-600 sm:table-cell dark:text-gray-400">{c.measures}</td>
                      <td className="px-4 py-3 text-right align-top tabular-nums text-gray-900 dark:text-white">{c.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">How it works</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-sm font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-gray-600 dark:text-gray-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Questions</h2>
            <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium text-gray-900 marker:hidden dark:text-white [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      className="text-xl leading-none text-gray-400 transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl bg-gray-900 px-6 py-10 sm:px-10 md:flex-row md:items-center dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
            <div>
              <h2 className="text-2xl font-semibold text-white">See your score in about a minute</h2>
              <p className="mt-2 text-gray-300">Sign in, run one analysis, and get your first three fixes.</p>
            </div>
            {signIn}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12 dark:border-gray-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              GitHub portfolio scoring for developers who want their work to speak for them.
            </p>
          </div>
          <nav aria-label="Product">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
              <li><a href="#scoring" className="hover:text-gray-900 dark:hover:text-white">Scoring</a></li>
              <li><a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-white">How it works</a></li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Account</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-white">Sign in</Link></li>
              <li><a href="#faq" className="hover:text-gray-900 dark:hover:text-white">Privacy and data</a></li>
            </ul>
          </nav>
          <nav aria-label="Resources">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Resources</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#faq" className="hover:text-gray-900 dark:hover:text-white">FAQ</a></li>
              <li>
                <a href="https://github.com/tezivindh/gitvanta" target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white">
                  Source on GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-4 text-sm text-gray-500 sm:px-6 dark:text-gray-500">
          © {new Date().getFullYear()} GitVanta. Not affiliated with GitHub, Inc.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
