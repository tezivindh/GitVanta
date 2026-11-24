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
          <label htmlFor={switchId} className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
          {description && (
            <p id={descId} className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
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
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
};

export default Switch;
