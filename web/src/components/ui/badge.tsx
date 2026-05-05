import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full px-2.5 py-0.5',
    'text-[11px] font-semibold tracking-tight',
    'transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        // 기본 — 강조 화이트 글래스 (잉크 텍스트)
        default: 'liquid-glass-burgundy',
        // 세컨더리 — 실버 틴트 글래스
        secondary: 'liquid-glass-tint',
        // 위험 — 화이트 글래스에 레드 텍스트만
        destructive: 'liquid-glass text-destructive',
        // 클리어 글래스 아웃라인
        outline: 'liquid-glass',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
