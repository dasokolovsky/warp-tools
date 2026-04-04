import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rate Confirmation Generator — Warp Tools',
  description: 'Free, open-source rate confirmation document generator for freight brokers. Build professional rate cons instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
