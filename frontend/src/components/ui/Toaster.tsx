import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const tones = {
  success: 'text-ok',
  error: 'text-bad',
  info: 'text-cool',
};

/** Renders toasts. Mount once inside the router. */
const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-end"
    >
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4 pr-2.5 transition-[opacity,translate] duration-[220ms] ease-out starting:translate-y-2 starting:opacity-0"
          >
            <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', tones[t.kind])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
              {t.action && (
                <Link
                  to={t.action.href}
                  onClick={() => dismiss(t.id)}
                  className="mt-2 inline-block text-sm font-medium text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent hover:decoration-accent"
                >
                  {t.action.label}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-muted transition-colors duration-[120ms] ease-out hover:bg-paper-3 hover:text-ink pointer-coarse:size-11"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
