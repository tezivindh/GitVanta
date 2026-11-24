import { useThemeStore } from '../store/themeStore';

/**
 * Chart colours per theme. The "you"/"them" pair is validated for
 * colour-blind separation and contrast against each theme's surface
 * (dataviz validate_palette: all checks pass in light and dark).
 */
const LIGHT = {
  you: '#0F8A72',
  them: '#B86E12',
  grid: '#E7ECEA',
  axis: '#5B6D68',
  surface: '#FFFFFF',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#D5DEDB',
  ink: '#12201E',
  muted: '#5B6D68',
};

const DARK = {
  you: '#1A9C83',
  them: '#C9831F',
  grid: '#1D2C29',
  axis: '#84968F',
  surface: '#12201E',
  tooltipBg: '#0A1416',
  tooltipBorder: '#33433F',
  ink: '#F3F5F4',
  muted: '#84968F',
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
      boxShadow: '0 8px 24px -12px rgb(10 20 22 / 0.35)',
      color: t.ink,
      fontSize: 13,
    },
    labelStyle: { color: t.muted, marginBottom: 4 },
    itemStyle: { color: t.ink },
  };
}
