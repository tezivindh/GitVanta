import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Sparkles, FileText, Lightbulb, Map, Copy, Check, FileStack, Lock, KeyRound } from 'lucide-react';
import { enhancementApi } from '../../api/enhancement';
import { getApiError } from '../../api/client';
import { needsAISettings } from '../../lib/errors';
import {
  AIMeta,
  AIStatus,
  ImprovementRoadmap,
  PortfolioSummary,
  ReadmeEnhancement,
  ResumeBullet,
  RoadmapItem,
} from '../../types';
import { AIAttribution, Button, Card, ErrorState, LoadingRegion, PageHeader, Skeleton } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';

type Tool = 'readme' | 'resume' | 'summary' | 'roadmap';

type Result =
  | { kind: 'readme'; data: ReadmeEnhancement }
  | { kind: 'resume'; data: ResumeBullet }
  | { kind: 'summary'; data: PortfolioSummary }
  | { kind: 'roadmap'; data: ImprovementRoadmap };

const TOOLS: Array<{ type: Tool; icon: React.ComponentType<{ className?: string }>; title: string; description: string; needsRepo: boolean }> = [
  { type: 'readme', icon: FileText, title: 'Rewrite a README', description: 'A clearer README with setup, usage and features.', needsRepo: true },
  { type: 'resume', icon: FileStack, title: 'Resume bullets', description: 'Three or four achievement-focused bullets for one project.', needsRepo: true },
  { type: 'summary', icon: Lightbulb, title: 'Portfolio summary', description: 'A headline and short bio built from your work.', needsRepo: false },
  { type: 'roadmap', icon: Map, title: 'Improvement roadmap', description: 'Goals for the next weeks and months, based on your weak spots.', needsRepo: false },
];

/** Plain-text version of a result, for the copy button. */
function toText(r: Result): string {
  switch (r.kind) {
    case 'readme':
      return r.data.enhancedContent;
    case 'resume':
      return r.data.bullets.map((b) => `- ${b}`).join('\n');
    case 'summary':
      return [r.data.headline, '', r.data.summary, '', ...(r.data.highlights ?? []).map((h) => `- ${h}`)].join('\n');
    case 'roadmap': {
      const section = (label: string, items: RoadmapItem[] = []) =>
        items.length ? [`## ${label}`, ...items.map((i) => `- ${i.title} (${i.estimatedTime}): ${i.description}`)].join('\n') : '';
      return [section('Next 1–2 weeks', r.data.shortTerm), section('Next 1–2 months', r.data.mediumTerm), section('Next 3–6 months', r.data.longTerm)]
        .filter(Boolean)
        .join('\n\n');
    }
  }
}

const Chips: React.FC<{ items?: string[] }> = ({ items }) =>
  items && items.length > 0 ? (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {s}
        </li>
      ))}
    </ul>
  ) : null;

const ResultView: React.FC<{ result: Result }> = ({ result }) => {
  switch (result.kind) {
    case 'readme':
      return (
        <div className="space-y-4">
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-800 dark:bg-gray-950 dark:text-gray-200">
            {result.data.enhancedContent}
          </pre>
          {result.data.suggestions?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Also worth doing</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                {result.data.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    case 'resume':
      return (
        <div className="space-y-4">
          <ul className="list-disc space-y-2 pl-5 text-gray-800 dark:text-gray-200">
            {result.data.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {result.data.impact && <p className="text-sm text-gray-600 dark:text-gray-400">{result.data.impact}</p>}
          <Chips items={result.data.skills} />
        </div>
      );
    case 'summary':
      return (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.data.headline}</p>
          <p className="leading-relaxed text-gray-700 dark:text-gray-300">{result.data.summary}</p>
          {result.data.highlights?.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
              {result.data.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <Chips items={[...(result.data.technicalSkills ?? []), ...(result.data.softSkills ?? [])]} />
        </div>
      );
    case 'roadmap': {
      const groups: Array<[string, RoadmapItem[] | undefined]> = [
        ['Next 1–2 weeks', result.data.shortTerm],
        ['Next 1–2 months', result.data.mediumTerm],
        ['Next 3–6 months', result.data.longTerm],
      ];
      return (
        <div className="grid gap-6 lg:grid-cols-3">
          {groups.map(([label, items]) => (
            <div key={label}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
              <ul className="mt-3 space-y-3">
                {(items ?? []).map((i) => (
                  <li key={i.title} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">{i.title}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{i.description}</p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {i.estimatedTime}, {i.priority} priority
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
  }
};

const EnhancementsPage: React.FC = () => {
  const selectId = useId();
  const [tool, setTool] = useState<Tool>('readme');
  const [repo, setRepo] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [ai, setAI] = useState<AIMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; settings: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    enhancementApi.checkAiStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const current = TOOLS.find((t) => t.type === tool)!;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let next: Result;
      let meta: AIMeta | null;
      if (tool === 'readme') {
        const r = await enhancementApi.enhanceReadme(repo);
        next = { kind: 'readme', data: r.data };
        meta = r.ai;
      } else if (tool === 'resume') {
        const r = await enhancementApi.generateResumeBullets(repo);
        next = { kind: 'resume', data: r.data };
        meta = r.ai;
      } else if (tool === 'summary') {
        const r = await enhancementApi.generatePortfolioSummary();
        next = { kind: 'summary', data: r.data };
        meta = r.ai;
      } else {
        const r = await enhancementApi.generateImprovementRoadmap();
        next = { kind: 'roadmap', data: r.data };
        meta = r.ai;
      }
      setResult(next);
      setAI(meta);
    } catch (e) {
      const info = await getApiError(e, 'The AI request failed. Please try again.');
      setError({ message: info.message, settings: needsAISettings(info) });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(toText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const header = (
    <PageHeader title="AI writing tools" description="Let AI draft the text around your work. Review everything before you publish it." />
  );

  return (
    <AnalysisGate header={header} emptyDescription="Run an analysis first so the AI has your repositories, skills and scores to work from.">
      {(analysis) => (
        <div className="space-y-6">
          {header}

          {status && !status.available && (
            <div className="flex flex-col gap-3 rounded-xl border border-gain-300 bg-gain-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gain-700/50 dark:bg-gain-700/15">
              <p className="text-sm text-gray-800 dark:text-gray-200">{status.message}</p>
              <Link
                to="/dashboard/settings#ai-provider"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" /> Add an API key
              </Link>
            </div>
          )}
          {status?.available && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status.message}{' '}
              <Link to="/dashboard/settings#ai-provider" className="font-medium text-primary-700 hover:underline dark:text-primary-400">
                Change
              </Link>
            </p>
          )}

          <div role="radiogroup" aria-label="AI tool" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <button
                key={t.type}
                type="button"
                role="radio"
                aria-checked={tool === t.type}
                onClick={() => {
                  setTool(t.type);
                  setResult(null);
                  setError(null);
                }}
                className={clsx(
                  'rounded-xl border p-4 text-left transition-colors',
                  tool === t.type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
                )}
              >
                <t.icon
                  className={clsx('mb-2 h-5 w-5', tool === t.type ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')}
                />
                <span className="block font-medium text-gray-900 dark:text-white">{t.title}</span>
                <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">{t.description}</span>
              </button>
            ))}
          </div>

          <Card>
            {current.needsRepo ? (
              <div>
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-900 dark:text-white">
                  Repository
                </label>
                <select
                  id={selectId}
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="input mt-1.5 h-10 px-3 text-sm sm:max-w-md"
                >
                  <option value="">Choose a repository</option>
                  {analysis.repositories.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                      {r.isPrivate ? ' (private)' : ''}
                    </option>
                  ))}
                </select>
                {analysis.repositories.find((r) => r.name === repo)?.isPrivate && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    This private repository's README is sent to the AI provider to generate the result.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Uses your latest analysis: score {analysis.overallScore}, {analysis.skills.length} skills and{' '}
                {analysis.weaknesses.length} areas to improve.
              </p>
            )}
            <div className="mt-5">
              <Button
                onClick={generate}
                isLoading={loading}
                disabled={current.needsRepo && !repo}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </Card>

          {loading && (
            <Card>
              <LoadingRegion label="Generating with AI" className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <p className="pt-2 text-sm text-gray-500 dark:text-gray-400">This can take up to a minute for long READMEs.</p>
              </LoadingRegion>
            </Card>
          )}

          {error && !loading && (
            <ErrorState
              title="Generation failed"
              message={error.message}
              onRetry={generate}
              action={
                error.settings ? (
                  <Link
                    to="/dashboard/settings#ai-provider"
                    className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                  >
                    Open AI settings
                  </Link>
                ) : undefined
              }
            />
          )}

          {result && !loading && (
            <Card>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{current.title}</h2>
                  <AIAttribution ai={ai} className="mt-1" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copy}
                  leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <ResultView result={result} />
            </Card>
          )}
        </div>
      )}
    </AnalysisGate>
  );
};

export default EnhancementsPage;
