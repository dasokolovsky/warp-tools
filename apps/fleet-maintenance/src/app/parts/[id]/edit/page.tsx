'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { PART_CATEGORIES } from '@/db/constants';
import { statusLabel } from '@/lib/utils';

interface PartData {
  id: string;
  part_number: string | null;
  name: string;
  category: string | null;
  quantity_on_hand: number;
  minimum_stock: number;
  unit_cost: number;
  supplier: string | null;
  location: string | null;
  notes: string | null;
}

export default function EditPartPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [part, setPart] = useState<PartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setPart(p);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load part', 'error');
        setLoading(false);
      });
  }, [id, toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Part updated');
      router.push('/parts');
    } catch {
      toast('Failed to update part', 'error');
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading...</div>;
  if (!part) return <div className="p-6 text-red-400 text-sm">Part not found.</div>;

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parts" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Part</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{part.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Part Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Name *</label>
              <input name="name" required defaultValue={part.name} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Number</label>
              <input name="part_number" defaultValue={part.part_number ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select name="category" defaultValue={part.category ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                <option value="">Select category</option>
                {PART_CATEGORIES.map((c) => <option key={c} value={c}>{statusLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Unit Cost ($)</label>
              <input name="unit_cost" type="number" step="0.01" min="0" defaultValue={part.unit_cost} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantity on Hand</label>
              <input name="quantity_on_hand" type="number" min="0" defaultValue={part.quantity_on_hand} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Minimum Stock Level</label>
              <input name="minimum_stock" type="number" min="0" defaultValue={part.minimum_stock} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Supplier</label>
              <input name="supplier" defaultValue={part.supplier ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Storage Location</label>
              <input name="location" defaultValue={part.location ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} defaultValue={part.notes ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/parts" className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
