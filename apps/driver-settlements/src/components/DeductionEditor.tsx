'use client';

import { useState } from 'react';
import { Trash2, Pencil, Plus, X, Check } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { SettlementDeduction, DeductionCategory, DeductionType } from '@/db/schema';

const CATEGORIES: DeductionCategory[] = ['insurance', 'lease', 'eld', 'fuel_advance', 'toll', 'ticket', 'repair', 'other'];
const TYPES: DeductionType[] = ['one_time', 'recurring'];

const CATEGORY_COLORS: Record<DeductionCategory, string> = {
  insurance: 'text-blue-400 bg-blue-400/10',
  lease: 'text-purple-400 bg-purple-400/10',
  eld: 'text-teal-400 bg-teal-400/10',
  fuel_advance: 'text-orange-400 bg-orange-400/10',
  toll: 'text-yellow-400 bg-yellow-400/10',
  ticket: 'text-red-400 bg-red-400/10',
  repair: 'text-pink-400 bg-pink-400/10',
  other: 'text-slate-400 bg-slate-400/10',
};

interface DeductionEditorProps {
  settlementId: number;
  deductions: SettlementDeduction[];
  editable: boolean;
  onUpdate: () => void;
}

interface FormState {
  description: string;
  amount: string;
  deduction_type: DeductionType;
  category: DeductionCategory;
}

function emptyForm(): FormState {
  return { description: '', amount: '', deduction_type: 'one_time', category: 'other' };
}

export function DeductionEditor({ settlementId, deductions, editable, onUpdate }: DeductionEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const total = deductions.reduce((s, d) => s + d.amount, 0);

  async function handleAdd() {
    if (!addForm.description || !addForm.amount) return;
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: addForm.description,
          amount: parseFloat(addForm.amount),
          deduction_type: addForm.deduction_type,
          category: addForm.category,
        }),
      });
      setAddForm(emptyForm);
      setShowAdd(false);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(d: SettlementDeduction) {
    setEditingId(d.id);
    setEditForm({ description: d.description, amount: String(d.amount), deduction_type: d.deduction_type, category: d.category });
  }

  async function handleEdit(id: number) {
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/deductions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          deduction_type: editForm.deduction_type,
          category: editForm.category,
        }),
      });
      setEditingId(null);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this deduction?')) return;
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/deductions/${id}`, { method: 'DELETE' });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Deductions</h2>
        {editable && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2235] hover:bg-[#243050] px-3 py-1.5 text-xs font-medium text-[#8B95A5] hover:text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Deduction
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-5 py-4 bg-[#0C1528] border-b border-[#1A2235]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
              placeholder="Description"
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
              placeholder="Amount"
              value={addForm.amount}
              onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <select
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as DeductionCategory }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
              value={addForm.deduction_type}
              onChange={(e) => setAddForm((f) => ({ ...f, deduction_type: e.target.value as DeductionType }))}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddForm(emptyForm); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2235] px-3 py-1.5 text-xs font-medium text-[#8B95A5] hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {deductions.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">No deductions.</div>
      ) : (
        <div className="divide-y divide-[#1A2235]">
          {deductions.map((d) => (
            <div key={d.id} className="px-5 py-3.5">
              {editingId === d.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                  <select
                    className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as DeductionCategory }))}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  <select
                    className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
                    value={editForm.deduction_type}
                    onChange={(e) => setEditForm((f) => ({ ...f, deduction_type: e.target.value as DeductionType }))}
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                  <div className="flex gap-2 sm:col-span-2">
                    <button onClick={() => handleEdit(d.id)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2235] px-3 py-1.5 text-xs font-medium text-[#8B95A5] hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize', CATEGORY_COLORS[d.category])}>
                      {d.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-white truncate">{d.description}</span>
                    <span className="text-xs text-[#8B95A5] capitalize">{d.deduction_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-red-400 tabular-nums">−{formatCurrency(d.amount)}</span>
                    {editable && (
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(d)} className="p-1 text-[#8B95A5] hover:text-white transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-1 text-[#8B95A5] hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deductions.length > 0 && (
        <div className="px-5 py-3 border-t border-[#1A2235] flex justify-between items-center bg-[#060C1A]">
          <span className="text-xs font-medium text-[#8B95A5]">Total Deductions</span>
          <span className="text-sm font-bold text-red-400 tabular-nums">−{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}
