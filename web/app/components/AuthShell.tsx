import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** 카드 하단 보조 액션 (예: "계정이 없으신가요? 가입") */
  footer?: ReactNode;
}

/**
 * 인증 화면 공통 셸 — 로고 + 글래스 카드 + 푸터.
 * 디자인: docs/lawyalty/02-auth-ui.md § 2 (공통 레이아웃)
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 헤더 */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="liquid-glass-strong w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold text-ink-700">⚖</span>
          </div>
          <span className="text-[19px] font-bold tracking-tight text-ink-700">라윌티</span>
        </Link>
        <button
          type="button"
          className="liquid-glass-subtle px-3 py-1.5 rounded-full text-[13px] text-ink-500"
          aria-label="언어 선택"
        >
          한국어
        </button>
      </header>

      {/* 메인 카드 */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="liquid-glass-strong w-full max-w-[440px] p-8"
          style={{ borderRadius: 'var(--radius-card)' }}
        >
          <h1 className="text-[26px] font-bold tracking-tight text-ink-700 leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[14px] text-ink-500 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="px-6 py-5 flex flex-wrap items-center justify-center gap-4 text-[12px] text-ink-400">
        {footer}
        <Link to="/legal/privacy" className="hover:text-ink-700">개인정보처리방침</Link>
        <Link to="/legal/terms" className="hover:text-ink-700">이용약관</Link>
        <span>© 2026 Lawyalty</span>
      </footer>
    </div>
  );
}
