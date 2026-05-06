import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** 우측 인라인 액션 ([표시] 토글, 인증 상태 ✓ 등) */
  trailing?: ReactNode;
}

/**
 * 라윌티 인풋 — 글래스 + 헤어라인 보더, focus 시 잉크 보더.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, trailing, id, className, ...rest }, ref) => {
    const inputId = id ?? `f-${label.replace(/\s/g, '')}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errId = error ? `${inputId}-err` : undefined;
    const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-[13px] font-medium text-ink-600">
            {label}
          </label>
          {trailing && <span className="text-[12px] text-ink-400">{trailing}</span>}
        </div>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            'w-full h-11 px-3.5 rounded-lg text-[15px] text-ink-700',
            'liquid-glass-subtle',
            'transition-[border-color,box-shadow,background-color] duration-200',
            'placeholder:text-ink-300',
            'focus:outline-none focus:bg-white/85',
            error
              ? 'border-red-400/70 focus:border-red-500/80'
              : 'focus:border-[var(--glass-border-active)]',
            className ?? '',
          ].join(' ')}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-[12px] text-ink-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errId} role="alert" className="text-[12px] text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Field.displayName = 'Field';
