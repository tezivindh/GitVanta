import React, { useId } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { CategoryScore } from '../../types';
import { tooltipStyle, useChartTheme } from '../../lib/chartTheme';

interface ScoreBreakdownChartProps {
  categoryScores: CategoryScore[];
  height?: number;
  className?: string;
}

/** Category scores as horizontal bars on a shared 0–100 scale. */
const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({ categoryScores, height = 300, className }) => {
  const t = useChartTheme();
  const rampId = `bar-ramp-${useId().replace(/:/g, '')}`;
  const data = categoryScores.map((c) => ({ name: c.category, score: c.score }));

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap={10}>
          {/* Data ramp: each bar brightens toward its score. */}
          <defs>
            <linearGradient id={rampId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={t.bar} stopOpacity={0.55} />
              <stop offset="100%" stopColor={t.bar} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: t.axis }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 12, fill: t.axis }} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle(t)} cursor={{ fill: t.grid }} formatter={(v: number) => [`${v} / 100`, 'Score']} />
          <Bar dataKey="score" fill={`url(#${rampId})`} radius={[0, 2, 2, 0]} isAnimationActive={false}>
            <LabelList dataKey="score" position="right" style={{ fontSize: 12, fill: t.muted, fontFamily: t.mono, fontVariantNumeric: 'tabular-nums' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreBreakdownChart;
