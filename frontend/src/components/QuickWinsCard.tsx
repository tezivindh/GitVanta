import React from 'react';
import { Lock } from 'lucide-react';
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
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          {quickWins
            ? 'No single-repo fix would move your score right now. See the full breakdown for bigger changes.'
            : 'Run a new analysis to get repo-level suggestions.'}
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-gray-200 border-t border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {items.map((w) => (
            <li key={`${w.repo}-${w.action}`} className="flex items-start gap-4 py-4">
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-gain-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-950 dark:text-white">
                  {w.title} in <span className="font-mono text-[0.92em]">{w.repo}</span>
                  {w.isPrivate && (
                    <Lock className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px text-gray-500" aria-label="Private repository" />
                  )}
                </p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{w.detail}</p>
              </div>
              <span className="font-display shrink-0 text-lg text-gain-700 dark:text-gain-400">
                +{w.gain}
                <span className="sr-only"> points</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};

export default QuickWinsCard;
