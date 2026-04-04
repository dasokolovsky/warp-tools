'use client';

import { useState, useEffect } from 'react';
import { Save, CheckSquare, Square } from 'lucide-react';
import { useToast } from './Toast';

type LoadStatus = 'booked' | 'in_transit' | 'delivered' | 'invoiced';
type DocType = 'bol' | 'pod' | 'rate_confirmation' | 'invoice';

const ALL_DOC_TYPES: DocType[] = ['bol', 'pod', 'rate_confirmation', 'invoice'];
const ALL_STATUSES: LoadStatus[] = ['booked', 'in_transit', 'delivered', 'invoiced'];

const STATUS_LABELS: Record<LoadStatus, string> = {
  booked: 'Booked',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  bol: 'Bill of Lading (BOL)',
  pod: 'Proof of Delivery (POD)',
  rate_confirmation: 'Rate Confirmation',
  invoice: 'Invoice',
};

const DEFAULTS: Record<LoadStatus, DocType[]> = {
  booked: ['rate_confirmation'],
  in_transit: ['bol', 'rate_confirmation'],
  delivered: ['bol', 'pod', 'rate_confirmation'],
  invoiced: ['bol', 'pod', 'rate_confirmation', 'invoice'],
};

const STORAGE_KEY = 'docvault:required-docs-config';

function loadFromStorage(): Record<LoadStatus, DocType[]> {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULTS;
}

export function SettingsClient() {
  const [config, setConfig] = useState<Record<LoadStatus, DocType[]>>(() => loadFromStorage());
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const toggle = (status: LoadStatus, docType: DocType) => {
    setConfig((prev) => {
      const current = prev[status] ?? [];
      const updated = current.includes(docType)
        ? current.filter((t) => t !== docType)
        : [...current, docType];
      return { ...prev, [status]: updated };
    });
    setSaved(false);
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaved(true);
      toast({ message: 'Settings saved!', type: 'success' });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast({ message: 'Failed to save settings', type: 'error' });
    }
  };

  return (
    <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Required Documents per Load Status</h2>
      </div>
      <p className="text-sm text-[#8B95A5] mb-5">
        Configure which documents are required before a load can be considered complete at each status.
      </p>

      <div className="space-y-5">
        {ALL_STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-[#1A2235] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0C1528] border-b border-[#1A2235]">
              <span className="text-sm font-medium text-white">{STATUS_LABELS[status]}</span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {ALL_DOC_TYPES.map((docType) => {
                const checked = config[status]?.includes(docType) ?? false;
                return (
                  <button
                    key={docType}
                    onClick={() => toggle(status, docType)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all ${
                      checked
                        ? 'border-[#00C650]/30 bg-[#00C650]/10 text-[#00C650]'
                        : 'border-[#1A2235] bg-[#080F1E] text-[#8B95A5] hover:text-white'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {DOC_TYPE_LABELS[docType]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-[#00C650]">Saved!</span>
        )}
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 bg-[#00C650] hover:bg-[#00A842] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
