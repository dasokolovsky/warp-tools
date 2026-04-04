'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Check } from 'lucide-react';

const RATE_BASIS_OPTIONS = [
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'flat', label: 'Flat' },
  { value: 'per_cwt', label: 'Per CWT' },
  { value: 'per_pallet', label: 'Per Pallet' },
];

interface RateSettings {
  targetMargin: number;
  defaultRateBasis: string;
  rfqPrefix: string;
  expiryWarningDays: number;
  companyName: string;
}

const DEFAULTS: RateSettings = {
  targetMargin: 15,
  defaultRateBasis: 'per_mile',
  rfqPrefix: 'RFQ',
  expiryWarningDays: 30,
  companyName: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<RateSettings>(() => DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rateSettings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULTS, ...parsed });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  function handleSave() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rateSettings', JSON.stringify(settings));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function update<K extends keyof RateSettings>(key: K, value: RateSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#00C650]" />
          Settings
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Configure your rate management preferences. Saved to your browser.</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Rate & Margin</h2>

        {/* Target Margin */}
        <div>
          <label className="block text-sm text-white mb-1">Target Margin %</label>
          <p className="text-xs text-[#8B95A5] mb-2">Alert when lane margin falls below this threshold.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={settings.targetMargin}
              onChange={e => update('targetMargin', Number(e.target.value))}
              className="w-24 bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            />
            <span className="text-sm text-[#8B95A5]">%</span>
          </div>
        </div>

        {/* Default Rate Basis */}
        <div>
          <label className="block text-sm text-white mb-1">Default Rate Basis</label>
          <p className="text-xs text-[#8B95A5] mb-2">Pre-selected when adding new carrier rates.</p>
          <select
            value={settings.defaultRateBasis}
            onChange={e => update('defaultRateBasis', e.target.value)}
            className="bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            {RATE_BASIS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Expiry Warning Days */}
        <div>
          <label className="block text-sm text-white mb-1">Rate Expiry Warning Days</label>
          <p className="text-xs text-[#8B95A5] mb-2">Show alerts for rates and tariffs expiring within this many days.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              value={settings.expiryWarningDays}
              onChange={e => update('expiryWarningDays', Number(e.target.value))}
              className="w-24 bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            />
            <span className="text-sm text-[#8B95A5]">days</span>
          </div>
        </div>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">RFQ Settings</h2>

        {/* RFQ Prefix */}
        <div>
          <label className="block text-sm text-white mb-1">RFQ Number Prefix</label>
          <p className="text-xs text-[#8B95A5] mb-2">Prefix for auto-generated RFQ numbers (e.g. &quot;RFQ&quot; → RFQ-2026-001).</p>
          <input
            type="text"
            value={settings.rfqPrefix}
            onChange={e => update('rfqPrefix', e.target.value.toUpperCase())}
            maxLength={10}
            className="bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            placeholder="RFQ"
          />
          <p className="text-xs text-[#8B95A5] mt-1">Preview: {settings.rfqPrefix || 'RFQ'}-{new Date().getFullYear()}-001</p>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm text-white mb-1">Company Name</label>
          <p className="text-xs text-[#8B95A5] mb-2">Used in RFQ email templates.</p>
          <input
            type="text"
            value={settings.companyName}
            onChange={e => update('companyName', e.target.value)}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
            placeholder="Acme Logistics Co."
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 flex-1 mr-4">
          <h2 className="text-sm font-semibold text-white mb-1">About</h2>
          <p className="text-xs text-[#8B95A5]">Rate Management v0.1.0 — Part of the <span className="text-[#00C650]">Warp Tools</span> open-source logistics platform.</p>
          <a href="https://github.com/dasokolovsky/warp-tools" className="text-xs text-[#00C650] hover:underline mt-1 inline-block" target="_blank" rel="noopener noreferrer">
            github.com/dasokolovsky/warp-tools
          </a>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-[#00C650] hover:bg-[#00C650]/90 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
