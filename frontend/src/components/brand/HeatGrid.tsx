import React, { useMemo } from 'react';
import clsx from 'clsx';

/**
 * A contribution graph (weeks × 7 days) with a number drawn into it at the
 * highest level of the cool heat ramp (it is a measurement). It's decorative:
 * callers describe it in text for screen readers.
 */

// 5×7 pixel digits, one string per row.
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

/** Small deterministic PRNG so the grid is identical on every render. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface HeatGridProps {
  /** Number to draw, e.g. "66". */
  value: string;
  /** Weeks shown from the small breakpoint up (GitHub shows 53). */
  weeks?: number;
  /** Weeks shown on phones; the oldest weeks are dropped. */
  mobileWeeks?: number;
  /** Empty weeks between the number and the right edge. */
  rightPad?: number;
  seed?: number;
  animate?: boolean;
  showMonths?: boolean;
  className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HeatGrid: React.FC<HeatGridProps> = ({
  value,
  weeks = 53,
  mobileWeeks = 22,
  rightPad = 3,
  seed = 7,
  animate = true,
  showMonths = true,
  className,
}) => {
  const { cells, months } = useMemo(() => {
    const rand = mulberry32(seed);
    const chars = value.split('').filter((c) => GLYPHS[c]);
    const width = chars.length * 6 - 1;
    const start = weeks - rightPad - width;

    const lit = new Set<string>();
    chars.forEach((ch, i) => {
      GLYPHS[ch].forEach((row, r) => {
        row.split('').forEach((bit, c) => {
          if (bit === '1') lit.add(`${start + i * 6 + c}:${r}`);
        });
      });
    });

    const out: Array<{ week: number; day: number; level: number; digit: boolean }> = [];
    for (let w = 0; w < weeks; w++) {
      // Activity ramps up through the year, so the right side reads busier.
      const busy = 0.35 + (w / weeks) * 0.4;
      for (let d = 0; d < 7; d++) {
        const key = `${w}:${d}`;
        if (lit.has(key)) {
          out.push({ week: w, day: d, level: 4, digit: true });
          continue;
        }
        const weekend = d === 0 || d === 6;
        const x = rand();
        let level = 0;
        if (x < busy * (weekend ? 0.45 : 1)) level = x < busy * 0.08 ? 3 : x < busy * 0.4 ? 2 : 1;
        // Around the number, keep it to the faintest levels so the digits read.
        const inBox = w >= start - 2 && w <= start + width + 1;
        if (inBox) level = level > 0 && x < busy * 0.25 ? 1 : 0;
        out.push({ week: w, day: d, level, digit: false });
      }
    }

    // Month labels: the first week whose Sunday falls in a new month.
    const today = new Date();
    const lastSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const labels: Array<{ week: number; label: string }> = [];
    let prev = -1;
    for (let w = 0; w < weeks; w++) {
      const date = new Date(lastSunday);
      date.setDate(lastSunday.getDate() - (weeks - 1 - w) * 7);
      if (date.getMonth() !== prev) {
        if (prev !== -1 && w < weeks - 2) labels.push({ week: w, label: MONTHS[date.getMonth()] });
        prev = date.getMonth();
      }
    }
    return { cells: out, months: labels };
  }, [value, weeks, rightPad, seed]);

  const lead = weeks - mobileWeeks;
  const style = { '--weeks': weeks, '--weeks-sm': mobileWeeks } as React.CSSProperties;

  return (
    <div className={clsx('heat', className)} style={style} aria-hidden="true">
      {showMonths && (
        <div className="heat-grid heat-months mb-1.5 text-xs text-muted">
          {Array.from({ length: weeks }).map((_, w) => {
            const m = months.find((x) => x.week === w);
            return (
              <span key={w} className={clsx('heat-col overflow-visible whitespace-nowrap', w < lead && 'heat-lead')}>
                {m?.label ?? ''}
              </span>
            );
          })}
        </div>
      )}
      <div className="heat-grid heat-cells">
        {cells.map((c) => (
          <span
            key={`${c.week}:${c.day}`}
            className={clsx('heat-cell', c.week < lead && 'heat-lead', animate && 'heat-animate')}
            style={
              {
                backgroundColor: `var(--color-heat-${c.level})`,
                '--d': `${c.week * 16 + c.day * 8}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};

export default HeatGrid;
