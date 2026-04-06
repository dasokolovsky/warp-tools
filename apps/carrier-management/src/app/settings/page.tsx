'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    defaultCurrency: 'USD',
    insuranceWarningDays: '30',
    defaultEquipment: 'dry_van',
    pageSize: '25',
    dateFormat: 'MM/DD/YYYY',
  });

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // In v1, settings are local-only (stored in localStorage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('warp-carrier-settings', JSON.stringify(settings));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Load from localStorage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('warp-carrier-settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings((s) => ({ ...s, ...parsed }));
        } catch {}
      }
    }
  });

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5">Configure your carrier management preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Company</h2>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Your company name"
              className={inputClass}
            />
            <p className="text-xs text-[#8B95A5]/60 mt-1">Shown on reports and exports</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => set('defaultCurrency', e.target.value)}
              className={inputClass}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="MXN">MXN — Mexican Peso</option>
            </select>
          </div>
        </div>

        {/* Compliance */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Compliance</h2>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Insurance Warning Threshold</label>
            <select
              value={settings.insuranceWarningDays}
              onChange={(e) => set('insuranceWarningDays', e.target.value)}
              className={inputClass}
            >
              <option value="14">14 days before expiry</option>
              <option value="30">30 days before expiry</option>
              <option value="45">45 days before expiry</option>
              <option value="60">60 days before expiry</option>
              <option value="90">90 days before expiry</option>
            </select>
            <p className="text-xs text-[#8B95A5]/60 mt-1">Certificates expiring within this window show as &quot;Expiring Soon&quot;</p>
          </div>
        </div>

        {/* Display */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Display</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Default Equipment Filter</label>
              <select
                value={settings.defaultEquipment}
                onChange={(e) => set('defaultEquipment', e.target.value)}
                className={inputClass}
              >
                <option value="all">All Equipment</option>
                <option value="dry_van">Dry Van</option>
                <option value="reefer">Reefer</option>
                <option value="flatbed">Flatbed</option>
                <option value="step_deck">Step Deck</option>
                <option value="lowboy">Lowboy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Items Per Page</label>
              <select
                value={settings.pageSize}
                onChange={(e) => set('pageSize', e.target.value)}
                className={inputClass}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => set('dateFormat', e.target.value)}
              className={inputClass}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
          <h2 className="text-sm font-semibold text-white mb-3">About</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B95A5]">Version</span>
              <span className="text-sm text-white font-mono">0.0.1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B95A5]">Database</span>
              <span className="text-sm text-white font-mono">SQLite (local)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B95A5]">License</span>
              <span className="text-sm text-white font-mono">MIT</span>
            </div>
            <div className="pt-3 border-t border-[#1A2235]">
              <a
                href="https://github.com/wearewarp/warp-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00C650] hover:underline"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          className="w-full py-2.5 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
