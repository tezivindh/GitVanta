import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const isLoadingState = isLoading || loading || false;
  // Console controls: Host Grotesk 500, 6px radius, one 1px rule. Amber is the one
  // primary action; everything else is the outline pair on paper-2.
  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-pill border transition-[background-color,color,border-color,transform,filter] duration-[120ms] ease-out active:translate-y-px disabled:active:translate-y-0 disabled:opacity-55 disabled:cursor-not-allowed after:absolute after:-inset-y-1 after:inset-x-0 after:content-[""] pointer-coarse:after:-inset-y-2';

  const variants = {
    primary: 'border-accent bg-accent text-accent-ink hover:not-disabled:brightness-[1.06]',
    secondary: 'border-rule-2 bg-paper-2 text-ink hover:not-disabled:bg-paper-3 hover:not-disabled:border-muted',
    outline: 'border-rule-2 bg-transparent text-ink hover:not-disabled:bg-paper-2 hover:not-disabled:border-muted',
    ghost: 'border-transparent bg-transparent text-ink-2 hover:not-disabled:bg-paper-2 hover:not-disabled:text-ink',
    danger: 'border-bad bg-transparent text-bad hover:not-disabled:bg-bad-soft',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-3.5 text-sm',
    lg: 'h-11 px-5 text-md',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoadingState}
      aria-busy={isLoadingState || undefined}
      {...props}
    >
      {isLoadingState ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon && <span aria-hidden="true" className="inline-flex">{leftIcon}</span>
      )}
      {children}
      {!isLoadingState && rightIcon && <span aria-hidden="true" className="inline-flex">{rightIcon}</span>}
    </button>
  );
};

export default Button;
