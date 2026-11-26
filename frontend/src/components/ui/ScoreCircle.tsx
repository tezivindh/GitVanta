import React from 'react';
import clsx from 'clsx';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  /** Kept for API compatibility; letter grades are no longer shown. */
  showGrade?: boolean;
  className?: string;
}

/**
 * The score as a large number over a ten-cell meter, drawn in the same cells
 * as the contribution graph. (Name kept so existing imports keep working.)
 */
const ScoreCircle: React.FC<ScoreCircleProps> = ({ score, maxScore = 100, size = 'lg', label, className }) => {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const filled = Math.round(pct / 10);

  const sizes = {
    sm: { num: 'text-[2rem]', cell: 'h-1.5 w-2.5', gap: 'gap-[2px]' },
    md: { num: 'text-[2.75rem]', cell: 'h-2 w-3', gap: 'gap-[3px]' },
    lg: { num: 'text-[4rem]', cell: 'h-2.5 w-4', gap: 'gap-[3px]' },
    xl: { num: 'text-[5rem]', cell: 'h-3 w-5', gap: 'gap-1' },
  }[size];

  return (
    <div className={clsx('inline-flex flex-col items-center', className)}>
      <p className={clsx('reading', sizes.num)}>
        {Math.round(score)}
        <span className="sr-only"> out of {maxScore}</span>
      </p>
      <div className={clsx('mt-3 flex', sizes.gap)} aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={clsx('rounded-[2px]', sizes.cell, i < filled ? 'bg-cool' : 'bg-heat-0')} />
        ))}
      </div>
      {label && <span className="mt-2.5 text-center text-sm text-muted">{label}</span>}
    </div>
  );
};

export default ScoreCircle;
