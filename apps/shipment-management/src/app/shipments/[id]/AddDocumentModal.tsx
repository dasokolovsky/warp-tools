'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

interface Props {
  shipmentId: string;
  defaultDocType?: string;
  onClose: () => void;
}

const DOC_TYPES = [
  { value: 'bol', label: 'Bill of Lading (BOL)' },
  { value: 'pod', label: 'Proof of Delivery (POD)' },
  { value: 'rate_confirmation', label: 'Rate Confirmation' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'insurance_cert', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other' },
];

export function AddDocumentModal({ shipmentId, defaultDocType = '', onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    docType: defaultDocType || 'bol',
    filename: '',
    docRef: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.filename.trim()) {
      toast({ message: 'Filename is required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: form.docType,
          filename: form.filename.trim(),
          docRef: form.docRef.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        toast({ message: 'Failed to add document', type: 'error' });
        return;
      }
      toast({ message: 'Document added', type: 'success' });
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
          <h2 className="text-base font-semibold text-white">Add Document</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Document Type</label>
            <select
              value={form.docType}
              onChange={(e) => handleChange('docType', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Filename *</label>
            <input
              type="text"
              value={form.filename}
              onChange={(e) => handleChange('filename', e.target.value)}
              required
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="e.g. bol_SHP-2025-0001.pdf"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Document Reference</label>
            <input
              type="text"
              value={form.docRef}
              onChange={(e) => handleChange('docRef', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]"
              placeholder="Reference number (optional)"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] resize-none"
              placeholder="Optional notes..."
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
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
