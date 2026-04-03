'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddRateButtonProps {
  carrierId: string;
}

export function AddRateButton({ carrierId }: AddRateButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      originCity: (data.get('originCity') as string) || null,
      originState: (data.get('originState') as string) || null,
      originZip: (data.get('originZip') as string) || null,
      destCity: (data.get('destCity') as string) || null,
      destState: (data.get('destState') as string) || null,
      destZip: (data.get('destZip') as string) || null,
      equipmentType: (data.get('equipmentType') as string) || null,
      rateType: data.get('rateType') as string,
      rateAmount: Number(data.get('rateAmount')),
      effectiveDate: (data.get('effectiveDate') as string) || null,
      expiryDate: (data.get('expiryDate') as string) || null,
      notes: (data.get('notes') as string) || null,
    };

    try {
      const res = await fetch(`/api/carriers/${carrierId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error?.formErrors?.[0] ?? 'Failed to add rate');
      }
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00C650] hover:bg-[#00B347] text-black font-semibold text-sm transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Rate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235] sticky top-0 bg-[#080F1E] z-10">
              <h2 className="text-base font-semibold text-white">Add Rate</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Origin */}
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-2">Origin</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    name="originCity"
                    type="text"
                    placeholder="City"
                    className="col-span-1 px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                  <input
                    name="originState"
                    type="text"
                    placeholder="State"
                    maxLength={2}
                    className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors uppercase"
                  />
                  <input
                    name="originZip"
                    type="text"
                    placeholder="ZIP"
                    className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-2">Destination</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    name="destCity"
                    type="text"
                    placeholder="City"
                    className="col-span-1 px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                  <input
                    name="destState"
                    type="text"
                    placeholder="State"
                    maxLength={2}
                    className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors uppercase"
                  />
                  <input
                    name="destZip"
                    type="text"
                    placeholder="ZIP"
                    className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Equipment Type</label>
                  <select
                    name="equipmentType"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="">Any</option>
                    <option value="dry_van">Dry Van</option>
                    <option value="reefer">Reefer</option>
                    <option value="flatbed">Flatbed</option>
                    <option value="step_deck">Step Deck</option>
                    <option value="lowboy">Lowboy</option>
                    <option value="sprinter_van">Sprinter Van</option>
                    <option value="cargo_van">Cargo Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Rate Type</label>
                  <select
                    name="rateType"
                    defaultValue="per_mile"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="per_mile">Per Mile</option>
                    <option value="flat">Flat</option>
                    <option value="per_cwt">Per CWT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Rate Amount ($) <span className="text-[#FF4444]">*</span>
                </label>
                <input
                  name="rateAmount"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2.50"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Effective Date</label>
                  <input
                    name="effectiveDate"
                    type="date"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Expiry Date</label>
                  <input
                    name="expiryDate"
                    type="date"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors resize-none"
                />
              </div>

              {error && <p className="text-sm text-[#FF4444]">{error}</p>}

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
                  Add Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
