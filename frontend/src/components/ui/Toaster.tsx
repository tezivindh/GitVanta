import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const tones = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-primary-600 dark:text-primary-400',
};

/** Renders toasts. Mount once inside the router. */
const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', tones[t.kind])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{t.description}</p>}
              {t.action && (
                <Link
                  to={t.action.href}
                  onClick={() => dismiss(t.id)}
                  className="mt-2 inline-block text-sm font-medium text-primary-700 underline-offset-2 hover:underline dark:text-primary-400"
                >
                  {t.action.label}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
