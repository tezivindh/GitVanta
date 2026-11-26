import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Button from './Button';

/** Shimmering placeholder block. Size it with className (h-*, w-*). */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden="true" className={clsx('skeleton', className)} />
);

/** Wraps skeletons so screen readers hear one "Loading" instead of nothing. */
export const LoadingRegion: React.FC<{ label?: string; children: React.ReactNode; className?: string }> = ({
  label = 'Loading',
  children,
  className,
}) => (
  <div role="status" aria-live="polite" aria-busy="true" className={className}>
    <span className="sr-only">{label}…</span>
    {children}
  </div>
);

/** A page-shaped loading state: header line plus a few cards. */
export const PageSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <LoadingRegion label="Loading page" className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
    {Array.from({ length: cards }).map((_, i) => (
      <Skeleton key={i} className="h-48" />
    ))}
  </LoadingRegion>
);

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={clsx(
      'flex flex-col items-center rounded-card border border-dashed border-rule-2 px-6 py-12 text-center',
      className
    )}
  >
    {Icon && (
      <div className="mb-3 text-muted" aria-hidden="true">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h2 className="max-w-none text-md font-medium leading-snug tracking-[-0.01em] text-ink">{title}</h2>
    {description && <div className="mt-1 max-w-md text-sm text-muted">{description}</div>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'This didn’t load',
  message,
  onRetry,
  retrying,
  action,
  className,
}) => (
  <div
    role="alert"
    className={clsx(
      'flex flex-col items-center rounded-card border border-rule bg-bad-soft px-6 py-10 text-center',
      className
    )}
  >
    <AlertTriangle className="mb-3 h-6 w-6 text-bad" aria-hidden="true" />
    <h2 className="max-w-none text-md font-medium leading-snug tracking-[-0.01em] text-ink">{title}</h2>
    <p className="mt-1 max-w-md text-sm text-ink-2">{message}</p>
    {(onRetry || action) && (
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} isLoading={retrying} leftIcon={<RotateCw className="h-4 w-4" aria-hidden="true" />}>
            Try again
          </Button>
        )}
        {action}
      </div>
    )}
  </div>
);

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="max-w-none font-display text-xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-2xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-[65ch] text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);
