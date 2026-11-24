import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, PageHeader } from '../../components/ui';
import { CategoryRadarChart } from '../../components/charts';
import AnalysisGate from '../../components/AnalysisGate';
import { CATEGORIES, contribution, toCategoryArray } from '../../lib/scoring';
import { BreakdownItem } from '../../types';

const MetricRow: React.FC<{ item: BreakdownItem }> = ({ item }) => {
  const pct = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-gray-900 dark:text-white">{item.metric}</span>
        <span className="shrink-0 tabular-nums text-gray-600 dark:text-gray-400">
          {item.score} / {item.maxScore}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-label={item.metric}
        aria-valuenow={item.score}
        aria-valuemin={0}
        aria-valuemax={item.maxScore}
      >
        <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
      {item.suggestion && (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-800 dark:text-gray-200">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gain-600 dark:text-gain-400" aria-hidden="true" />
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
        <div className="space-y-6">
          <PageHeader
            title="Score breakdown"
            description="Exactly how your score was calculated, from each metric up to the 0–100 total."
          />

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">From categories to your score</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Each category's score is multiplied by its weight. The results add up to your overall score.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[22rem] text-left text-sm">
                  <caption className="sr-only">Category scores, weights and points</caption>
                  <thead className="text-gray-500 dark:text-gray-400">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th scope="col" className="py-2 font-medium">Category</th>
                      <th scope="col" className="py-2 text-right font-medium">Score</th>
                      <th scope="col" className="py-2 text-right font-medium">Weight</th>
                      <th scope="col" className="py-2 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-gray-800 dark:text-gray-200">
                    {CATEGORIES.map((c) => (
                      <tr key={c.key} className="border-b border-gray-100 dark:border-gray-800/60">
                        <th scope="row" className="py-2 font-normal">
                          <a href={`#cat-${c.key}`} className="hover:underline">
                            {c.label}
                          </a>
                        </th>
                        <td className="py-2 text-right">{a.categoryScores[c.key]}</td>
                        <td className="py-2 text-right">× {Math.round(c.weight * 100)}%</td>
                        <td className="py-2 text-right">{contribution(a.categoryScores[c.key], c.weight)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900 dark:text-white">
                      <th scope="row" className="pt-3">Overall score</th>
                      <td colSpan={2} className="pt-3 text-right text-xs font-normal text-gray-500 dark:text-gray-400">
                        {Math.round(total * 10) / 10}, rounded
                      </td>
                      <td className="pt-3 text-right tabular-nums">{a.overallScore}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shape of your profile</h2>
              <CategoryRadarChart categoryScores={toCategoryArray(a.categoryScores)} height={280} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {CATEGORIES.map((c) => {
              const items = a.detailedBreakdown?.[c.key] ?? [];
              return (
                <Card key={c.key}>
                  <section id={`cat-${c.key}`} aria-labelledby={`cat-${c.key}-title`} className="scroll-mt-24">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 id={`cat-${c.key}-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
                        {c.label}
                      </h2>
                      <span className="tabular-nums text-sm text-gray-600 dark:text-gray-400">
                        {a.categoryScores[c.key]} / 100
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{c.measures}</p>
                    <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((item) => (
                        <MetricRow key={item.metric} item={item} />
                      ))}
                    </ul>
                  </section>
                </Card>
              );
            })}
          </div>

          {a.improvements.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Where to focus next</h2>
              <ol className="mt-4 space-y-4">
                {[...a.improvements]
                  .sort((x, y) => y.priority - x.priority)
                  .slice(0, 5)
                  .map((imp) => (
                    <li key={imp.title}>
                      <p className="font-medium text-gray-900 dark:text-white">{imp.title}</p>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{imp.description}</p>
                      {imp.actionItems?.length > 0 && (
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-gray-700 dark:text-gray-300">
                          {imp.actionItems.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ol>
            </Card>
          )}
        </div>
      );
    }}
  </AnalysisGate>
);

export default AnalyticsPage;
