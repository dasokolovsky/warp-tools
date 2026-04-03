import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Carrier Management — Warp Tools',
  description: 'Free, open-source carrier relationship management for freight brokers and shippers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-60 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
