'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { CarrierRate } from '@/db/schema';

interface AddCarrierRateModalProps {
  laneId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (rate: CarrierRate) => void;
  editRate?: CarrierRate | null;
}

const RATE_BASIS_OPTIONS = [
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'flat', label: 'Flat' },
  { value: 'per_cwt', label: 'Per CWT' },
  { value: 'per_pallet', label: 'Per Pallet' },
];

const RATE_TYPE_OPTIONS = [
  { value: 'spot', label: 'Spot' },
  { value: 'contract', label: 'Contract' },
];

const SOURCE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'rfq', label: 'RFQ' },
  { value: 'website', label: 'Website' },
];

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 transition-colors';

export function AddCarrierRateModal({ laneId, open, onOpenChange, onSuccess, editRate }: AddCarrierRateModalProps) {
  const isEdit = !!editRate;

  const [form, setForm] = useState(() => ({
    carrier_name: editRate?.carrier_name ?? '',
    rate_amount: editRate?.rate_amount?.toString() ?? '',
    rate_basis: editRate?.rate_basis ?? 'per_mile',
    rate_type: editRate?.rate_type ?? 'spot',
    effective_date: editRate?.effective_date ?? '',
    expiry_date: editRate?.expiry_date ?? '',
    contact_name: editRate?.contact_name ?? '',
    contact_email: editRate?.contact_email ?? '',
    source: editRate?.source ?? 'email',
    notes: editRate?.notes ?? '',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.carrier_name || !form.rate_amount) {
      setError('Carrier name and rate are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/lanes/${laneId}/carrier-rates/${editRate!.id}`
        : `/api/lanes/${laneId}/carrier-rates`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate_amount: parseFloat(form.rate_amount),
          effective_date: form.effective_date || null,
          expiry_date: form.expiry_date || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to save rate');
      }

      const rate = await res.json() as CarrierRate;
      onSuccess(rate);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#080F1E] border border-[#1A2235] rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold text-white">
              {isEdit ? 'Edit Carrier Rate' : 'Add Carrier Rate'}
            </Dialog.Title>
            <Dialog.Close className="text-[#8B95A5] hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Carrier Name" required>
              <input
                className={inputClass}
                value={form.carrier_name}
                onChange={e => handleChange('carrier_name', e.target.value)}
                placeholder="e.g. Apex Freight Solutions"
              />
            </InputField>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Rate Amount" required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={form.rate_amount}
                  onChange={e => handleChange('rate_amount', e.target.value)}
                  placeholder="e.g. 2.15"
                />
              </InputField>
              <InputField label="Rate Basis" required>
                <select
                  className={inputClass}
                  value={form.rate_basis}
                  onChange={e => handleChange('rate_basis', e.target.value)}
                >
                  {RATE_BASIS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </InputField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Rate Type" required>
                <select
                  className={inputClass}
                  value={form.rate_type}
                  onChange={e => handleChange('rate_type', e.target.value)}
                >
                  {RATE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </InputField>
              <InputField label="Source">
                <select
                  className={inputClass}
                  value={form.source}
                  onChange={e => handleChange('source', e.target.value)}
                >
                  {SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </InputField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Effective Date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.effective_date}
                  onChange={e => handleChange('effective_date', e.target.value)}
                />
              </InputField>
              <InputField label="Expiry Date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.expiry_date}
                  onChange={e => handleChange('expiry_date', e.target.value)}
                />
              </InputField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Contact Name">
                <input
                  className={inputClass}
                  value={form.contact_name}
                  onChange={e => handleChange('contact_name', e.target.value)}
                  placeholder="Contact person"
                />
              </InputField>
              <InputField label="Contact Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.contact_email}
                  onChange={e => handleChange('contact_email', e.target.value)}
                  placeholder="email@example.com"
                />
              </InputField>
            </div>

            <InputField label="Notes">
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Optional notes..."
              />
            </InputField>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Dialog.Close className="flex-1 px-4 py-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white text-sm transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-[#00C650] text-black font-semibold text-sm hover:bg-[#00B348] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Add Rate'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
