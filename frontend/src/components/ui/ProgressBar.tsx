import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'auto';
  showValue?: boolean;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'auto',
  showValue = false,
  label,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (color !== 'auto') {
      // A measured bar is cool; ok and bad are status; a warning is a deviation (amber).
      const colors = {
        primary: 'ramp-cool',
        success: 'bg-ok',
        warning: 'bg-accent',
        danger: 'bg-bad',
      };
      return colors[color];
    }

    // One hue for magnitude; the number itself carries the value.
    return 'ramp-cool';
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-sm text-muted">{label}</span>}
          {showValue && (
            <span className="measured text-sm text-ink">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        aria-label={label}
        className={clsx('w-full overflow-hidden rounded-[2px] bg-paper-3', sizes[size])}
      >
        {/* Grows by scaleX from the left edge, never by width. */}
        <div
          className={clsx(
            'h-full w-full origin-left transition-transform duration-[220ms] ease-out',
            getColor()
          )}
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
