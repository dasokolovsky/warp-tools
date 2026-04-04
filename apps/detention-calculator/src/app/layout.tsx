import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Detention & Demurrage Calculator — Warp Tools',
  description:
    'Free detention and demurrage fee calculator for truckers and freight brokers. Calculate waiting time fees and container holding charges instantly. No account needed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
