import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
