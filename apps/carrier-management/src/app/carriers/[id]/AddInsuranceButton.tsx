'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddInsuranceButtonProps {
  carrierId: string;
}

export function AddInsuranceButton({ carrierId }: AddInsuranceButtonProps) {
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

    const coverageRaw = data.get('coverageAmount') as string;
    const payload = {
      type: data.get('type') as string,
      provider: (data.get('provider') as string) || null,
      policyNumber: (data.get('policyNumber') as string) || null,
      coverageAmount: coverageRaw ? Number(coverageRaw) : null,
      effectiveDate: (data.get('effectiveDate') as string) || null,
      expiryDate: data.get('expiryDate') as string,
    };

    try {
      const res = await fetch(`/api/carriers/${carrierId}/insurance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error?.formErrors?.[0] ?? 'Failed to add insurance');
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
        Add Insurance
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Add Insurance</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                    Type <span className="text-[#FF4444]">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  >
                    <option value="auto_liability">Auto Liability</option>
                    <option value="cargo">Cargo</option>
                    <option value="general_liability">General Liability</option>
                    <option value="workers_comp">Workers&apos; Comp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Provider</label>
                  <input
                    name="provider"
                    type="text"
                    placeholder="e.g. Travelers"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Policy Number</label>
                  <input
                    name="policyNumber"
                    type="text"
                    placeholder="e.g. POL-12345"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Coverage Amount ($)</label>
                  <input
                    name="coverageAmount"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 1000000"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
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
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                    Expiry Date <span className="text-[#FF4444]">*</span>
                  </label>
                  <input
                    name="expiryDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
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
                  Add Insurance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
