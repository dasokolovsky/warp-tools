'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Edit3, Settings, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DeductionTemplate } from '@/db/schema';

const DEFAULT_SETTINGS = {
  companyName: 'Warp Tools Transport',
  companyAddress: '123 Freight Ave, Logistics City, CA 90210',
  defaultPeriod: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState<DeductionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    amount: '',
    is_percentage: false,
    category: 'other' as const,
    frequency: 'per_settlement' as const,
  });

  useEffect(() => {
    const saved = localStorage.getItem('ds-settings');
    if (saved) setSettings(JSON.parse(saved));

    fetch('/api/deduction-templates')
      .then((res) => res.json())
      .then((json) => setTemplates(json.templates))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('ds-settings', JSON.stringify(settings));
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  const saveTemplate = async (id?: number) => {
    const body = id ? { ...newTemplate, id } : newTemplate;
    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/api/deduction-templates/${id}` : '/api/deduction-templates';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      fetch('/api/deduction-templates').then((r) => r.json()).then((json) => setTemplates(json.templates));
      if (id) setEditingTemplate(null);
      else setNewTemplate({ name: '', amount: '', is_percentage: false, category: 'other', frequency: 'per_settlement' });
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/deduction-templates/${id}`, { method: 'DELETE' });
    fetch('/api/deduction-templates').then((r) => r.json()).then((json) => setTemplates(json.templates));
  };

  if (loading) return <div className="p-6 text-center text-[#8B95A5]">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Company Info */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Company Information
        </h2>
        <p className="text-sm text-[#8B95A5]">Used on print statements</p>
        <div className="space-y-3">
          <input
            className="w-full rounded-lg bg-[#1A2235] border border-[#243050] px-4 py-3 text-lg text-white focus:outline-none"
            placeholder="Company Name"
            value={settings.companyName}
            onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))}
          />
          <textarea
            className="w-full rounded-lg bg-[#1A2235] border border-[#243050] px-4 py-3 text-white focus:outline-none resize-vertical h-24"
            placeholder="Address"
            value={settings.companyAddress}
            onChange={(e) => setSettings((s) => ({ ...s, companyAddress: e.target.value }))}
          />
        </div>
        <select
          className="rounded-lg bg-[#1A2235] border border-[#243050] px-4 py-3 text-white focus:outline-none w-fit"
          value={settings.defaultPeriod}
          onChange={(e) => setSettings((s) => ({ ...s, defaultPeriod: e.target.value as any }))}
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#00C650] px-6 py-3 rounded-xl text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-all disabled:opacity-50 w-fit"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Deduction Templates */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-lg font-bold text-white">Deduction Templates</h2>
          <p className="text-sm text-[#8B95A5]">Auto-applied to new settlements (active only)</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Add New */}
          <div className="p-4 bg-[#0C1528] rounded-lg border border-[#243050]">
            <h3 className="text-sm font-semibold text-white mb-3">Add Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="rounded-lg bg-[#1A2235] border px-3 py-2 text-sm"
                placeholder="Name (e.g. Insurance)"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate((t) => ({ ...t, name: e.target.value }))}
              />
              <input
                type="number"
                step="0.01"
                className="rounded-lg bg-[#1A2235] border px-3 py-2 text-sm"
                placeholder="Amount"
                value={newTemplate.amount}
                onChange={(e) => setNewTemplate((t) => ({ ...t, amount: e.target.value }))}
              />
              <select
                className="rounded-lg bg-[#1A2235] border px-3 py-2 text-sm"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate((t) => ({ ...t, category: e.target.value as any }))}
              >
                <option value="insurance">Insurance</option>
                <option value="lease">Lease</option>
                <option value="eld">ELD</option>
                <option value="fuel_advance">Fuel Advance</option>
                <option value="toll">Toll</option>
                <option value="ticket">Ticket</option>
                <option value="repair">Repair</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newTemplate.is_percentage}
                    onChange={(e) => setNewTemplate((t) => ({ ...t, is_percentage: e.target.checked }))}
                  />
                  Percentage
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(newTemplate.frequency as string) === 'monthly'}
                    onChange={(e) => setNewTemplate((t) => ({ ...t, frequency: e.target.checked ? 'monthly' : 'per_settlement' as any }))}
                  />
                  Monthly
                </label>
              </div>
            </div>
            <button
              onClick={() => saveTemplate()}
              disabled={!newTemplate.name || !newTemplate.amount}
              className="mt-3 inline-flex items-center gap-2 bg-[#00C650] px-4 py-2 rounded-lg text-sm font-semibold text-black hover:bg-[#00C650]/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-[#1A2235]">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 px-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[#00C650]">{t.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-400/10 text-blue-400 capitalize">{t.category}</span>
                  <span className="text-xs text-slate-400">
                    {t.is_percentage ? `${t.amount}%` : formatCurrency(t.amount)} {t.frequency.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={t.active}
                      className="rounded"
                      onChange={async () => saveTemplate(t.id)}
                    />
                    Active
                  </label>
                  <button
                    onClick={() => {
                      setEditingTemplate(t.id);
                      setNewTemplate({
                        name: t.name,
                        amount: String(t.amount),
                        is_percentage: t.is_percentage,
                        category: t.category as any,
                        frequency: t.frequency as any,
                      });
                    }}
                    className="p-1 text-[#8B95A5] hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1 text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
