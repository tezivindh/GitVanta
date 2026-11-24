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
  const variants = {
    info: {
      container: 'bg-gray-100 border-gray-200 dark:bg-gray-800/60 dark:border-gray-700',
      icon: 'text-primary-600 dark:text-primary-400',
      title: 'text-primary-900 dark:text-gray-200',
      text: 'text-gray-800 dark:text-primary-300',
      Icon: Info,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900',
      icon: 'text-emerald-600 dark:text-emerald-400',
      title: 'text-emerald-900 dark:text-emerald-200',
      text: 'text-emerald-800 dark:text-emerald-300',
      Icon: CheckCircle,
    },
    warning: {
      container: 'bg-gain-50 border-gain-300 dark:bg-gain-700/15 dark:border-gain-700/50',
      icon: 'text-gain-600 dark:text-gain-400',
      title: 'text-gain-700 dark:text-gain-300',
      text: 'text-gray-800 dark:text-gray-200',
      Icon: AlertTriangle,
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-200',
      text: 'text-red-800 dark:text-red-300',
      Icon: XCircle,
    },
  };

  const variantStyles = variants[variant];
  const { Icon } = variantStyles;

  return (
    <div
      className={clsx(
        'flex p-4 rounded-lg border',
        variantStyles.container,
        className
      )}
      role="alert"
    >
      <Icon className={clsx('w-5 h-5 shrink-0', variantStyles.icon)} />
      
      <div className="ml-3 flex-1">
        {title && (
          <h3 className={clsx('text-sm font-medium', variantStyles.title)}>
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
            'ml-3 shrink-0 inline-flex p-1 rounded-md',
            'hover:bg-black/5 focus:outline-hidden focus:ring-2 focus:ring-offset-2',
            variantStyles.icon
          )}
        >
          <span className="sr-only">Dismiss</span>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
