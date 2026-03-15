import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ActivityData {
  date: string;
  commits: number;
  prs?: number;
  issues?: number;
}

interface ActivityTimelineChartProps {
  data: ActivityData[];
  height?: number;
  className?: string;
  showDetails?: boolean;
}

const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({
  data,
  height = 200,
  className,
  showDetails = false,
}) => {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            {showDetails && (
              <>
                <linearGradient id="colorPRs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorCommits)"
            strokeWidth={2}
          />
          {showDetails && (
            <>
              <Area
                type="monotone"
                dataKey="prs"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorPRs)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="issues"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorIssues)"
                strokeWidth={2}
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityTimelineChart;
