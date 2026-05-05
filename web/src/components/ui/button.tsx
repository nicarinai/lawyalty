import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 모든 버튼은 화이트 리퀴드 글래스. 컬러로 강조하지 않고 엘리베이션과 보더로 위계를 만든다.
const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg text-sm font-medium tracking-tight text-foreground',
    'transition-[border-color,box-shadow,transform,color] duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:translate-y-[0.5px]',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        // CTA — 가장 진한 화이트 글래스. 엘리베이션이 큼.
        default: 'liquid-glass-burgundy hover:[box-shadow:var(--glass-shadow-lg)]',
        // 위험/파괴적 액션 — 글래스 베이스, 텍스트만 레드
        destructive:
          'liquid-glass-strong text-destructive hover:[box-shadow:var(--glass-shadow-md)]',
        // 보조 액션 — 클리어 화이트 글래스
        outline: 'liquid-glass liquid-glass-interactive',
        // 세컨더리 — 실버 틴트 글래스
        secondary: 'liquid-glass-tint liquid-glass-interactive',
        // 고스트 — 평상시 투명, 호버 시 얕은 글래스 점등
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-[var(--glass-bg)] hover:backdrop-blur-md hover:backdrop-saturate-150',
          'hover:border hover:border-[var(--glass-border)]',
          'hover:[box-shadow:var(--glass-shadow-sm)]',
        ].join(' '),
        // 텍스트 링크 (글래스 아님)
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-xl px-6 text-[15px] font-semibold',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
