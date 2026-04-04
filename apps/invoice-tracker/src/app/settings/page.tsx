'use client';

import { useState } from 'react';
import { Save, Check, Building2, FileText, CreditCard, DollarSign, Info } from 'lucide-react';

const STORAGE_KEY = 'warp-invoice-settings';

const defaultSettings = {
  companyName: '',
  companyStreet: '',
  companyCity: '',
  companyState: '',
  companyZip: '',
  companyEmail: '',
  companyPhone: '',
  invoicePrefix: 'INV',
  invoiceNextSeq: '1001',
  defaultPaymentTerms: 'net_30',
  defaultTaxRate: '0',
  quickPayDiscount: '3',
};

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<typeof defaultSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {}
      }
    }
    return defaultSettings;
  });

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5">Company info, invoice defaults, and payment preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-[#00C650]" />
            <h2 className="text-sm font-semibold text-white">Company Info</h2>
          </div>
          <p className="text-xs text-[#8B95A5]/70 -mt-2">Appears on invoice headers and reports</p>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Acme Freight LLC"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Street Address</label>
            <input
              type="text"
              value={settings.companyStreet}
              onChange={(e) => set('companyStreet', e.target.value)}
              placeholder="123 Main St"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">City</label>
              <input
                type="text"
                value={settings.companyCity}
                onChange={(e) => set('companyCity', e.target.value)}
                placeholder="Chicago"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">State</label>
              <input
                type="text"
                value={settings.companyState}
                onChange={(e) => set('companyState', e.target.value)}
                placeholder="IL"
                maxLength={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">ZIP</label>
              <input
                type="text"
                value={settings.companyZip}
                onChange={(e) => set('companyZip', e.target.value)}
                placeholder="60601"
                maxLength={10}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Email</label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => set('companyEmail', e.target.value)}
                placeholder="billing@yourcompany.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Phone</label>
              <input
                type="tel"
                value={settings.companyPhone}
                onChange={(e) => set('companyPhone', e.target.value)}
                placeholder="(312) 555-0100"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Invoice Numbering */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-[#00C650]" />
            <h2 className="text-sm font-semibold text-white">Invoice Numbering</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => set('invoicePrefix', e.target.value.toUpperCase())}
                placeholder="INV"
                maxLength={6}
                className={inputClass}
              />
              <p className="text-xs text-[#8B95A5]/60 mt-1">e.g. INV, WARP, 2024</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Next Sequence #</label>
              <input
                type="number"
                value={settings.invoiceNextSeq}
                onChange={(e) => set('invoiceNextSeq', e.target.value)}
                min={1}
                className={inputClass}
              />
              <p className="text-xs text-[#8B95A5]/60 mt-1">
                Next invoice: {settings.invoicePrefix || 'INV'}-{settings.invoiceNextSeq || '1001'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Defaults */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-[#00C650]" />
            <h2 className="text-sm font-semibold text-white">Payment Defaults</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Default Payment Terms</label>
            <select
              value={settings.defaultPaymentTerms}
              onChange={(e) => set('defaultPaymentTerms', e.target.value)}
              className={inputClass}
            >
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
              <option value="quick_pay">Quick Pay (immediate with discount)</option>
              <option value="factored">Factored</option>
            </select>
            <p className="text-xs text-[#8B95A5]/60 mt-1">Applied to new customers by default</p>
          </div>
        </div>

        {/* Financial Defaults */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-[#00C650]" />
            <h2 className="text-sm font-semibold text-white">Financial Defaults</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Default Tax Rate (%)</label>
              <input
                type="number"
                value={settings.defaultTaxRate}
                onChange={(e) => set('defaultTaxRate', e.target.value)}
                min={0}
                max={100}
                step={0.1}
                placeholder="0"
                className={inputClass}
              />
              <p className="text-xs text-[#8B95A5]/60 mt-1">Applied to new invoices</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Quick Pay Discount (%)</label>
              <input
                type="number"
                value={settings.quickPayDiscount}
                onChange={(e) => set('quickPayDiscount', e.target.value)}
                min={0}
                max={100}
                step={0.1}
                placeholder="3"
                className={inputClass}
              />
              <p className="text-xs text-[#8B95A5]/60 mt-1">Default discount for quick pay</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-[#00C650]" />
            <h2 className="text-sm font-semibold text-white">About</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B95A5]">Version</span>
              <span className="text-sm text-white font-mono">0.1.0</span>
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
                href="https://github.com/dasokolovsky/warp-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00C650] hover:underline"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>

        {/* Save Button */}
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
