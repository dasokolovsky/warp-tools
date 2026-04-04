'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart2,
  Settings,
  Route,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shipments', label: 'Shipments', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/carriers', label: 'Carriers', icon: Truck },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#080F1E] border-r border-[#1A2235]',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1A2235]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C650]/10 border border-[#00C650]/20">
          <Route className="h-4 w-4 text-[#00C650]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">Shipment</div>
          <div className="text-xs text-[#8B95A5] mt-0.5">Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#00C650]/10 text-[#00C650]'
                  : 'text-[#8B95A5] hover:bg-[#0C1528] hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-[#00C650]' : '')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1A2235]">
        <Link
          href="/settings"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-[#00C650]/10 text-[#00C650]'
              : 'text-[#8B95A5] hover:bg-[#0C1528] hover:text-white'
          )}
        >
          <Settings className={cn('h-4 w-4', pathname === '/settings' ? 'text-[#00C650]' : '')} />
          Settings
        </Link>
        <div className="mt-3 px-3">
          <div className="text-xs text-[#8B95A5]">Mini TMS</div>
          <div className="text-xs text-[#1A2235] mt-0.5">v0.1.0 · Warp Tools</div>
        </div>
      </div>
    </aside>
  );
}
