'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { PART_CATEGORIES } from '@/db/constants';
import { statusLabel } from '@/lib/utils';

export default function NewPartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Part added to inventory');
      router.push('/parts');
    } catch {
      toast('Failed to add part', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parts" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Part</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Add a new part to inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Part Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Name *</label>
              <input name="name" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="e.g. Oil Filter" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Number</label>
              <input name="part_number" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none font-mono" placeholder="e.g. PF454" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select name="category" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                <option value="">Select category</option>
                {PART_CATEGORIES.map((c) => <option key={c} value={c}>{statusLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Unit Cost ($)</label>
              <input name="unit_cost" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantity on Hand</label>
              <input name="quantity_on_hand" type="number" min="0" defaultValue="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Minimum Stock Level</label>
              <input name="minimum_stock" type="number" min="0" defaultValue="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Supplier</label>
              <input name="supplier" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="e.g. FleetPride" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Storage Location</label>
              <input name="location" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="e.g. Shelf A-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" placeholder="Optional notes..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Add Part'}
          </button>
          <Link href="/parts" className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
