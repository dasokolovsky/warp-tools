'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import type { CustomerTariff } from '@/db/schema';

interface AddTariffModalProps {
  laneId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tariff: CustomerTariff) => void;
  editTariff?: CustomerTariff | null;
}

const RATE_BASIS_OPTIONS = [
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'flat', label: 'Flat' },
  { value: 'per_cwt', label: 'Per CWT' },
  { value: 'per_pallet', label: 'Per Pallet' },
];

const TARIFF_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
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

export function AddTariffModal({ laneId, open, onOpenChange, onSuccess, editTariff }: AddTariffModalProps) {
  const isEdit = !!editTariff;

  const [form, setForm] = useState(() => ({
    customer_name: editTariff?.customer_name ?? '',
    rate_amount: editTariff?.rate_amount?.toString() ?? '',
    rate_basis: editTariff?.rate_basis ?? 'per_mile',
    contract_ref: editTariff?.contract_ref ?? '',
    effective_date: editTariff?.effective_date ?? '',
    expiry_date: editTariff?.expiry_date ?? '',
    status: editTariff?.status ?? 'active',
    notes: editTariff?.notes ?? '',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name || !form.rate_amount) {
      setError('Customer name and rate are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEdit
        ? `/api/lanes/${laneId}/tariffs/${editTariff!.id}`
        : `/api/lanes/${laneId}/tariffs`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate_amount: parseFloat(form.rate_amount),
          contract_ref: form.contract_ref || null,
          effective_date: form.effective_date || null,
          expiry_date: form.expiry_date || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to save tariff');
      }

      const tariff = await res.json() as CustomerTariff;
      onSuccess(tariff);
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
              {isEdit ? 'Edit Customer Tariff' : 'Add Customer Tariff'}
            </Dialog.Title>
            <Dialog.Close className="text-[#8B95A5] hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Customer Name" required>
              <input
                className={inputClass}
                value={form.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                placeholder="e.g. Dallas Distribution Co"
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
                  placeholder="e.g. 2.65"
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
              <InputField label="Contract Ref">
                <input
                  className={inputClass}
                  value={form.contract_ref}
                  onChange={e => handleChange('contract_ref', e.target.value)}
                  placeholder="e.g. DDC-2025-001"
                />
              </InputField>
              <InputField label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  {TARIFF_STATUS_OPTIONS.map(opt => (
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
                {isEdit ? 'Save Changes' : 'Add Tariff'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
