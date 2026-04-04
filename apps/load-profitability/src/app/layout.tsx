import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Load Profitability Calculator — Warp Tools',
  description:
    'True cost-per-load analysis for trucking companies and owner-operators. Factor in fuel, driver pay, tolls, maintenance, insurance, truck payment, deadhead, and overhead. Free, open-source.',
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
