'use client';

import { useState, useCallback } from 'react';
import { Menu, Wrench } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={open} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden md:ml-60">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-[#09090b] px-4 py-3 md:hidden flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00C650]/10 border border-[#00C650]/20">
              <Wrench className="h-3.5 w-3.5 text-[#00C650]" />
            </div>
            <span className="text-sm font-semibold text-white">Fleet Maintenance</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
