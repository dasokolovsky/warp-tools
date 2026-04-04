'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { LineTypeBadge } from '@/components/LineTypeBadge';
import { cn } from '@/lib/utils';

export interface LineItemRow {
  id?: string;          // present if saved to DB
  description: string;
  quantity: number;
  unitPrice: number;
  lineType: 'freight' | 'fuel_surcharge' | 'detention' | 'accessorial' | 'lumper' | 'other';
}

interface LineItemEditorProps {
  lineItems: LineItemRow[];
  onChange: (items: LineItemRow[]) => void;
  readOnly?: boolean;
}

const inputClass =
  'w-full px-2.5 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

const LINE_TYPES = [
  { value: 'freight', label: 'Freight' },
  { value: 'fuel_surcharge', label: 'Fuel Surcharge' },
  { value: 'detention', label: 'Detention' },
  { value: 'accessorial', label: 'Accessorial' },
  { value: 'lumper', label: 'Lumper' },
  { value: 'other', label: 'Other' },
];

function emptyRow(): LineItemRow {
  return { description: '', quantity: 1, unitPrice: 0, lineType: 'freight' };
}

export function LineItemEditor({ lineItems, onChange, readOnly }: LineItemEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<LineItemRow>(emptyRow());
  const [addingNew, setAddingNew] = useState(false);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setDraft({ ...lineItems[idx] });
    setAddingNew(false);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setDraft(emptyRow());
    setAddingNew(false);
  }

  function saveEdit(idx: number) {
    if (!draft.description.trim()) return;
    const updated = [...lineItems];
    updated[idx] = { ...draft };
    onChange(updated);
    setEditingIdx(null);
    setDraft(emptyRow());
  }

  function removeItem(idx: number) {
    onChange(lineItems.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function startAdd() {
    setAddingNew(true);
    setEditingIdx(null);
    setDraft(emptyRow());
  }

  function saveNew() {
    if (!draft.description.trim()) return;
    onChange([...lineItems, { ...draft }]);
    setDraft(emptyRow());
    setAddingNew(false);
  }

  function setDraftField<K extends keyof LineItemRow>(key: K, value: LineItemRow[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function renderInlineForm(onSave: () => void, onCancel: () => void) {
    return (
      <tr className="bg-[#0C1528]">
        <td className="px-4 py-2.5">
          <input
            autoFocus
            type="text"
            value={draft.description}
            onChange={(e) => setDraftField('description', e.target.value)}
            placeholder="Description"
            className={inputClass}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          />
        </td>
        <td className="px-4 py-2.5 w-36">
          <select
            value={draft.lineType}
            onChange={(e) => setDraftField('lineType', e.target.value as LineItemRow['lineType'])}
            className={inputClass}
          >
            {LINE_TYPES.map((lt) => (
              <option key={lt.value} value={lt.value}>{lt.label}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5 w-24">
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft.quantity}
            onChange={(e) => setDraftField('quantity', parseFloat(e.target.value) || 0)}
            className={cn(inputClass, 'text-right')}
          />
        </td>
        <td className="px-4 py-2.5 w-32">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8B95A5] text-xs">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.unitPrice}
              onChange={(e) => setDraftField('unitPrice', parseFloat(e.target.value) || 0)}
              className={cn(inputClass, 'pl-5 text-right')}
            />
          </div>
        </td>
        <td className="px-4 py-2.5 text-right text-sm text-white w-28">
          ${(draft.quantity * draft.unitPrice).toFixed(2)}
        </td>
        <td className="px-4 py-2.5 w-16">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onSave}
              className="p-1.5 rounded-lg bg-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/30 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-[#8B95A5]/10 text-[#8B95A5] hover:bg-[#8B95A5]/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-2.5">Description</th>
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-2.5 w-36">Type</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-2.5 w-24">Qty</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-2.5 w-32">Unit Price</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-2.5 w-28">Amount</th>
              {!readOnly && <th className="w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {lineItems.length === 0 && !addingNew && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-4 py-6 text-center text-sm text-[#8B95A5]">
                  No line items yet. Add one below.
                </td>
              </tr>
            )}
            {lineItems.map((item, idx) =>
              editingIdx === idx ? (
                <React.Fragment key={idx}>{renderInlineForm(() => saveEdit(idx), cancelEdit)}</React.Fragment>
              ) : (
                <tr key={idx} className="hover:bg-[#0C1528]/50 transition-colors group">
                  <td className="px-4 py-3 text-sm text-white">{item.description}</td>
                  <td className="px-4 py-3">
                    <LineTypeBadge lineType={item.lineType} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8B95A5] text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-[#8B95A5] text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-medium">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          className="p-1 rounded text-[#8B95A5] hover:text-white transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded text-[#8B95A5] hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            {addingNew && renderInlineForm(saveNew, cancelEdit)}
          </tbody>
          {lineItems.length > 0 && (
            <tfoot className="border-t border-[#1A2235]">
              <tr>
                <td colSpan={readOnly ? 4 : 4} className="px-4 py-2.5 text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide">
                  Subtotal
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-white">
                  ${subtotal.toFixed(2)}
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={startAdd}
          disabled={addingNew || editingIdx !== null}
          className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-[#00C650] hover:text-white hover:bg-[#00C650]/10 rounded-xl border border-[#00C650]/30 hover:border-[#00C650]/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add Line Item
        </button>
      )}
    </div>
  );
}
