import React, { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HistoryPoint } from '../../types';
import { tooltipStyle, useChartTheme } from '../../lib/chartTheme';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Overall score across analyses, oldest to newest, as a cool trace, with a table view. */
const ScoreHistoryChart: React.FC<{ points: HistoryPoint[]; height?: number }> = ({ points, height = 220 }) => {
  const t = useChartTheme();
  const fillId = `trace-${useId().replace(/:/g, '')}`;
  const data = points.map((p) => ({ ...p, label: fmtDate(p.generatedAt) }));
  const min = Math.min(...points.map((p) => p.overallScore));
  const max = Math.max(...points.map((p) => p.overallScore));
  // Zoom to the data with some headroom, but never outside 0–100.
  const lo = Math.max(0, Math.floor((min - 10) / 10) * 10);
  const hi = Math.min(100, Math.ceil((max + 10) / 10) * 10);
  const ticks = Array.from({ length: (hi - lo) / 10 + 1 }, (_, i) => lo + i * 10);

  return (
    <div>
      <div style={{ height }} role="img" aria-label={`Score history: ${points.map((p) => p.overallScore).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            {/* Data ramp: the area under the trace fades from the line down to the axis. */}
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.trace} stopOpacity={0.28} />
                <stop offset="100%" stopColor={t.trace} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: t.axis }}
              tickLine={false}
              axisLine={{ stroke: t.grid }}
              minTickGap={24}
            />
            <YAxis domain={[lo, hi]} ticks={ticks} tick={{ fontSize: 12, fill: t.axis }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle(t)}
              cursor={{ stroke: t.axis, strokeDasharray: '3 3' }}
              labelFormatter={(_l, payload) => (payload?.[0] ? fmtFull(payload[0].payload.generatedAt) : '')}
              formatter={(value: number) => [`${value} / 100`, 'Score']}
            />
            <Area
              type="monotone"
              dataKey="overallScore"
              fill={`url(#${fillId})`}
              stroke={t.trace}
              strokeWidth={2}
              dot={{ r: 4, fill: t.trace, stroke: t.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: t.trace, stroke: t.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer rounded-chip text-muted transition-colors duration-[120ms] ease-out hover:text-ink">
          Show as table
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">Score after each analysis</caption>
          <thead className="text-muted">
            <tr className="border-b border-rule">
              <th scope="col" className="py-1.5 font-medium whitespace-nowrap">Analysed</th>
              <th scope="col" className="py-1.5 text-right font-medium whitespace-nowrap">Score</th>
              <th scope="col" className="py-1.5 text-right font-medium whitespace-nowrap">Change</th>
            </tr>
          </thead>
          <tbody className="measured text-ink-2">
            {[...points].reverse().map((p, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? p.overallScore - prev.overallScore : null;
              return (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="py-1.5">{fmtFull(p.generatedAt)}</td>
                  <td className="py-1.5 text-right text-ink">{p.overallScore}</td>
                  <td
                    className={
                      diff === null || diff === 0
                        ? 'py-1.5 text-right text-muted'
                        : diff > 0
                          ? 'py-1.5 text-right text-ok'
                          : 'py-1.5 text-right text-bad'
                    }
                  >
                    {diff === null ? '' : diff > 0 ? `+${diff}` : diff < 0 ? `−${-diff}` : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
};

export default ScoreHistoryChart;
