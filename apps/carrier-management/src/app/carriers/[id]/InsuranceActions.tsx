'use client';

import { useState } from 'react';
import { Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CarrierInsurance } from '@/db/schema';

interface InsuranceActionsProps {
  insurance: CarrierInsurance;
  carrierId: string;
}

export function InsuranceActions({ insurance, carrierId }: InsuranceActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const res = await fetch(`/api/carriers/${carrierId}/insurance/${insurance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update insurance');
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/carriers/${carrierId}/insurance/${insurance.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete insurance');
      setDeleteConfirm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditOpen(true)}
          className="p-1.5 rounded-md text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-all"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="p-1.5 rounded-md text-[#8B95A5] hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-all"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Edit Insurance</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                    Type <span className="text-[#FF4444]">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue={insurance.type}
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
                    defaultValue={insurance.provider ?? ''}
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
                    defaultValue={insurance.policyNumber ?? ''}
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
                    defaultValue={insurance.coverageAmount ?? ''}
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
                    defaultValue={insurance.effectiveDate ?? ''}
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
                    defaultValue={insurance.expiryDate}
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[#FF4444]">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-2">Delete Insurance</h2>
            <p className="text-sm text-[#8B95A5] mb-5">
              Are you sure you want to delete this insurance record? This cannot be undone.
            </p>
            {error && <p className="text-sm text-[#FF4444] mb-3">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF4444] hover:bg-[#E03C3C] text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
