import { useThemeStore } from '../store/themeStore';

/**
 * Chart colours per theme. The "you"/"them" pair is validated for
 * colour-blind separation and contrast against each theme's surface
 * (dataviz validate_palette: all checks pass in light and dark).
 */
const LIGHT = {
  you: '#D95434',
  /** One-series magnitude bars. */
  bar: '#2E3A5A',
  them: '#3F5FA8',
  grid: '#EEE7D9',
  axis: '#646C82',
  surface: '#FBF8F2',
  tooltipBg: '#FBF8F2',
  tooltipBorder: '#E0D6C4',
  ink: '#172039',
  muted: '#646C82',
};

const DARK = {
  you: '#E8603C',
  bar: '#B8B1A3',
  them: '#6F8BD6',
  grid: '#222D49',
  axis: '#9AA0B0',
  surface: '#172039',
  tooltipBg: '#0E1629',
  tooltipBorder: '#34405D',
  ink: '#F6F1E7',
  muted: '#9AA0B0',
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
      boxShadow: '0 8px 24px -12px rgb(14 22 41 / 0.35)',
      color: t.ink,
      fontSize: 13,
    },
    labelStyle: { color: t.muted, marginBottom: 4 },
    itemStyle: { color: t.ink },
  };
}
