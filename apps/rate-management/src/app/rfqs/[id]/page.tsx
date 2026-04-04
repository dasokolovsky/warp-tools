'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Plus, Pencil, Trash2, Award,
  AlertTriangle, XCircle, SendHorizonal, Clock
} from 'lucide-react';
import { RFQStatusBadge } from '@/components/RFQStatusBadge';
import { RFQEmailTemplate } from '@/components/RFQEmailTemplate';
import { AddResponseModal } from '@/components/AddResponseModal';
import { formatCurrency, formatDate, getEquipmentLabel, getEquipmentColor, getRateBasisLabel, cn } from '@/lib/utils';
import type { RFQStatus, RFQResponse } from '@/db/schema';

interface Lane {
  id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: string;
  estimated_miles?: number | null;
}

interface RFQ {
  id: number;
  rfq_number: string;
  status: RFQStatus;
  equipment_type: string | null;
  pickup_date: string | null;
  desired_rate: number | null;
  notes: string | null;
  awarded_carrier: string | null;
  awarded_rate: number | null;
  awarded_at: string | null;
  created_at: string;
  lane_id: number | null;
}

interface RFQData {
  rfq: RFQ;
  responses: RFQResponse[];
  lane: Lane | null;
}

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [data, setData] = useState<RFQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editResponse, setEditResponse] = useState<RFQResponse | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const settings = JSON.parse(localStorage.getItem('rateSettings') ?? '{}');
      setCompanyName(settings.companyName ?? '');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`);
      if (!res.ok) throw new Error('Failed to load RFQ');
      const json = await res.json();
      setData(json.data);
    } catch {
      setError('Failed to load RFQ');
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(newStatus: RFQStatus) {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchData();
    } finally {
      setActionLoading('');
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setActionLoading('cancel');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      await fetchData();
      setShowCancelInput(false);
      setCancelReason('');
    } finally {
      setActionLoading('');
    }
  }

  async function handleAward(responseId: number) {
    setActionLoading(`award-${responseId}`);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      });
      if (!res.ok) throw new Error('Failed to award');
      await fetchData();
    } finally {
      setActionLoading('');
    }
  }

  async function handleDeleteResponse(respId: number) {
    if (!confirm('Delete this response?')) return;
    await fetch(`/api/rfqs/${rfqId}/responses/${respId}`, { method: 'DELETE' });
    await fetchData();
  }

  if (loading) {
    return <div className="p-6 text-[#8B95A5]">Loading...</div>;
  }
  if (error || !data) {
    return (
      <div className="p-6 text-red-400">
        {error || 'RFQ not found'}
        <Link href="/rfqs" className="block mt-2 text-[#00C650] hover:underline">← Back to RFQs</Link>
      </div>
    );
  }

  const { rfq, responses, lane } = data;
  const winner = responses.find(r => r.is_winner);
  const isTerminal = rfq.status === 'awarded' || rfq.status === 'cancelled' || rfq.status === 'expired';
  const canAward = rfq.status !== 'draft' && !isTerminal;

  const originStr = lane ? `${lane.origin_city}, ${lane.origin_state}` : 'TBD';
  const destStr = lane ? `${lane.dest_city}, ${lane.dest_state}` : 'TBD';

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/rfqs" className="flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to RFQs
      </Link>

      {/* Header */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white">{rfq.rfq_number}</h1>
              <RFQStatusBadge status={rfq.status} />
            </div>
            {lane && (
              <div className="flex items-center gap-2 mt-2 text-[#8B95A5]">
                <span className="text-white font-medium">{lane.origin_city}, {lane.origin_state}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="text-white font-medium">{lane.dest_city}, {lane.dest_state}</span>
                {lane.estimated_miles && <span className="text-xs">· {lane.estimated_miles.toLocaleString()} mi</span>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {rfq.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('sent')}
                disabled={actionLoading === 'sent'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 border border-blue-400/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <SendHorizonal className="h-4 w-4" />
                Mark as Sent
              </button>
            )}
            {!isTerminal && !showCancelInput && (
              <button
                onClick={() => setShowCancelInput(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancel RFQ
              </button>
            )}
          </div>
        </div>

        {/* Cancel input */}
        {showCancelInput && (
          <div className="mt-4 flex gap-3 items-center">
            <input
              type="text"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="flex-1 bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-red-400/50"
            />
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim() || actionLoading === 'cancel'}
              className="px-4 py-2 bg-red-400 hover:bg-red-400/90 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Confirm Cancel
            </button>
            <button onClick={() => setShowCancelInput(false)} className="text-[#8B95A5] hover:text-white text-sm">
              Dismiss
            </button>
          </div>
        )}

        {/* Details Grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[#8B95A5]">Equipment</div>
            <div className="mt-1">
              {rfq.equipment_type ? (
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', getEquipmentColor(rfq.equipment_type as never))}>
                  {getEquipmentLabel(rfq.equipment_type as never)}
                </span>
              ) : <span className="text-[#8B95A5] text-sm">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5] flex items-center gap-1"><Clock className="h-3 w-3" /> Pickup Date</div>
            <div className="text-sm text-white mt-1">{formatDate(rfq.pickup_date)}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5]">Target Rate</div>
            <div className="text-sm text-white mt-1">{rfq.desired_rate ? formatCurrency(rfq.desired_rate) : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5]">Responses</div>
            <div className="text-sm text-white mt-1 font-semibold">{responses.length}</div>
          </div>
        </div>

        {rfq.notes && (
          <div className="mt-4 text-sm text-[#8B95A5] italic border-t border-[#1A2235] pt-4">
            {rfq.notes}
          </div>
        )}

        {/* Awarded banner */}
        {rfq.status === 'awarded' && winner && (
          <div className="mt-5 flex items-center gap-3 bg-green-400/10 border border-green-400/20 rounded-xl px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-green-400">Awarded to {rfq.awarded_carrier}</div>
              <div className="text-xs text-[#8B95A5] mt-0.5">
                {rfq.awarded_rate ? formatCurrency(rfq.awarded_rate) : '—'} · {formatDate(rfq.awarded_at)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Carrier Responses ({responses.length})</h2>
          {!isTerminal && (
            <button
              onClick={() => { setEditResponse(null); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C650]/10 hover:bg-[#00C650]/20 text-[#00C650] border border-[#00C650]/20 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Response
            </button>
          )}
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-10 text-[#8B95A5]">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No responses yet.</p>
            {rfq.status === 'sent' && <p className="text-xs mt-1">Waiting for carrier replies.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Carrier</th>
                  <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Rate</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Basis</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Valid Until</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Notes</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {responses.map(resp => (
                  <tr
                    key={resp.id}
                    className={cn(
                      'transition-colors',
                      resp.is_winner ? 'bg-green-400/5 border-l-2 border-l-green-400' : 'hover:bg-[#0C1528]'
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {resp.is_winner && <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />}
                        <div>
                          <div className={cn('font-medium', resp.is_winner ? 'text-green-400' : 'text-white')}>
                            {resp.carrier_name}
                          </div>
                          {resp.is_winner && (
                            <span className="text-xs text-green-400/70">Winner</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-semibold', resp.is_winner ? 'text-green-400' : 'text-white')}>
                        {formatCurrency(resp.rate_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8B95A5]">{getRateBasisLabel(resp.rate_basis)}</td>
                    <td className="px-4 py-3 text-[#8B95A5]">{formatDate(resp.valid_until)}</td>
                    <td className="px-4 py-3">
                      {resp.contact_name ? (
                        <div>
                          <div className="text-white text-xs">{resp.contact_name}</div>
                          {resp.contact_email && <div className="text-[#8B95A5] text-xs">{resp.contact_email}</div>}
                        </div>
                      ) : <span className="text-[#8B95A5]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#8B95A5] text-xs max-w-[200px] truncate">{resp.notes ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canAward && !resp.is_winner && (
                          <button
                            onClick={() => handleAward(resp.id)}
                            disabled={actionLoading === `award-${resp.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Award className="h-3 w-3" />
                            Award
                          </button>
                        )}
                        {!isTerminal && (
                          <>
                            <button
                              onClick={() => { setEditResponse(resp); setShowAddModal(true); }}
                              className="p-1.5 text-[#8B95A5] hover:text-white rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteResponse(resp.id)}
                              className="p-1.5 text-[#8B95A5] hover:text-red-400 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Template */}
      <RFQEmailTemplate
        rfqNumber={rfq.rfq_number}
        origin={originStr}
        destination={destStr}
        equipmentType={rfq.equipment_type ? getEquipmentLabel(rfq.equipment_type as never) : 'TBD'}
        pickupDate={rfq.pickup_date}
        desiredRate={rfq.desired_rate}
        companyName={companyName}
      />

      {/* Modals */}
      {showAddModal && (
        <AddResponseModal
          rfqId={rfq.id}
          editResponse={editResponse}
          onClose={() => { setShowAddModal(false); setEditResponse(null); }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
