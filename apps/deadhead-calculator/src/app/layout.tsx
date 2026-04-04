import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deadhead Mileage Calculator — Warp Tools',
  description:
    'Free deadhead mileage calculator for truckers and freight brokers. Calculate the true cost of empty miles, effective rate per mile, and whether a load is worth taking. No account needed.',
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
