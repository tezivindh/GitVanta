import React from 'react';
import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Hide the visible label (still announced to screen readers). */
  hideLabel?: boolean;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, description, disabled, hideLabel, id }) => {
  const autoId = React.useId();
  const switchId = id ?? autoId;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <div className="flex items-start justify-between gap-4">
      {!hideLabel && (
        <div className="min-w-0">
          <label htmlFor={switchId} className={clsx('text-sm font-medium text-ink', disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer')}>
            {label}
          </label>
          {description && (
            <p id={descId} className="mt-0.5 text-sm text-muted">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'group relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border',
          'transition-[background-color,border-color] duration-[120ms] ease-out',
          // 44px hit target around the 40 by 24 control.
          'after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[""]',
          'disabled:cursor-not-allowed disabled:opacity-55',
          checked
            ? 'border-accent bg-accent hover:not-disabled:brightness-[1.06]'
            : 'border-rule-2 bg-paper-3 hover:not-disabled:border-muted'
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'inline-block h-4 w-4 rounded-full transition-[translate,scale,background-color] duration-[120ms] ease-out group-enabled:group-active:scale-90',
            checked ? 'translate-x-[19px] bg-accent-ink' : 'translate-x-[3px] bg-muted'
          )}
        />
      </button>
    </div>
  );
};

export default Switch;
