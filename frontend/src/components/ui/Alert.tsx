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
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-700',
      Icon: Info,
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-500',
      title: 'text-green-800',
      text: 'text-green-700',
      Icon: CheckCircle,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      Icon: AlertTriangle,
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      text: 'text-red-700',
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
