'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import { SettlementStatusBadge } from '@/components/SettlementStatusBadge';
import { NetPayDisplay } from '@/components/NetPayDisplay';
import { SettlementBreakdown } from '@/components/SettlementBreakdown';
import { DeductionEditor } from '@/components/DeductionEditor';
import { ReimbursementEditor } from '@/components/ReimbursementEditor';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  Settlement,
  Driver,
  Trip,
  SettlementDeduction,
  SettlementReimbursement,
  Advance,
} from '@/db/schema';

interface Props {
  settlement: Settlement;
  driver: Driver | null;
  initialTrips: Trip[];
  initialDeductions: SettlementDeduction[];
  initialReimbursements: SettlementReimbursement[];
  advances: Advance[];
}

interface StatusModalState {
  open: boolean;
  type: 'pay' | 'dispute' | null;
}

function PayModal({ settlementId, onClose, onSuccess }: { settlementId: number; onClose: () => void; onSuccess: () => void }) {
  const [method, setMethod] = useState<'check' | 'ach' | 'wire'>('ach');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    if (!reference.trim()) { setError('Payment reference is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlementId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', payment_method: method, payment_reference: reference }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to mark paid');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
        <h2 className="text-lg font-bold text-white">Mark as Paid</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Payment Method</label>
            <select
              className="w-full rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none"
              value={method}
              onChange={(e) => setMethod(e.target.value as 'check' | 'ach' | 'wire')}
            >
              <option value="ach">ACH Transfer</option>
              <option value="check">Check</option>
              <option value="wire">Wire Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Payment Reference #</label>
            <input
              className="w-full rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none"
              placeholder="e.g. ACH-2026-0042"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg bg-[#1A2235] px-4 py-2 text-sm font-medium text-[#8B95A5] hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputeModal({ settlementId, onClose, onSuccess }: { settlementId: number; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDispute() {
    if (!reason.trim()) { setError('Reason is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlementId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispute', disputed_reason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to dispute');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
        <h2 className="text-lg font-bold text-white">Dispute Settlement</h2>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Reason for Dispute</label>
          <textarea
            className="w-full rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none resize-none"
            rows={4}
            placeholder="Describe the issue..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg bg-[#1A2235] px-4 py-2 text-sm font-medium text-[#8B95A5] hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDispute}
            disabled={loading}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettlementDetailClient({
  settlement: initialSettlement,
  driver,
  initialTrips,
  initialDeductions,
  initialReimbursements,
  advances,
}: Props) {
  const router = useRouter();
  const [settlement, setSettlement] = useState(initialSettlement);
  const [deductions, setDeductions] = useState(initialDeductions);
  const [reimbursements, setReimbursements] = useState(initialReimbursements);
  const [modal, setModal] = useState<StatusModalState>({ open: false, type: null });
  const [actionLoading, setActionLoading] = useState(false);

  const editable = settlement.status === 'open';

  const refreshSettlement = useCallback(async () => {
    const res = await fetch(`/api/settlements/${settlement.id}`);
    if (res.ok) {
      const data = await res.json();
      setSettlement(data.settlement);
      setDeductions(data.deductions);
      setReimbursements(data.reimbursements);
    }
  }, [settlement.id]);

  async function performStatusAction(action: string, extra?: Record<string, string>) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettlement(data.settlement);
      }
    } finally {
      setActionLoading(false);
    }
  }

  function handlePaySuccess() {
    setModal({ open: false, type: null });
    refreshSettlement();
  }

  function handleDisputeSuccess() {
    setModal({ open: false, type: null });
    refreshSettlement();
  }

  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Back nav */}
      <div>
        <button
          onClick={() => router.push('/settlements')}
          className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settlements
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white font-mono">{settlement.settlement_number}</h1>
              <SettlementStatusBadge status={settlement.status} />
            </div>
            <div className="text-base text-slate-300 font-medium">{driverName}</div>
            <div className="text-sm text-[#8B95A5] mt-1">
              {formatDate(settlement.period_start)} – {formatDate(settlement.period_end)}
            </div>
            {driver && (
              <div className="text-xs text-[#8B95A5] mt-0.5 capitalize">
                Pay type: {driver.pay_type.replace('_', ' ')} @ {driver.pay_type === 'percentage' ? `${driver.pay_rate}%` : formatCurrency(driver.pay_rate)}
                {driver.pay_type === 'per_mile' ? '/mi' : driver.pay_type === 'hourly' ? '/hr' : driver.pay_type === 'per_stop' ? '/stop' : ''}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={`/settlements/${settlement.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2235] px-3 py-2 text-xs font-medium text-[#8B95A5] hover:text-white transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </a>

            {settlement.status === 'open' && (
              <button
                onClick={() => performStatusAction('submit')}
                disabled={actionLoading}
                className="rounded-lg bg-yellow-500/20 border border-yellow-500/40 px-3 py-2 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
              >
                Submit for Approval
              </button>
            )}

            {settlement.status === 'submitted' && (
              <button
                onClick={() => performStatusAction('approve', { approved_by: 'Admin' })}
                disabled={actionLoading}
                className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            )}

            {settlement.status === 'approved' && (
              <button
                onClick={() => setModal({ open: true, type: 'pay' })}
                className="rounded-lg bg-[#00C650]/20 border border-[#00C650]/40 px-3 py-2 text-xs font-semibold text-[#00C650] hover:bg-[#00C650]/30 transition-colors"
              >
                Mark Paid
              </button>
            )}

            {settlement.status !== 'paid' && (
              <button
                onClick={() => setModal({ open: true, type: 'dispute' })}
                className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Dispute
              </button>
            )}

            {settlement.status === 'disputed' && (
              <button
                onClick={() => performStatusAction('reopen')}
                disabled={actionLoading}
                className="rounded-lg bg-[#1A2235] px-3 py-2 text-xs font-medium text-[#8B95A5] hover:text-white transition-colors disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disputed reason */}
      {settlement.status === 'disputed' && settlement.disputed_reason && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-red-400 mb-1">Disputed</div>
            <div className="text-sm text-red-300">{settlement.disputed_reason}</div>
          </div>
        </div>
      )}

      {/* Paid info */}
      {settlement.status === 'paid' && (
        <div className="flex items-center gap-6 rounded-xl bg-[#00C650]/5 border border-[#00C650]/20 px-5 py-4">
          <div>
            <div className="text-xs text-[#8B95A5]">Paid Date</div>
            <div className="text-sm font-semibold text-white">{formatDate(settlement.paid_date)}</div>
          </div>
          {settlement.payment_method && (
            <div>
              <div className="text-xs text-[#8B95A5]">Method</div>
              <div className="text-sm font-semibold text-white uppercase">{settlement.payment_method}</div>
            </div>
          )}
          {settlement.payment_reference && (
            <div>
              <div className="text-xs text-[#8B95A5]">Reference</div>
              <div className="text-sm font-semibold text-white font-mono">{settlement.payment_reference}</div>
            </div>
          )}
          {settlement.approved_by && (
            <div>
              <div className="text-xs text-[#8B95A5]">Approved By</div>
              <div className="text-sm font-semibold text-white">{settlement.approved_by}</div>
            </div>
          )}
        </div>
      )}

      {/* Net Pay + Breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NetPayDisplay
          gross={settlement.gross_earnings}
          totalDeductions={settlement.total_deductions}
          totalAdvances={settlement.total_advances}
          totalReimbursements={settlement.total_reimbursements}
          netPay={settlement.net_pay}
        />
        <SettlementBreakdown
          gross={settlement.gross_earnings}
          totalDeductions={settlement.total_deductions}
          totalAdvances={settlement.total_advances}
          totalReimbursements={settlement.total_reimbursements}
          netPay={settlement.net_pay}
        />
      </div>

      {/* Earnings / Trips */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Earnings</h2>
        </div>
        {initialTrips.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">No trips in this settlement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Load</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Lane</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Miles</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Stops</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {initialTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-[#0C1528] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(t.trip_date)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#00C650]">{t.load_ref ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {t.origin_city}, {t.origin_state} → {t.dest_city}, {t.dest_state}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">{t.miles ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">{t.revenue != null ? formatCurrency(t.revenue) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">{t.stops ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">{t.hours ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white text-right tabular-nums">{formatCurrency(t.pay_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#1A2235] bg-[#060C1A]">
                  <td colSpan={7} className="px-4 py-3 text-xs font-medium text-[#8B95A5]">Gross Earnings</td>
                  <td className="px-4 py-3 text-sm font-bold text-white text-right tabular-nums">{formatCurrency(settlement.gross_earnings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Deductions */}
      <DeductionEditor
        settlementId={settlement.id}
        deductions={deductions}
        editable={editable}
        onUpdate={refreshSettlement}
      />

      {/* Reimbursements */}
      <ReimbursementEditor
        settlementId={settlement.id}
        reimbursements={reimbursements}
        editable={editable}
        onUpdate={refreshSettlement}
      />

      {/* Advances */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Advance Deductions</h2>
          <p className="text-xs text-[#8B95A5] mt-0.5">Managed on the driver profile</p>
        </div>
        {advances.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">No advances deducted in this period.</div>
        ) : (
          <>
            <div className="divide-y divide-[#1A2235]">
              {advances.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm text-white">{a.reason ?? 'Cash advance'}</div>
                    <div className="text-xs text-[#8B95A5] mt-0.5">{formatDate(a.date)} · {a.status}</div>
                  </div>
                  <span className="text-sm font-semibold text-orange-400 tabular-nums">−{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#1A2235] flex justify-between items-center bg-[#060C1A]">
              <span className="text-xs font-medium text-[#8B95A5]">Total Advances</span>
              <span className="text-sm font-bold text-orange-400 tabular-nums">−{formatCurrency(settlement.total_advances)}</span>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      {settlement.notes && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] px-5 py-4">
          <div className="text-xs text-[#8B95A5] mb-1">Notes</div>
          <div className="text-sm text-slate-300">{settlement.notes}</div>
        </div>
      )}

      {/* Modals */}
      {modal.open && modal.type === 'pay' && (
        <PayModal
          settlementId={settlement.id}
          onClose={() => setModal({ open: false, type: null })}
          onSuccess={handlePaySuccess}
        />
      )}
      {modal.open && modal.type === 'dispute' && (
        <DisputeModal
          settlementId={settlement.id}
          onClose={() => setModal({ open: false, type: null })}
          onSuccess={handleDisputeSuccess}
        />
      )}
    </div>
  );
}
