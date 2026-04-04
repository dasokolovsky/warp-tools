'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Pencil, Trash2, Phone, MessageSquare, Mail, Radio, MoreHorizontal, MapPin, Clock } from 'lucide-react';
import type { CheckCall } from '@/db/schema';

interface Props {
  shipmentId: string;
  checkCalls: CheckCall[];
  onAddCheckCall: () => void;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-slate-400',
  at_pickup: 'bg-blue-400',
  loading: 'bg-blue-500',
  in_transit: 'bg-cyan-400',
  at_delivery: 'bg-orange-400',
  delivered: 'bg-green-400',
  delayed: 'bg-yellow-400',
  issue: 'bg-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  at_pickup: 'At Pickup',
  loading: 'Loading',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
  issue: 'Issue',
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'text-slate-300 bg-slate-300/10',
  at_pickup: 'text-blue-400 bg-blue-400/10',
  loading: 'text-blue-500 bg-blue-500/10',
  in_transit: 'text-cyan-400 bg-cyan-400/10',
  at_delivery: 'text-orange-400 bg-orange-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  delayed: 'text-yellow-400 bg-yellow-400/10',
  issue: 'text-red-400 bg-red-400/10',
};

function ContactIcon({ method }: { method: string | null }) {
  switch (method) {
    case 'phone': return <Phone className="h-3.5 w-3.5" />;
    case 'text': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'email': return <Mail className="h-3.5 w-3.5" />;
    case 'tracking': return <Radio className="h-3.5 w-3.5" />;
    default: return <MoreHorizontal className="h-3.5 w-3.5" />;
  }
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatEta(eta: string | null) {
  if (!eta) return null;
  // handle both date-only and datetime
  if (/^\d{4}-\d{2}-\d{2}$/.test(eta)) {
    const [y, m, d] = eta.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return new Date(eta).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface EditCheckCallModalProps {
  shipmentId: string;
  call: CheckCall;
  onClose: () => void;
}

function EditCheckCallModal({ shipmentId, call, onClose }: EditCheckCallModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    status: call.status,
    locationCity: call.locationCity ?? '',
    locationState: call.locationState ?? '',
    eta: call.eta ?? '',
    notes: call.notes ?? '',
    contactMethod: call.contactMethod ?? 'phone',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/check-calls/${call.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          locationCity: form.locationCity || undefined,
          locationState: form.locationState || undefined,
          eta: form.eta || undefined,
          notes: form.notes || undefined,
          contactMethod: form.contactMethod,
        }),
      });
      if (!res.ok) {
        toast({ message: 'Failed to update check call', type: 'error' });
        return;
      }
      toast({ message: 'Check call updated', type: 'success' });
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
          <h2 className="text-base font-semibold text-white">Edit Check Call</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]"
            >
              {Object.entries(STATUS_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">City</label>
              <input
                type="text"
                value={form.locationCity}
                onChange={(e) => handleChange('locationCity', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">State</label>
              <input
                type="text"
                value={form.locationState}
                onChange={(e) => handleChange('locationState', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
                placeholder="ST"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">ETA</label>
            <input
              type="date"
              value={form.eta ? form.eta.slice(0, 10) : ''}
              onChange={(e) => handleChange('eta', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Contact Method</label>
            <select
              value={form.contactMethod}
              onChange={(e) => handleChange('contactMethod', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]"
            >
              <option value="phone">Phone</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tracking">Tracking</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] resize-none"
              placeholder="Notes..."
            />
          </div>
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
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TimelineNodeProps {
  call: CheckCall;
  isLast: boolean;
  shipmentId: string;
}

function TimelineNode({ call, isLast, shipmentId }: TimelineNodeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this check call?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/check-calls/${call.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast({ message: 'Failed to delete check call', type: 'error' });
        return;
      }
      toast({ message: 'Check call deleted', type: 'success' });
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  const dotColor = STATUS_DOT[call.status] ?? 'bg-slate-400';
  const badgeClass = STATUS_BADGE[call.status] ?? 'text-slate-400 bg-slate-400/10';
  const eta = formatEta(call.eta);

  return (
    <>
      <div className="relative flex gap-4 group">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 ring-[#080F1E] ${dotColor}`} />
          {!isLast && <div className="w-px flex-1 bg-[#1A2235] mt-1" />}
        </div>

        <div className="pb-5 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${badgeClass}`}>
                {STATUS_LABEL[call.status] ?? call.status}
              </span>
              {call.locationCity && (
                <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
                  <MapPin className="h-3 w-3" />
                  {call.locationCity}{call.locationState ? `, ${call.locationState}` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-md text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-md text-[#8B95A5] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-[#8B95A5]">{formatTs(call.createdAt)}</span>
            {eta && (
              <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
                <Clock className="h-3 w-3" />
                ETA {eta}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
              <ContactIcon method={call.contactMethod} />
              {call.contactMethod ?? 'other'}
            </span>
          </div>

          {call.notes && (
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{call.notes}</p>
          )}
        </div>
      </div>

      {showEdit && (
        <EditCheckCallModal
          shipmentId={shipmentId}
          call={call}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

export function CheckCallTimeline({ shipmentId, checkCalls, onAddCheckCall }: Props) {
  const sorted = [...checkCalls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          Check Calls ({checkCalls.length})
        </h2>
        <button
          onClick={onAddCheckCall}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
        >
          + Add Check Call
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-[#8B95A5] text-sm">
          <Radio className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No check calls yet</p>
          <p className="text-xs mt-1 opacity-60">Add updates as the carrier moves through the route</p>
        </div>
      ) : (
        <div>
          {sorted.map((call, i) => (
            <TimelineNode
              key={call.id}
              call={call}
              isLast={i === sorted.length - 1}
              shipmentId={shipmentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
