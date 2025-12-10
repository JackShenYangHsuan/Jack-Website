'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Button variants following shadcn/ui design system
 */
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Loading spinner
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Button component - shadcn/ui design system
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      disabled,
      icon,
      iconAfter,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
          'transition-colors cursor-pointer',
          // Focus
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // Variants
          variant === 'default' && 'bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90',
          variant === 'destructive' && 'bg-red-500 text-zinc-50 shadow-sm hover:bg-red-500/90',
          variant === 'outline' && 'border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900',
          variant === 'secondary' && 'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-100/80',
          variant === 'ghost' && 'hover:bg-zinc-100 hover:text-zinc-900',
          variant === 'link' && 'text-zinc-900 underline-offset-4 hover:underline',
          // Sizes
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 rounded-md px-3 text-xs',
          size === 'lg' && 'h-10 rounded-md px-8',
          size === 'icon' && 'h-9 w-9',
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <LoadingSpinner className="-ml-1 mr-2 h-4 w-4" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconAfter && !loading && <span className="shrink-0">{iconAfter}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
