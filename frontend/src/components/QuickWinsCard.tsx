import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ListChecks } from 'lucide-react';
import { QuickWins } from '../types';
import { Card } from './ui';

/** "Fix these 3 things to gain +N points", with real per-fix gains. */
const QuickWinsCard: React.FC<{ quickWins?: QuickWins; className?: string }> = ({ quickWins, className }) => {
  const items = quickWins?.items ?? [];

  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {items.length > 0
              ? `Fix ${items.length === 1 ? 'this' : `these ${items.length}`} to gain ${quickWins!.totalGain} points`
              : 'Quick wins'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gains are calculated by re-running the scoring engine with each fix applied.
          </p>
        </div>
        <ListChecks className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          {quickWins
            ? 'No single-repo fix would move your score right now. See the full breakdown for bigger changes.'
            : 'Run a new analysis to get repo-level suggestions.'}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((w) => (
            <li
              key={`${w.repo}-${w.action}`}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <span className="mt-0.5 font-mono text-sm text-primary-600 dark:text-primary-400" aria-hidden="true">
                +
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {w.title} in <span className="font-mono">{w.repo}</span>
                  {w.isPrivate && (
                    <Lock className="ml-1.5 inline h-3.5 w-3.5 text-gray-400" aria-label="Private repository" />
                  )}
                </p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{w.detail}</p>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-gain-700 dark:text-gain-400">
                +{w.gain}
                <span className="sr-only"> points</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link
        to="/dashboard/analytics"
        className="mt-4 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
      >
        See every metric behind your score
      </Link>
    </Card>
  );
};

export default QuickWinsCard;
