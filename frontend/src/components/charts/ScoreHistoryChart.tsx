import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HistoryPoint } from '../../types';
import { tooltipStyle, useChartTheme } from '../../lib/chartTheme';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Overall score across analyses, oldest to newest, with a table view. */
const ScoreHistoryChart: React.FC<{ points: HistoryPoint[]; height?: number }> = ({ points, height = 220 }) => {
  const t = useChartTheme();
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
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
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
            <Line
              type="monotone"
              dataKey="overallScore"
              stroke={t.you}
              strokeWidth={2}
              dot={{ r: 4, fill: t.you, stroke: t.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: t.you, stroke: t.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer rounded text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          Show as table
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">Score after each analysis</caption>
          <thead className="text-gray-500 dark:text-gray-400">
            <tr>
              <th scope="col" className="py-1 font-medium">Analysed</th>
              <th scope="col" className="py-1 text-right font-medium">Score</th>
              <th scope="col" className="py-1 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-gray-800 dark:text-gray-200">
            {[...points].reverse().map((p, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? p.overallScore - prev.overallScore : null;
              return (
                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-1">{fmtFull(p.generatedAt)}</td>
                  <td className="py-1 text-right">{p.overallScore}</td>
                  <td className="py-1 text-right">{diff === null ? '' : diff > 0 ? `+${diff}` : diff}</td>
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
