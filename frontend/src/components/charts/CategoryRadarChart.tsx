// =====================================================
// CATEGORY SCORES RADAR CHART
// =====================================================

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategoryScore } from '../../types';

interface CategoryRadarChartProps {
  categoryScores: CategoryScore[];
  height?: number;
  className?: string;
}

const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({
  categoryScores,
  height = 300,
  className,
}) => {
  const data = categoryScores.map((category) => ({
    category: category.category.replace(/([A-Z])/g, ' $1').trim(),
    score: category.score,
    maxScore: category.maxScore,
    fullMark: category.maxScore,
  }));

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${value}/${props.payload.maxScore}`,
              'Score',
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryRadarChart;
