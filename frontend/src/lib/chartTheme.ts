import { useThemeStore } from '../store/themeStore';

/**
 * Chart colours per theme. The "you"/"them" pair is validated for
 * colour-blind separation and contrast against each theme's surface
 * (dataviz validate_palette: all checks pass in light and dark).
 */
const LIGHT = {
  you: '#0A9490',
  them: '#C9831F',
  grid: '#EEF2F7',
  axis: '#64748B',
  surface: '#FFFFFF',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#DCE3EC',
  ink: '#0F1B2D',
  muted: '#64748B',
};

const DARK = {
  you: '#14989A',
  them: '#C9831F',
  grid: '#1C2A40',
  axis: '#8D9BB0',
  surface: '#0F1B2D',
  tooltipBg: '#0A1322',
  tooltipBorder: '#33415A',
  ink: '#F7F9FC',
  muted: '#8D9BB0',
};

export type ChartTheme = typeof LIGHT;

export function useChartTheme(): ChartTheme {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DARK : LIGHT;
}

/** Props for Recharts <Tooltip> so it matches the theme. */
export function tooltipStyle(t: ChartTheme) {
  return {
    contentStyle: {
      backgroundColor: t.tooltipBg,
      border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 8,
      boxShadow: '0 8px 24px -12px rgb(15 27 45 / 0.35)',
      color: t.ink,
      fontSize: 13,
    },
    labelStyle: { color: t.muted, marginBottom: 4 },
    itemStyle: { color: t.ink },
  };
}
