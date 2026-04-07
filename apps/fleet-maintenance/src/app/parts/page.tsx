import Link from 'next/link';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { formatCurrency, statusLabel } from '@/lib/utils';
import { PART_CATEGORIES } from '@/db/schema';

export const dynamic = 'force-dynamic';

interface PartRow {
  id: string;
  part_number: string | null;
  name: string;
  category: string | null;
  quantity_on_hand: number;
  minimum_stock: number;
  unit_cost: number;
  supplier: string | null;
  location: string | null;
}

async function getParts(): Promise<PartRow[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/parts`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').toLowerCase();
  const categoryFilter = sp.category ?? '';

  const allParts = await getParts();

  const filtered = allParts.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (q) {
      const haystack = [p.name, p.part_number, p.supplier, p.category].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const lowStockCount = allParts.filter((p) => p.quantity_on_hand <= p.minimum_stock).length;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Parts Inventory</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {allParts.length} parts
            {lowStockCount > 0 && (
              <span className="text-amber-400 ml-2">· {lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <Link
          href="/parts/new"
          className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Part
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            readOnly
            value={q}
            placeholder="Search parts..."
            className="bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          {PART_CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat;
            const params = new URLSearchParams({ ...sp, category: isActive ? '' : cat });
            return (
              <Link
                key={cat}
                href={`/parts?${params}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  isActive
                    ? 'bg-[#00C650]/20 text-[#00C650] border-[#00C650]/30'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {statusLabel(cat)}
              </Link>
            );
          })}
        </div>
        {(categoryFilter || q) && (
          <Link href="/parts" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            Clear
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No parts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Part #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Min Stock</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Unit Cost</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Supplier</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.quantity_on_hand <= p.minimum_stock;
                return (
                  <tr key={p.id} className={`border-b border-zinc-800/50 transition-colors ${isLow ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-zinc-800/20'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.part_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                        <Link href={`/parts/${p.id}/edit`} className="text-zinc-200 hover:text-[#00C650] transition-colors">
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.category && (
                        <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                          {statusLabel(p.category)}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isLow ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {p.quantity_on_hand}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">{p.minimum_stock}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{formatCurrency(p.unit_cost)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{p.supplier ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/parts/${p.id}/edit`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
