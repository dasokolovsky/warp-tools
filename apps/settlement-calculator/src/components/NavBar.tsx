'use client';

import { DollarSign, Github } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="border-b border-warp-border bg-warp-card/80 backdrop-blur-sm sticky top-0 z-50 no-print">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warp-accent-muted flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-warp-accent" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">Settlement Calculator</span>
            <span className="text-warp-muted text-xs ml-2">by Warp Tools</span>
          </div>
        </div>
        <a
          href="https://github.com/dasokolovsky/warp-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-warp-muted hover:text-white transition-colors text-sm"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">Open Source</span>
        </a>
      </div>
    </nav>
  );
}
