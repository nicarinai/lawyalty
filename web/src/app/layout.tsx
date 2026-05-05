import type { Metadata } from 'next';
import './globals.css';
import { LiquidGlassFilters } from '@/components/LiquidGlassFilters';

export const metadata: Metadata = {
  title: '라윌티 — 건축·부동산 규제 AI 검토',
  description: '건축법, 국토계획법, 주택법 등 건축·부동산 규제를 AI로 즉시 검토합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <LiquidGlassFilters />
        <div className="bg-orbs" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
          <span className="orb orb-4" />
        </div>
        {children}
      </body>
    </html>
  );
}
