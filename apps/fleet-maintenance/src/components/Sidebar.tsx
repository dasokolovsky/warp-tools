'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  FileCheck,
  Package,
  Settings,
  Wrench,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { href: '/dvirs', label: 'DVIRs', icon: FileCheck },
  { href: '/parts', label: 'Parts', icon: Package },
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
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#111113] border-r border-zinc-800',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C650]/10 border border-[#00C650]/20">
          <Wrench className="h-4 w-4 text-[#00C650]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">Fleet</div>
          <div className="text-xs text-zinc-500 mt-0.5">Maintenance</div>
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
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-[#00C650]' : '')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <Link
          href="/settings"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-[#00C650]/10 text-[#00C650]'
              : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
          )}
        >
          <Settings className={cn('h-4 w-4', pathname === '/settings' ? 'text-[#00C650]' : '')} />
          Settings
        </Link>
        <div className="mt-3 px-3 py-2">
          <div className="text-xs text-zinc-500">Warp Tools</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">Open-source logistics</div>
        </div>
      </div>
    </aside>
  );
}
