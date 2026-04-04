'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';
import type { ShipmentStatus } from '@/db/schema';

interface Props {
  shipmentId: string;
  status: ShipmentStatus;
}

const NEXT_ACTION: Partial<Record<ShipmentStatus, { label: string; status: ShipmentStatus; variant: 'green' | 'default' | 'yellow' }>> = {
  quote: { label: 'Book Shipment', status: 'booked', variant: 'green' },
  booked: { label: 'Dispatch', status: 'dispatched', variant: 'green' },
  dispatched: { label: 'Mark Picked Up', status: 'in_transit', variant: 'default' },
  in_transit: { label: 'Mark Delivered', status: 'delivered', variant: 'default' },
  delivered: { label: 'Mark Invoiced', status: 'invoiced', variant: 'yellow' },
  invoiced: { label: 'Mark Paid', status: 'paid', variant: 'green' },
  paid: { label: 'Close Shipment', status: 'closed', variant: 'default' },
};

const TERMINAL: ShipmentStatus[] = ['closed', 'cancelled', 'claim'];

export function StatusActionButtons({ shipmentId, status }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const nextAction = NEXT_ACTION[status];
  const canCancel = !TERMINAL.includes(status);

  async function advanceStatus(newStatus: ShipmentStatus, cancelReason?: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(cancelReason ? { cancellationReason: cancelReason } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Failed to update status', type: 'error' });
        return;
      }
      toast({ message: `Status updated successfully`, type: 'success' });
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    await advanceStatus('cancelled', cancelReason.trim());
    setShowCancel(false);
    setCancelReason('');
  }

  const variantClass: Record<string, string> = {
    green: 'bg-[#00C650] text-black hover:bg-[#00C650]/90',
    default: 'bg-[#1A2235] text-white hover:bg-[#2A3245] border border-[#2A3245]',
    yellow: 'bg-yellow-500 text-black hover:bg-yellow-400',
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {nextAction && (
          <button
            onClick={() => advanceStatus(nextAction.status)}
            disabled={loading !== null}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[nextAction.variant]}`}
          >
            {loading === nextAction.status && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {nextAction.label}
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => setShowCancel(true)}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            Cancel Shipment
          </button>
        )}
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-5 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Cancel Shipment</h2>
              <p className="text-xs text-[#8B95A5] mt-1">Please provide a reason for cancellation.</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-red-400 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowCancel(false); setCancelReason(''); }}
                  className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || loading !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === 'cancelled' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cancel Shipment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
