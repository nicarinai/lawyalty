import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'liquid-glass-subtle',
          'flex min-h-[80px] w-full rounded-xl px-3.5 py-2.5 text-[15px] text-foreground resize-none',
          'transition-[border-color,box-shadow,background-color] duration-200',
          'placeholder:text-muted-foreground/70',
          'focus-visible:outline-none focus-visible:border-[rgba(107,33,53,0.5)] focus-visible:bg-white/70',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
