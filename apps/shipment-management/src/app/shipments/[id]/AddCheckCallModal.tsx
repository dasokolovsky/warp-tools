'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

interface Props {
  shipmentId: string;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'at_pickup', label: 'At Pickup' },
  { value: 'loading', label: 'Loading' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'at_delivery', label: 'At Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'issue', label: 'Issue' },
];

export function AddCheckCallModal({ shipmentId, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    status: 'in_transit',
    locationCity: '',
    locationState: '',
    eta: '',
    notes: '',
    contactMethod: 'phone',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/check-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          locationCity: form.locationCity.trim() || undefined,
          locationState: form.locationState.trim() || undefined,
          eta: form.eta || undefined,
          notes: form.notes.trim() || undefined,
          contactMethod: form.contactMethod,
        }),
      });
      if (!res.ok) {
        toast({ message: 'Failed to add check call', type: 'error' });
        return;
      }
      toast({ message: 'Check call added', type: 'success' });
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
          <h2 className="text-base font-semibold text-white">Add Check Call</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              value={form.eta}
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
              placeholder="Driver update, location notes..."
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Check Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
