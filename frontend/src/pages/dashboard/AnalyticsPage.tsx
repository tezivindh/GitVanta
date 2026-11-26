import React from 'react';
import { Lightbulb } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { CategoryRadarChart } from '../../components/charts';
import AnalysisGate from '../../components/AnalysisGate';
import { CATEGORIES, contribution, toCategoryArray } from '../../lib/scoring';
import { BreakdownItem } from '../../types';

const HEAD = 'max-w-none text-lg font-medium tracking-[-0.01em] text-ink';

const MetricRow: React.FC<{ item: BreakdownItem }> = ({ item }) => {
  const pct = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink">{item.metric}</span>
        <span className="measured shrink-0 text-ink-2">
          {item.score} / {item.maxScore}
        </span>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-[2px] bg-paper-3"
        role="progressbar"
        aria-label={item.metric}
        aria-valuenow={item.score}
        aria-valuemin={0}
        aria-valuemax={item.maxScore}
      >
        <div className="h-full ramp-cool" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{item.description}</p>
      {item.suggestion && (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          {item.suggestion}
        </p>
      )}
    </li>
  );
};

const AnalyticsPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Score breakdown" />}>
    {(a) => {
      const total = CATEGORIES.reduce((sum, c) => sum + a.categoryScores[c.key] * c.weight, 0);
      return (
        <div className="space-y-8">
          <PageHeader
            title="Score breakdown"
            description="Exactly how your score was calculated, from each metric up to the 0 to 100 total."
          />

          <div className="panels lg:grid-cols-5">
            <section className="p-6 lg:col-span-3" aria-labelledby="formula-heading">
              <h2 id="formula-heading" className={HEAD}>From categories to your score</h2>
              <p className="mt-1 text-sm text-muted">
                Each category’s score is multiplied by its weight. The results add up to your overall score.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[22rem] text-left text-sm">
                  <caption className="sr-only">Category scores, weights and points</caption>
                  <thead className="text-muted">
                    <tr className="border-b border-rule-2">
                      <th scope="col" className="py-2 font-medium whitespace-nowrap">Category</th>
                      <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">Score</th>
                      <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">Weight</th>
                      <th scope="col" className="py-2 text-right font-medium whitespace-nowrap">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-ink-2">
                    {CATEGORIES.map((c) => (
                      <tr key={c.key} className="border-b border-rule">
                        <th scope="row" className="py-2 font-normal">
                          <a
                            href={`#cat-${c.key}`}
                            className="text-ink underline decoration-rule-2 underline-offset-4 transition-colors duration-[120ms] ease-out hover:text-accent"
                          >
                            {c.label}
                          </a>
                        </th>
                        <td className="measured py-2 text-right">{a.categoryScores[c.key]}</td>
                        <td className="measured py-2 text-right text-muted">× {Math.round(c.weight * 100)}%</td>
                        <td className="measured py-2 text-right">{contribution(a.categoryScores[c.key], c.weight)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium text-ink">
                      <th scope="row" className="pt-3">Overall score</th>
                      <td colSpan={2} className="pt-3 text-right text-xs font-normal text-muted">
                        <span className="measured">{Math.round(total * 10) / 10}</span>, rounded
                      </td>
                      <td className="measured pt-3 text-right text-xl">{a.overallScore}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="p-6 lg:col-span-2" aria-labelledby="shape-heading">
              <h2 id="shape-heading" className={HEAD}>Shape of your profile</h2>
              <CategoryRadarChart categoryScores={toCategoryArray(a.categoryScores)} height={280} />
            </section>
          </div>

          <div className="panels md:grid-cols-2">
            {CATEGORIES.map((c) => {
              const items = a.detailedBreakdown?.[c.key] ?? [];
              return (
                <section
                  key={c.key}
                  id={`cat-${c.key}`}
                  aria-labelledby={`cat-${c.key}-title`}
                  className="scroll-mt-24 p-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 id={`cat-${c.key}-title`} className={HEAD}>
                      {c.label}
                    </h2>
                    <span className="measured text-sm text-ink-2">
                      {a.categoryScores[c.key]} / 100
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{c.measures}</p>
                  <ul className="mt-2 divide-y divide-rule">
                    {items.map((item) => (
                      <MetricRow key={item.metric} item={item} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {a.improvements.length > 0 && (
            <section className="card p-6" aria-labelledby="focus-heading">
              <h2 id="focus-heading" className={HEAD}>Where to focus next</h2>
              <ol className="mt-4 divide-y divide-rule">
                {[...a.improvements]
                  .sort((x, y) => y.priority - x.priority)
                  .slice(0, 5)
                  .map((imp) => (
                    <li key={imp.title} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-ink">{imp.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{imp.description}</p>
                      {imp.actionItems?.length > 0 && (
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink-2 marker:text-muted">
                          {imp.actionItems.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ol>
            </section>
          )}
        </div>
      );
    }}
  </AnalysisGate>
);

export default AnalyticsPage;
