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
import { AIAttribution, Button, ErrorState, LoadingRegion, PageHeader, Skeleton } from '../../components/ui';
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

const linkClass =
  'font-medium text-ink underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent hover:decoration-accent';

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
      return [
        section('Next 1 to 2 weeks', r.data.shortTerm),
        section('Next 1 to 2 months', r.data.mediumTerm),
        section('Next 3 to 6 months', r.data.longTerm),
      ]
        .filter(Boolean)
        .join('\n\n');
    }
  }
}

const Chips: React.FC<{ items?: string[] }> = ({ items }) =>
  items && items.length > 0 ? (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li key={s} className="rounded-chip border border-rule bg-paper-2 px-2 py-0.5 text-xs text-ink-2">
          {s}
        </li>
      ))}
    </ul>
  ) : null;

const ResultView: React.FC<{ result: Result }> = ({ result }) => {
  switch (result.kind) {
    case 'readme':
      return (
        <div className="space-y-5">
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">
            {result.data.enhancedContent}
          </pre>
          {result.data.suggestions?.length > 0 && (
            <div className="border-t border-rule pt-4">
              <h3 className="max-w-none text-sm font-medium text-ink">Also worth doing</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm marker:text-muted">
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
          <ul className="list-disc space-y-2 pl-5 text-ink marker:text-muted">
            {result.data.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {result.data.impact && <p className="text-sm text-muted">{result.data.impact}</p>}
          <Chips items={result.data.skills} />
        </div>
      );
    case 'summary':
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium tracking-[-0.01em] text-ink">{result.data.headline}</p>
          <p className="max-w-[68ch]">{result.data.summary}</p>
          {result.data.highlights?.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm marker:text-muted">
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
        ['Next 1 to 2 weeks', result.data.shortTerm],
        ['Next 1 to 2 months', result.data.mediumTerm],
        ['Next 3 to 6 months', result.data.longTerm],
      ];
      return (
        <div className="grid gap-6 lg:grid-cols-3">
          {groups.map(([label, items]) => (
            <div key={label}>
              <h3 className="max-w-none text-sm font-medium text-ink">{label}</h3>
              <ul className="mt-2 divide-y divide-rule border-t border-rule">
                {(items ?? []).map((i) => (
                  <li key={i.title} className="py-3">
                    <p className="font-medium text-ink">{i.title}</p>
                    <p className="mt-1 text-sm">{i.description}</p>
                    <p className="mt-1.5 text-xs text-muted">
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
        <div className="space-y-4">
          {header}

          {status && !status.available && (
            <div className="flex flex-col gap-3 rounded-card border border-rule-2 bg-paper-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink">{status.message}</p>
              <Link to="/dashboard/settings#ai-provider" className={clsx('inline-flex items-center gap-1.5 text-sm', linkClass)}>
                <KeyRound className="h-4 w-4" aria-hidden="true" /> Add an API key
              </Link>
            </div>
          )}
          {status?.available && (
            <p className="text-sm text-muted">
              {status.message}{' '}
              <Link to="/dashboard/settings#ai-provider" className={linkClass}>
                Change
              </Link>
            </p>
          )}

          {/* The generator, as one form: what to write, from which repository, then go. */}
          <div className="card">
            <div className="border-b border-rule p-4 sm:p-5">
              <p className="text-sm font-medium text-ink">
                What to write
              </p>
              <div
                role="radiogroup"
                aria-label="AI tool"
                className="mt-2.5 grid grid-cols-1 gap-px overflow-hidden rounded-pill border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4"
              >
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
                      'relative flex items-start gap-3 p-3 text-left transition-colors duration-[120ms] ease-out',
                      tool === t.type ? 'bg-accent-soft' : 'bg-paper-2 hover:bg-paper-3'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                        tool === t.type ? 'border-accent' : 'border-rule-2'
                      )}
                    >
                      {tool === t.type && <span className="size-2 rounded-full bg-accent" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        <t.icon className="h-4 w-4 text-muted" />
                        {t.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{t.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
              {current.needsRepo ? (
                <div className="min-w-0 flex-1">
                  <label htmlFor={selectId} className="block text-sm font-medium text-ink">
                    Repository
                  </label>
                  <select
                    id={selectId}
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="input mt-1.5 h-9 px-3 text-sm sm:max-w-md pointer-coarse:h-11"
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
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      This private repository’s README is sent to the AI provider to generate the result.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-2">
                  Uses your latest analysis: score <span className="measured text-ink">{analysis.overallScore}</span>,{' '}
                  <span className="measured text-ink">{analysis.skills.length}</span> skills and{' '}
                  <span className="measured text-ink">{analysis.weaknesses.length}</span> areas to improve.
                </p>
              )}
              <Button
                onClick={generate}
                isLoading={loading}
                disabled={current.needsRepo && !repo}
                leftIcon={<Sparkles className="h-4 w-4" />}
                className="shrink-0 self-start sm:self-auto"
              >
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="card p-5">
              <LoadingRegion label="Generating with AI" className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <p className="pt-2 text-sm text-muted">This can take up to a minute for long READMEs.</p>
              </LoadingRegion>
            </div>
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
                    className="inline-flex h-8 items-center rounded-pill border border-rule-2 px-3 text-sm font-medium text-ink transition-colors duration-[120ms] ease-out hover:border-muted hover:bg-paper-2"
                  >
                    Open AI settings
                  </Link>
                ) : undefined
              }
            />
          )}

          {result && !loading && (
            <section aria-labelledby="ai-result-title">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 id="ai-result-title" className="max-w-none text-md font-medium tracking-[-0.01em] text-ink">
                  {current.title}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copy}
                  leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              {/* What an instrument wrote: the deepest step. */}
              <div className="prose-gv rounded-card border border-rule bg-paper-3 p-4 sm:p-5">
                <ResultView result={result} />
              </div>
              <AIAttribution ai={ai} className="mt-2" />
            </section>
          )}
        </div>
      )}
    </AnalysisGate>
  );
};

export default EnhancementsPage;
