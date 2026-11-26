import React, { useEffect, useCallback, useId, useRef } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes; Tab stays inside the dialog.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    // Focus the first field, else the dialog itself.
    const target =
      dialogRef.current?.querySelector<HTMLElement>('input,textarea,select') ??
      dialogRef.current?.querySelector<HTMLElement>('button:not([aria-label="Close dialog"])') ??
      dialogRef.current;
    target?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade-in bg-scrim motion-reduce:animate-none"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-dvh items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={clsx(
            'card relative w-full text-ink focus:outline-none',
            // Centered, so it scales from the center (modals are the exception to origin-aware).
            'animate-dialog-in motion-reduce:animate-none',
            sizes[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
              {title && (
                <h2
                  id={titleId}
                  className="max-w-none text-lg font-medium leading-snug tracking-[-0.01em] text-ink"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={clsx(
                    '-mr-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-pill text-muted',
                    'transition-colors duration-[120ms] ease-out hover:bg-paper-3 hover:text-ink pointer-coarse:size-11',
                    !title && 'ml-auto'
                  )}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Modal footer component
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        '-mx-4 -mb-4 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-rule px-4 py-3',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Modal;
