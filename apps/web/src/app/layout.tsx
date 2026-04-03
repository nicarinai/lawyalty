import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Midnight Mermaid',
  description: 'Real-time collaborative Mermaid diagram editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
