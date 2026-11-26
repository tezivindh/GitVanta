import React from 'react';
import clsx from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        aria-hidden="true"
        className={clsx(
          'animate-spin motion-reduce:animate-none rounded-full border-2 border-rule-2 border-t-cool',
          sizes[size]
        )}
      />
    </div>
  );
};

interface FullPageLoaderProps {
  message?: string;
  text?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ message, text }) => (
  <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-paper">
    <div className="text-center">
      <Loader size="md" />
      {(message || text) && <p className="mt-4 text-sm text-muted">{message || text}</p>}
    </div>
  </div>
);

export default Loader;
