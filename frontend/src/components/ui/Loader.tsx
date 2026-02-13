// =====================================================
// LOADING SPINNER
// =====================================================

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
        className={clsx(
          'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
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
  <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center z-50">
    <div className="text-center">
      <Loader size="lg" />
      {(message || text) && <p className="mt-4 text-gray-600 dark:text-gray-400">{message || text}</p>}
    </div>
  </div>
);

export default Loader;
