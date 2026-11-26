import React from 'react';
import { Lock } from 'lucide-react';
import { QuickWins } from '../types';
import { Card } from './ui';

/** "Fix these 3 things to gain +N points", with real per-fix gains, set as a fix trail. */
const QuickWinsCard: React.FC<{ quickWins?: QuickWins; className?: string }> = ({ quickWins, className }) => {
  const items = quickWins?.items ?? [];

  return (
    <Card className={className}>
      <h2 className="max-w-none text-lg font-medium tracking-[-0.01em] text-ink">
        {items.length > 0
          ? `Fix ${items.length === 1 ? 'this' : `these ${items.length}`} to gain ${quickWins!.totalGain} points`
          : 'Quick wins'}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Gains are calculated by re-running the scoring engine with each fix applied.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">
          {quickWins
            ? 'No single-repo fix would move your score right now. See the full breakdown for bigger changes.'
            : 'Run a new analysis to get repo-level suggestions.'}
        </p>
      ) : (
        <ol className="mt-5 ml-1 border-l border-rule-2">
          {items.map((w) => (
            <li key={`${w.repo}-${w.action}`} className="relative flex items-start gap-4 py-3 pl-5">
              <span
                className="absolute top-[1.15rem] -left-[4px] h-[7px] w-[7px] rounded-full border border-rule-2 bg-paper-2"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {w.title} in <span className="measured text-[0.92em] text-ink-2">{w.repo}</span>
                  {w.isPrivate && (
                    <Lock className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px text-muted" aria-label="Private repository" />
                  )}
                </p>
                <p className="mt-0.5 text-sm text-muted">{w.detail}</p>
              </div>
              <span className="measured shrink-0 rounded-chip bg-ok-soft px-1.5 py-0.5 text-sm text-ok">
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
