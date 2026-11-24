import React from 'react';
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
  const data = categoryScores.map((c) => ({ name: c.category, score: c.score }));

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap={10}>
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: t.axis }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 12, fill: t.axis }} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle(t)} cursor={{ fill: t.grid }} formatter={(v: number) => [`${v} / 100`, 'Score']} />
          <Bar dataKey="score" fill={t.you} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="score" position="right" style={{ fontSize: 12, fill: t.muted }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreBreakdownChart;
