'use client';

import { useRouter, usePathname } from 'next/navigation';

const tabLabels: Record<string, string> = {
  overview: 'Overview',
  contacts: 'Contacts',
  insurance: 'Insurance',
  rates: 'Rates',
  performance: 'Performance',
};

interface CarrierDetailTabsProps {
  activeTab: string;
  tabs: string[];
}

export function CarrierDetailTabs({ activeTab, tabs }: CarrierDetailTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTab = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080F1E] border border-[#1A2235] w-fit">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTab(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab
              ? 'bg-[#0C1528] text-white border border-[#1A2235]'
              : 'text-[#8B95A5] hover:text-white'
          }`}
        >
          {tabLabels[tab] ?? tab}
        </button>
      ))}
    </div>
  );
}
