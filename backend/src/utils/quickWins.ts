import { calculateFullScore, CATEGORY_WEIGHTS, FullScoringInput } from './scoringEngine';
import { CategoryScores } from '../types';

export interface QuickWin {
  repo: string;
  isPrivate: boolean;
  action: 'add_readme' | 'expand_readme' | 'add_license' | 'add_tests' | 'add_contributing' | 'add_topics';
  title: string;
  detail: string;
  category: keyof CategoryScores;
  /** Overall points gained if only this fix is made (one decimal). */
  gain: number;
}

export interface QuickWinsResult {
  items: QuickWin[];
  /** Overall points gained if all listed fixes are made together. */
  totalGain: number;
}

interface RepoFacts {
  name: string;
  isPrivate: boolean;
  hasReadme: boolean;
  readmeLength: number;
  hasLicense: boolean;
  hasTests: boolean;
  hasContributing: boolean;
  topicCount: number;
}

/** Overall score before rounding, so small gains are still visible. */
function exactOverall(input: FullScoringInput): number {
  const { categoryScores } = calculateFullScore(input);
  return (Object.keys(CATEGORY_WEIGHTS) as Array<keyof CategoryScores>).reduce(
    (sum, k) => sum + categoryScores[k] * CATEGORY_WEIGHTS[k],
    0
  );
}

type Fix = { action: QuickWin['action']; category: QuickWin['category']; title: string; detail: string; apply: (input: FullScoringInput, i: number) => void };

const FIXES: Array<Fix & { applies: (r: RepoFacts) => boolean }> = [
  {
    action: 'add_readme',
    category: 'documentation',
    title: 'Add a README',
    detail: 'Explain what the project does, how to run it, and show a screenshot or example.',
    applies: (r) => !r.hasReadme,
    apply: (input, i) => {
      input.documentation.hasReadme[i] = true;
      input.documentation.readmeLength[i] = 1500;
    },
  },
  {
    action: 'expand_readme',
    category: 'documentation',
    title: 'Expand the README',
    detail: 'Add setup steps, usage examples and a features list (aim for 1,000+ characters).',
    applies: (r) => r.hasReadme && r.readmeLength < 600,
    apply: (input, i) => {
      input.documentation.readmeLength[i] = 1500;
    },
  },
  {
    action: 'add_license',
    category: 'documentation',
    title: 'Add a LICENSE',
    detail: 'Pick one at choosealicense.com (MIT is a common default) and commit it as LICENSE.',
    applies: (r) => !r.hasLicense,
    apply: (input, i) => {
      input.documentation.hasLicense[i] = true;
    },
  },
  {
    action: 'add_tests',
    category: 'codeQuality',
    title: 'Add tests',
    detail: 'Add a tests/ folder with a few unit tests for the core logic.',
    applies: (r) => !r.hasTests,
    apply: (input, i) => {
      input.codeQuality.hasTests[i] = true;
    },
  },
  {
    action: 'add_contributing',
    category: 'documentation',
    title: 'Add CONTRIBUTING.md',
    detail: 'Describe how to set up the project and how to open a pull request.',
    applies: (r) => !r.hasContributing,
    apply: (input, i) => {
      input.documentation.hasContributing[i] = true;
    },
  },
  {
    action: 'add_topics',
    category: 'diversity',
    title: 'Add topics',
    detail: 'Add 3-5 topics (language, framework, domain) in the repo\'s About settings.',
    applies: (r) => r.topicCount === 0,
    apply: (input, i) => {
      input.diversity.topics[i] = [`qw-${i}-a`, `qw-${i}-b`, `qw-${i}-c`];
    },
  },
];

/** Deep-enough copy: only the per-repo arrays that fixes mutate. */
function cloneInput(input: FullScoringInput): FullScoringInput {
  return {
    ...input,
    codeQuality: { ...input.codeQuality, hasTests: [...input.codeQuality.hasTests] },
    documentation: {
      ...input.documentation,
      hasReadme: [...input.documentation.hasReadme],
      readmeLength: [...input.documentation.readmeLength],
      hasLicense: [...input.documentation.hasLicense],
      hasContributing: [...input.documentation.hasContributing],
    },
    diversity: { ...input.diversity, topics: input.diversity.topics.map((t) => [...t]) },
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Find the fixes that raise the overall score most, by re-running the real
 * scoring engine with each fix applied. `repos[i]` must line up with index i
 * of the per-repo arrays in `input`.
 */
export function computeQuickWins(input: FullScoringInput, repos: RepoFacts[], limit = 3): QuickWinsResult {
  const base = exactOverall(input);
  const candidates: Array<QuickWin & { apply: (inp: FullScoringInput) => void }> = [];

  repos.forEach((repo, i) => {
    for (const fix of FIXES) {
      if (!fix.applies(repo)) continue;
      const trial = cloneInput(input);
      fix.apply(trial, i);
      const gain = exactOverall(trial) - base;
      if (gain >= 0.05) {
        candidates.push({
          repo: repo.name,
          isPrivate: repo.isPrivate,
          action: fix.action,
          title: fix.title,
          detail: fix.detail,
          category: fix.category,
          gain: round1(gain),
          apply: (inp) => fix.apply(inp, i),
        });
      }
    }
  });

  // Biggest gains first, but vary the kind of fix and the repo so the list
  // isn't three copies of the same advice.
  candidates.sort((a, b) => b.gain - a.gain);
  const picked: typeof candidates = [];
  const passes: Array<(c: (typeof candidates)[number]) => boolean> = [
    (c) => !picked.some((p) => p.repo === c.repo || p.action === c.action),
    (c) => !picked.some((p) => p.repo === c.repo),
    () => true,
  ];
  for (const ok of passes) {
    for (const c of candidates) {
      if (picked.length >= limit) break;
      if (!picked.includes(c) && ok(c)) picked.push(c);
    }
  }

  const combined = cloneInput(input);
  picked.forEach((c) => c.apply(combined));
  const totalGain = round1(exactOverall(combined) - base);

  return {
    items: picked.map(({ apply: _apply, ...rest }) => rest),
    totalGain,
  };
}
