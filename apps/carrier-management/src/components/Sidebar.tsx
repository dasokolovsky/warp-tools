'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  DollarSign,
  Settings,
  Zap,
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/carriers', label: 'Carriers', icon: Truck },
  { href: '/rates', label: 'Rates', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[#080F1E] border-r border-[#1A2235]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1A2235]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C650]/10 border border-[#00C650]/20">
          <Zap className="h-4 w-4 text-[#00C650]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-none">Carrier</div>
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8B95A5] hover:bg-[#0C1528] hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 px-3 py-2">
          <div className="text-xs text-[#8B95A5]">Warp Tools</div>
          <div className="text-[10px] text-[#8B95A5]/50 mt-0.5">Open-source logistics</div>
        </div>
      </div>
    </aside>
  );
}
