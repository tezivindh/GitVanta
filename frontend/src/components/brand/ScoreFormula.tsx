import React from 'react';
import clsx from 'clsx';

export interface FormulaPart {
  label: string;
  /** Used under the narrow 10% segments when given. */
  short?: string;
  /** 0–1 */
  weight: number;
  /** 0–100 */
  score: number;
}

interface ScoreFormulaProps {
  parts: FormulaPart[];
  /** "lg" for marketing and the dashboard hero, "sm" for compact cards. */
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * The overall score drawn as one bar: each segment is as wide as its weight and
 * filled to its category score, so the filled area is the score.
 * Below `md` it becomes a list of rows (labels would not fit in 10% columns).
 */
const ScoreFormula: React.FC<ScoreFormulaProps> = ({ parts, size = 'lg', className }) => {
  const lg = size === 'lg';
  return (
    <div className={className}>
      {/* Wide: one bar, segments sized by weight */}
      <ul className={clsx('hidden gap-[3px] md:flex')} aria-label="Score by category">
        {parts.map((p) => (
          <li key={p.label} style={{ flexBasis: `${p.weight * 100}%` }} className="min-w-0">
            <div
              className={clsx('relative overflow-hidden rounded-[3px] bg-heat-0', lg ? 'h-14' : 'h-8')}
              aria-hidden="true"
            >
              <div className="absolute inset-y-0 left-0 bg-heat-3" style={{ width: `${p.score}%` }} />
            </div>
            <div className={clsx(lg ? 'mt-3' : 'mt-2', p.weight > 0.1 && 'pr-2')}>
              <p className={clsx('font-display text-gray-900 dark:text-white', lg ? 'text-2xl' : 'text-base')}>
                {Math.round(p.score)}
              </p>
              <p
                className={clsx(
                  'mt-0.5 leading-snug text-gray-600 dark:text-gray-400',
                  lg && p.weight > 0.1 ? 'text-sm' : 'text-xs'
                )}
              >
                <span className="block truncate text-gray-800 dark:text-gray-200" title={p.label}>
                  {p.short && p.weight <= 0.1 ? (
                    <>
                      <span aria-hidden="true">{p.short}</span>
                      <span className="sr-only">{p.label}</span>
                    </>
                  ) : (
                    p.label
                  )}
                </span>
                <span className="sr-only">counts </span>
                {Math.round(p.weight * 100)}%
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Narrow: rows */}
      <ul className="space-y-3 md:hidden" aria-label="Score by category">
        {parts.map((p) => (
          <li key={p.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-gray-800 dark:text-gray-200">
                {p.label} <span className="text-gray-500 dark:text-gray-400">counts {Math.round(p.weight * 100)}%</span>
              </span>
              <span className="font-display text-base text-gray-900 dark:text-white">{Math.round(p.score)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-[3px] bg-heat-0" aria-hidden="true">
              <div className="h-full bg-heat-3" style={{ width: `${p.score}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreFormula;
