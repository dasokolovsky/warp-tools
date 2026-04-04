import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Driver Settlement Calculator | Warp Tools',
  description:
    'Free driver pay calculator — enter trips, select pay type (per-mile, percentage, flat, hourly, per-stop), add deductions and reimbursements, get your net settlement instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
