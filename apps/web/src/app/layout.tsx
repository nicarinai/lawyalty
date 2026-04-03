import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LawyaltyAI',
  description: 'The Reliable Legal Compass for Your Urban Vision.',
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
