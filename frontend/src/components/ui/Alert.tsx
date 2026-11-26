import React from 'react';
import clsx from 'clsx';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}) => {
  // Status only: ok and bad tints for success and failure; a warning is a
  // deviation, so it takes the amber marker on the neutral deep step.
  const variants = {
    info: {
      container: 'bg-paper-3 border-rule',
      icon: 'text-cool',
      title: 'text-ink',
      text: 'text-ink-2',
      Icon: Info,
    },
    success: {
      container: 'bg-ok-soft border-rule',
      icon: 'text-ok',
      title: 'text-ink',
      text: 'text-ink-2',
      Icon: CheckCircle,
    },
    warning: {
      container: 'bg-paper-3 border-rule-2',
      icon: 'text-accent',
      title: 'text-ink',
      text: 'text-ink-2',
      Icon: AlertTriangle,
    },
    error: {
      container: 'bg-bad-soft border-rule',
      icon: 'text-bad',
      title: 'text-ink',
      text: 'text-ink-2',
      Icon: XCircle,
    },
  };

  const variantStyles = variants[variant];
  const { Icon } = variantStyles;

  return (
    <div
      className={clsx(
        'flex rounded-card border p-4',
        variantStyles.container,
        className
      )}
      role="alert"
    >
      <Icon className={clsx('mt-px h-5 w-5 shrink-0', variantStyles.icon)} aria-hidden="true" />
      
      <div className="ml-3 flex-1">
        {title && (
          <h3 className={clsx('max-w-none text-sm font-medium leading-snug tracking-normal', variantStyles.title)}>
            {title}
          </h3>
        )}
        <div className={clsx('text-sm', variantStyles.text, title && 'mt-1')}>
          {children}
        </div>
      </div>
      
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={clsx(
            '-my-1 -mr-1 ml-3 inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-muted',
            'transition-colors duration-[120ms] ease-out hover:bg-paper-2 hover:text-ink pointer-coarse:size-11'
          )}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
