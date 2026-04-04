'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Plus, RefreshCw, FileText, Phone, DollarSign, Truck, StickyNote, Loader2 } from 'lucide-react';
import type { ShipmentEvent, EventType } from '@/db/schema';

interface Props {
  shipmentId: string;
  events: ShipmentEvent[];
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function EventIcon({ type }: { type: EventType }) {
  const iconClass = 'h-4 w-4';
  switch (type) {
    case 'status_change': return <RefreshCw className={`${iconClass} text-blue-400`} />;
    case 'note': return <StickyNote className={`${iconClass} text-slate-400`} />;
    case 'check_call': return <Phone className={`${iconClass} text-cyan-400`} />;
    case 'document': return <FileText className={`${iconClass} text-purple-400`} />;
    case 'invoice': return <DollarSign className={`${iconClass} text-yellow-400`} />;
    case 'payment': return <DollarSign className={`${iconClass} text-green-400`} />;
    case 'carrier_assign': return <Truck className={`${iconClass} text-orange-400`} />;
    default: return <StickyNote className={`${iconClass} text-slate-400`} />;
  }
}

function EventDotColor(type: EventType): string {
  switch (type) {
    case 'status_change': return 'bg-blue-400';
    case 'note': return 'bg-slate-400';
    case 'check_call': return 'bg-cyan-400';
    case 'document': return 'bg-purple-400';
    case 'invoice': return 'bg-yellow-400';
    case 'payment': return 'bg-green-400';
    case 'carrier_assign': return 'bg-orange-400';
    default: return 'bg-slate-400';
  }
}

interface AddNoteModalProps {
  shipmentId: string;
  onClose: () => void;
}

function AddNoteModal({ shipmentId, onClose }: AddNoteModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: note.trim() }),
      });
      if (!res.ok) {
        toast({ message: 'Failed to add note', type: 'error' });
        return;
      }
      toast({ message: 'Note added', type: 'success' });
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
          <h2 className="text-base font-semibold text-white">Add Note</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter note..."
            rows={4}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] resize-none"
          />
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
              disabled={saving || !note.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ShipmentTimeline({ shipmentId, events }: Props) {
  const [showAddNote, setShowAddNote] = useState(false);

  // Most recent first
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Activity Log ({events.length})</h2>
        <button
          onClick={() => setShowAddNote(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-[#8B95A5] text-sm">
          <p>No activity yet</p>
        </div>
      ) : (
        <div>
          {sorted.map((evt, i) => (
            <div key={evt.id} className="relative flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-[#080F1E] ${EventDotColor(evt.eventType)}`} />
                {i < sorted.length - 1 && (
                  <div className="w-px flex-1 bg-[#1A2235] mt-1 min-h-4" />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <EventIcon type={evt.eventType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">{evt.description}</p>
                    {evt.oldValue && evt.newValue && evt.eventType === 'status_change' && (
                      <p className="text-xs text-[#8B95A5] mt-0.5">
                        {evt.oldValue} → {evt.newValue}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#8B95A5]">{formatTs(evt.createdAt)}</span>
                      {evt.createdBy && (
                        <span className="text-xs text-[#8B95A5]">· {evt.createdBy}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddNote && (
        <AddNoteModal shipmentId={shipmentId} onClose={() => setShowAddNote(false)} />
      )}
    </div>
  );
}
