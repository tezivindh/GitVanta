import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryScore } from '../../types';
import { tooltipStyle, useChartTheme } from '../../lib/chartTheme';

interface CategoryRadarChartProps {
  categoryScores: CategoryScore[];
  /** Optional second series, e.g. the profile you compare against. */
  compareScores?: CategoryScore[];
  seriesNames?: [string, string];
  height?: number;
  className?: string;
}

const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({
  categoryScores,
  compareScores,
  seriesNames = ['You', 'Them'],
  height = 300,
  className,
}) => {
  const t = useChartTheme();
  const data = categoryScores.map((c, i) => ({
    category: c.category,
    a: c.score,
    b: compareScores?.[i]?.score,
  }));
  const summary = categoryScores.map((c) => `${c.category} ${c.score}`).join(', ');

  return (
    <div className={className} style={{ height }} role="img" aria-label={`Category scores: ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke={t.grid} />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: t.axis }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name={seriesNames[0]} dataKey="a" stroke={t.you} fill={t.you} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
          {compareScores && (
            <Radar name={seriesNames[1]} dataKey="b" stroke={t.them} fill={t.them} fillOpacity={0.12} strokeWidth={2} strokeDasharray="5 3" isAnimationActive={false} />
          )}
          <Tooltip {...tooltipStyle(t)} formatter={(value: number, name: string) => [`${value} / 100`, name]} />
          {compareScores && <Legend wrapperStyle={{ fontSize: 13, color: t.muted }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryRadarChart;
