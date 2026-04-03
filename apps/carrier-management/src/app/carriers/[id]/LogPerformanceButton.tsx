'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface LogPerformanceButtonProps {
  carrierId: string;
}

export function LogPerformanceButton({ carrierId }: LogPerformanceButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      shipmentRef: data.get('shipmentRef') as string || undefined,
      pickupOnTime: data.get('pickupOnTime') === 'yes' ? true : data.get('pickupOnTime') === 'no' ? false : null,
      deliveryOnTime: data.get('deliveryOnTime') === 'yes' ? true : data.get('deliveryOnTime') === 'no' ? false : null,
      damageReported: data.get('damageReported') === 'true',
      claimFiled: data.get('claimFiled') === 'true',
      transitDays: data.get('transitDays') ? Number(data.get('transitDays')) : undefined,
      communicationScore: data.get('communicationScore') ? Number(data.get('communicationScore')) : undefined,
      notes: data.get('notes') as string || undefined,
    };

    try {
      const res = await fetch(`/api/carriers/${carrierId}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to log performance');
      toast({ message: 'Shipment performance logged', type: 'success' });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] text-sm text-[#8B95A5] hover:text-white transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        Log Shipment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Log Shipment Performance</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Shipment Reference</label>
                <input
                  name="shipmentRef"
                  type="text"
                  placeholder="e.g. SHP-001234"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Pickup On Time?</label>
                  <select
                    name="pickupOnTime"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="">—</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Delivery On Time?</label>
                  <select
                    name="deliveryOnTime"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="">—</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Transit Days</label>
                  <input
                    name="transitDays"
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Communication (1–5)</label>
                  <select
                    name="communicationScore"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Damage Reported?</label>
                  <select
                    name="damageReported"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Claim Filed?</label>
                  <select
                    name="claimFiled"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-[#FF4444]">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00C650] hover:bg-[#00B347] text-black font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Log Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
