'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface DeleteCarrierButtonProps {
  carrierId: string;
  carrierName: string;
}

export function DeleteCarrierButton({ carrierId, carrierName }: DeleteCarrierButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/carriers/${carrierId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete carrier');
      }

      toast({ message: `${carrierName} has been deleted`, type: 'success' });
      router.push('/carriers');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast({ message: msg, type: 'error' });
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF4444]/10 border border-[#FF4444]/20 hover:bg-[#FF4444]/20 hover:border-[#FF4444]/40 text-sm text-[#FF4444] transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Delete Carrier</h2>
              <button
                onClick={() => !loading && setOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-[#FF4444]" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Delete &ldquo;{carrierName}&rdquo;?
                  </p>
                  <p className="text-sm text-[#8B95A5] mt-1">
                    This cannot be undone. All associated contacts, insurance, rates, and performance records will be permanently removed.
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF4444] hover:bg-[#E03D3D] text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? 'Deleting...' : 'Delete Carrier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
