// =====================================================
// SCORE BREAKDOWN BAR CHART
// =====================================================

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CategoryScore } from '../../types';

interface ScoreBreakdownChartProps {
  categoryScores: CategoryScore[];
  height?: number;
  className?: string;
}

const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({
  categoryScores,
  height = 300,
  className,
}) => {
  const data = categoryScores.map((category) => ({
    name: category.category.replace(/([A-Z])/g, ' $1').trim(),
    score: category.score,
    maxScore: category.maxScore,
    percentage: Math.round((category.score / category.maxScore) * 100),
  }));

  const getBarColor = (percentage: number): string => {
    if (percentage >= 80) return '#22c55e'; // green
    if (percentage >= 60) return '#6366f1'; // primary
    if (percentage >= 40) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${props.payload.score}/${props.payload.maxScore} (${value}%)`,
              'Score',
            ]}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreBreakdownChart;
