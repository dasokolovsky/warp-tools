'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { RateBasis, RFQResponse } from '@/db/schema';

interface AddResponseModalProps {
  rfqId: number;
  editResponse?: RFQResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

const RATE_BASIS_OPTIONS: { value: RateBasis; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'per_cwt', label: 'Per CWT' },
  { value: 'per_pallet', label: 'Per Pallet' },
];

export function AddResponseModal({ rfqId, editResponse, onClose, onSaved }: AddResponseModalProps) {
  const isEdit = !!editResponse;

  const [carrierName, setCarrierName] = useState(() => editResponse?.carrier_name ?? '');
  const [rateAmount, setRateAmount] = useState(() => editResponse?.rate_amount?.toString() ?? '');
  const [rateBasis, setRateBasis] = useState<RateBasis>(() => (editResponse?.rate_basis ?? 'flat') as RateBasis);
  const [validUntil, setValidUntil] = useState(() => editResponse?.valid_until ?? '');
  const [contactName, setContactName] = useState(() => editResponse?.contact_name ?? '');
  const [contactEmail, setContactEmail] = useState(() => editResponse?.contact_email ?? '');
  const [notes, setNotes] = useState(() => editResponse?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!carrierName.trim() || !rateAmount.trim()) {
      setError('Carrier name and rate are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        carrier_name: carrierName.trim(),
        rate_amount: parseFloat(rateAmount),
        rate_basis: rateBasis,
        valid_until: validUntil || null,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        notes: notes || null,
      };

      const url = isEdit
        ? `/api/rfqs/${rfqId}/responses/${editResponse!.id}`
        : `/api/rfqs/${rfqId}/responses`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save response');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? 'Edit Response' : 'Add Carrier Response'}
          </h2>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8B95A5] mb-1.5">Carrier Name *</label>
            <input
              type="text"
              value={carrierName}
              onChange={e => setCarrierName(e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
              placeholder="e.g. Apex Freight Solutions"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Rate *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rateAmount}
                onChange={e => setRateAmount(e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Rate Basis *</label>
              <select
                value={rateBasis}
                onChange={e => setRateBasis(e.target.value as RateBasis)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
              >
                {RATE_BASIS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] mb-1.5">Valid Until</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
                placeholder="jane@carrier.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 resize-none"
              placeholder="Any special terms or conditions..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8B95A5] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-[#00C650] hover:bg-[#00C650]/90 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
