// =====================================================
// SCORE CIRCLE COMPONENT - Visual score display
// =====================================================

import React from 'react';
import clsx from 'clsx';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showGrade?: boolean;
  className?: string;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  maxScore = 100,
  size = 'lg',
  label,
  showGrade = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  const sizes = {
    sm: { container: 'w-16 h-16', stroke: 4, fontSize: 'text-lg' },
    md: { container: 'w-24 h-24', stroke: 6, fontSize: 'text-2xl' },
    lg: { container: 'w-32 h-32', stroke: 8, fontSize: 'text-3xl' },
    xl: { container: 'w-40 h-40', stroke: 10, fontSize: 'text-4xl' },
  };

  const config = sizes[size];
  const radius = 50 - config.stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGrade = (): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getColor = (): string => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-primary-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrokeColor = (): string => {
    if (percentage >= 80) return 'stroke-green-500';
    if (percentage >= 60) return 'stroke-primary-500';
    if (percentage >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className={clsx('relative', config.container)}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth={config.stroke}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={clsx(getStrokeColor(), 'transition-all duration-1000 ease-out')}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('font-bold', config.fontSize, getColor())}>
            {Math.round(score)}
          </span>
          {showGrade && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {getGrade()}
            </span>
          )}
        </div>
      </div>
      
      {label && (
        <span className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium text-center">
          {label}
        </span>
      )}
    </div>
  );
};

export default ScoreCircle;
