'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  shipmentId: string;
  customerRate: number | null;
  existingCarrier?: {
    carrierName: string | null;
    carrierContact: string | null;
    carrierPhone: string | null;
    carrierRate: number | null;
  };
  onClose: () => void;
}

export function AssignCarrierModal({ shipmentId, customerRate, existingCarrier, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    carrierName: existingCarrier?.carrierName ?? '',
    carrierContact: existingCarrier?.carrierContact ?? '',
    carrierPhone: existingCarrier?.carrierPhone ?? '',
    carrierRate: existingCarrier?.carrierRate?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const carrierRateNum = parseFloat(form.carrierRate) || null;
  const margin = customerRate != null && carrierRateNum != null
    ? customerRate - carrierRateNum : null;
  const marginPct = customerRate != null && margin != null
    ? (margin / customerRate) * 100 : null;

  const marginColor =
    marginPct == null ? 'text-slate-400' :
    marginPct >= 15 ? 'text-green-400' :
    marginPct >= 10 ? 'text-yellow-400' :
    'text-red-400';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.carrierName.trim()) {
      toast({ message: 'Carrier name is required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        carrierName: form.carrierName.trim(),
        carrierContact: form.carrierContact.trim() || undefined,
        carrierPhone: form.carrierPhone.trim() || undefined,
      };
      if (carrierRateNum != null) {
        payload.carrierRate = carrierRateNum;
      }

      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast({ message: 'Failed to assign carrier', type: 'error' });
        return;
      }

      // Log carrier assign event
      await fetch(`/api/shipments/${shipmentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Carrier assigned: ${form.carrierName.trim()}`,
          eventType: 'carrier_assign',
        }),
      });

      toast({ message: 'Carrier assigned', type: 'success' });
      router.refresh();
      onClose();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-base font-semibold text-white">
            {existingCarrier?.carrierName ? 'Change Carrier' : 'Assign Carrier'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Carrier Name *</label>
            <input
              type="text"
              value={form.carrierName}
              onChange={(e) => handleChange('carrierName', e.target.value)}
              required
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="Carrier name"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Contact Name</label>
            <input
              type="text"
              value={form.carrierContact}
              onChange={(e) => handleChange('carrierContact', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="Contact name"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Phone</label>
            <input
              type="tel"
              value={form.carrierPhone}
              onChange={(e) => handleChange('carrierPhone', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="555-000-0000"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Carrier Rate</label>
            <input
              type="number"
              value={form.carrierRate}
              onChange={(e) => handleChange('carrierRate', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </div>

          {/* Margin preview */}
          {margin != null && (
            <div className="bg-[#0C1528] rounded-lg px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="text-[#8B95A5]">Margin</span>
              <span className={`font-semibold ${marginColor}`}>
                {formatCurrency(margin)} ({marginPct?.toFixed(1)}%)
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {existingCarrier?.carrierName ? 'Update Carrier' : 'Assign Carrier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
