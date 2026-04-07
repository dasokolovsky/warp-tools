import type { Metadata } from 'next';
import './globals.css';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Fleet Maintenance — Warp Tools',
  description: 'Free, open-source preventive maintenance scheduler, work orders, DVIRs, and FMCSA compliance for trucking fleets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-zinc-200 antialiased">
        <ToastProvider>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
