import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none';

  const variants = {
    primary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm active:bg-zinc-300',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60 active:bg-zinc-750',
    outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-200',
    ghost: 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100',
    destructive: 'bg-red-950/80 text-red-200 border border-red-800/60 hover:bg-red-900/90',
    success: 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60 hover:bg-emerald-900/90',
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
    md: 'h-9 px-3.5 text-sm rounded-md gap-2',
    lg: 'h-10 px-4 text-sm rounded-md gap-2.5',
    icon: 'h-8 w-8 rounded-md',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
