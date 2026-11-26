import { useMemo } from 'react';

/**
 * Chart colours, read once from the live Console tokens so charts and pages
 * never drift apart.
 * Meanings follow the theme: amber is a person ("you"), cool is an
 * instrument (a trace, a measured bar, the comparison reference).
 */
export interface ChartTheme {
  /** The signed-in person's own series. */
  you: string;
  /** The person being compared against. */
  them: string;
  /** A measured series over time (the score trace). */
  trace: string;
  /** One-series magnitude bars. */
  bar: string;
  grid: string;
  axis: string;
  surface: string;
  tooltipBg: string;
  tooltipBorder: string;
  ink: string;
  muted: string;
  mono: string;
}

function read(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function useChartTheme(): ChartTheme {
  return useMemo<ChartTheme>(
    () => ({
      you: read('--color-accent'),
      them: read('--color-cool'),
      trace: read('--color-cool'),
      bar: read('--color-cool'),
      grid: read('--color-rule'),
      axis: read('--color-muted'),
      surface: read('--color-paper-2'),
      tooltipBg: read('--color-paper-2'),
      tooltipBorder: read('--color-rule-2'),
      ink: read('--color-ink'),
      muted: read('--color-muted'),
      mono: read('--font-outlier'),
    }),
    []
  );
}

/** Props for Recharts <Tooltip> so it matches the theme: a hairline panel, no shadow. */
export function tooltipStyle(t: ChartTheme) {
  return {
    contentStyle: {
      backgroundColor: t.tooltipBg,
      border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 6,
      boxShadow: 'none',
      color: t.ink,
      fontSize: 13,
    },
    labelStyle: { color: t.muted, marginBottom: 4 },
    itemStyle: { color: t.ink, fontFamily: t.mono, fontVariantNumeric: 'tabular-nums' as const },
  };
}
