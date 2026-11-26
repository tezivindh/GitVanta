import React, { useId } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export type SealState = 'earned' | 'reached' | 'locked';

interface BadgeSealProps {
  name: string;
  icon: LucideIcon;
  state: SealState;
  /** 0 to 1, drawn as a cool ring around a locked seal: a measurement in progress. */
  progress?: number | null;
  /** Outer size in px. Seals of 112px and up carry the name around the rim. */
  size?: number;
  /** Small line set on the lower rim of a large seal, e.g. the year it was earned. */
  rimNote?: string;
  className?: string;
}

/**
 * A badge drawn as a struck seal, the Console way: amber when it belongs to the
 * person (earned), a cool progress ring while it is still being measured
 * (locked), an amber outline when the threshold is passed but a higher tier
 * on the same measure was awarded instead (reached).
 */
const BadgeSeal: React.FC<BadgeSealProps> = ({ name, icon: Icon, state, progress = null, size = 64, rimNote, className }) => {
  const uid = useId().replace(/:/g, '');
  const ringText = size >= 112;
  const p = progress == null ? null : Math.max(0, Math.min(1, progress));
  const C = 2 * Math.PI * 56;

  const label =
    state === 'earned'
      ? `${name}, earned`
      : state === 'reached'
        ? `${name}, threshold reached`
        : p != null
          ? `${name}, ${Math.round(p * 100)}% of the way there`
          : `${name}, not earned yet`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={clsx('badge-seal shrink-0 overflow-visible', className)}
    >
      <defs>
        {/* Upper rim runs left to right over the top; lower rim runs left to right under the bottom. */}
        <path id={`${uid}-top`} d="M 15 60 A 45 45 0 0 1 105 60" />
        <path id={`${uid}-bottom`} d="M 18 60 A 42 42 0 0 0 102 60" />
        {/* Data ramps: the progress ring brightens toward where it has reached. */}
        <linearGradient id={`${uid}-ring`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--color-cool) 55%, var(--color-paper-2))' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-cool)' }} />
        </linearGradient>
        {/* Earned: a struck-metal sheen, lit from the top left. */}
        <radialGradient id={`${uid}-sheen`} cx="32%" cy="28%" r="78%">
          <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--color-accent) 42%, var(--color-accent-soft))' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-accent-soft)' }} />
        </radialGradient>
      </defs>

      {/* Body */}
      <circle
        cx="60"
        cy="60"
        r="56"
        className={clsx(
          state === 'earned' && 'stroke-accent',
          state === 'reached' && 'fill-paper-2 stroke-accent',
          state === 'locked' && 'fill-paper-3 stroke-rule-2'
        )}
        fill={state === 'earned' ? `url(#${uid}-sheen)` : undefined}
        strokeWidth={state === 'earned' ? 2 : 1.25}
        strokeDasharray={state === 'locked' ? '3 4' : undefined}
      />
      {/* The struck inner ring: a seal, not a sticker. */}
      <circle
        cx="60"
        cy="60"
        r={ringText ? 36 : 44}
        fill="none"
        className={state === 'locked' ? 'stroke-rule' : 'stroke-accent'}
        strokeWidth="1"
        opacity={state === 'locked' ? 1 : 0.55}
      />

      {/* Progress toward a locked badge, measured in the cool instrument colour. */}
      {state === 'locked' && p != null && p > 0 && (
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="none"
          stroke={`url(#${uid}-ring)`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${p * C} ${C}`}
          transform="rotate(-90 60 60)"
        />
      )}

      {ringText && (
        <g className={clsx('font-body', state === 'locked' ? 'fill-muted' : 'fill-ink')} fontSize="10.5" fontWeight={500}>
          <text>
            <textPath href={`#${uid}-top`} startOffset="50%" textAnchor="middle">
              {name}
            </textPath>
          </text>
          {rimNote && (
            <text className="font-mono" fontSize="9.5" fontWeight={400}>
              <textPath href={`#${uid}-bottom`} startOffset="50%" textAnchor="middle">
                {rimNote}
              </textPath>
            </text>
          )}
        </g>
      )}

      <Icon
        x={ringText ? 44 : 38}
        y={ringText ? 44 : 38}
        width={ringText ? 32 : 44}
        height={ringText ? 32 : 44}
        strokeWidth={1.6}
        className={state === 'locked' ? 'text-muted' : 'text-accent'}
        aria-hidden="true"
      />
    </svg>
  );
};

export default BadgeSeal;
