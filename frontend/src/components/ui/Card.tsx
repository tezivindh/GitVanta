// =====================================================
// CARD COMPONENT
// =====================================================

import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'compact';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
}) => {
  const paddings = {
    none: '',
    compact: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-xs border border-gray-200',
        paddings[padding],
        hover && 'hover:shadow-md transition-shadow',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className,
}) => (
  <div className={clsx('flex items-center justify-between mb-4', className)}>
    <div className="flex items-center gap-3">
      {icon && <div className="shrink-0">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export { Card, CardHeader };
export default Card;
