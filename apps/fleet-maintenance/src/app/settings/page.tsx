'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface SettingsData {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  default_oil_change_interval_miles: number;
  default_oil_change_interval_days: number;
  default_dot_annual_interval_days: number;
  default_brake_inspection_interval_miles: number;
  notify_days_before: number;
  notify_on_overdue: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  default_oil_change_interval_miles: 15000,
  default_oil_change_interval_days: 90,
  default_dot_annual_interval_days: 365,
  default_brake_inspection_interval_miles: 50000,
  notify_days_before: 7,
  notify_on_overdue: true,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Settings saved');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof SettingsData, value: string | number | boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading settings...</div>;

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
          <Settings className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Company info and default intervals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Company Information</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Company Name</label>
            <input
              value={settings.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none"
              placeholder="My Trucking Co."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Address</label>
            <input
              value={settings.company_address}
              onChange={(e) => update('company_address', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none"
              placeholder="123 Main St, Dallas, TX 75201"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone</label>
              <input
                value={settings.company_phone}
                onChange={(e) => update('company_phone', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => update('company_email', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none"
                placeholder="fleet@mycompany.com"
              />
            </div>
          </div>
        </div>

        {/* Default PM Intervals */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Default PM Intervals</h2>
          <p className="text-xs text-zinc-500">These defaults are applied when creating new maintenance schedules.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Oil Change (miles)</label>
              <input
                type="number"
                min="0"
                value={settings.default_oil_change_interval_miles}
                onChange={(e) => update('default_oil_change_interval_miles', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Oil Change (days)</label>
              <input
                type="number"
                min="0"
                value={settings.default_oil_change_interval_days}
                onChange={(e) => update('default_oil_change_interval_days', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">DOT Annual (days)</label>
              <input
                type="number"
                min="0"
                value={settings.default_dot_annual_interval_days}
                onChange={(e) => update('default_dot_annual_interval_days', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Brake Inspection (miles)</label>
              <input
                type="number"
                min="0"
                value={settings.default_brake_inspection_interval_miles}
                onChange={(e) => update('default_brake_inspection_interval_miles', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Notifications</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Alert days before due</label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.notify_days_before}
                onChange={(e) => update('notify_days_before', parseInt(e.target.value) || 7)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_on_overdue}
              onChange={(e) => update('notify_on_overdue', e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-[#00C650]"
            />
            <span className="text-sm text-zinc-300">Alert on overdue maintenance</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
