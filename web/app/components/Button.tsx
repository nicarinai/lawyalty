import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight ' +
  'transition-[background-color,border-color,box-shadow,transform,color] duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-700/40 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-silver-50 ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  'active:translate-y-[0.5px]';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'liquid-glass-strong text-ink-700 hover:[box-shadow:var(--glass-shadow-lg)]',
  outline: 'liquid-glass text-ink-700 hover:[border-color:var(--glass-border-active)]',
  ghost: 'bg-transparent text-ink-600 hover:bg-white/55 hover:backdrop-blur-md',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-5 text-[15px] font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[base, variants[variant], sizes[size], className ?? ''].join(' ')}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block size-4 rounded-full border-2 border-ink-700/20 border-t-ink-700 animate-spin"
        />
      )}
      {children}
    </button>
  );
}
