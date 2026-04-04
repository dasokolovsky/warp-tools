'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Map } from 'lucide-react';

const EQUIPMENT_OPTIONS = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'power_only', label: 'Power Only' },
];

const inputClass = 'w-full bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 transition-colors';
const labelClass = 'block text-xs text-[#8B95A5] mb-1';

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewLanePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    origin_city: '',
    origin_state: '',
    origin_zip: '',
    dest_city: '',
    dest_state: '',
    dest_zip: '',
    equipment_type: 'dry_van',
    estimated_miles: '',
    notes: '',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.origin_city.trim()) errs.origin_city = 'Required';
    if (!form.origin_state.trim()) errs.origin_state = 'Required';
    if (!form.dest_city.trim()) errs.dest_city = 'Required';
    if (!form.dest_state.trim()) errs.dest_state = 'Required';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/lanes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          origin_state: form.origin_state.toUpperCase(),
          dest_state: form.dest_state.toUpperCase(),
          estimated_miles: form.estimated_miles ? parseInt(form.estimated_miles) : null,
          tags: tags.length > 0 ? tags : undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to create lane');
      }

      const lane = await res.json();
      router.push(`/lanes/${lane.id}`);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Map className="h-5 w-5 text-[#00C650]" />
            Create New Lane
          </h1>
          <p className="text-sm text-[#8B95A5]">Define origin, destination, and equipment type</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Origin</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldGroup label="City" required>
                <input
                  className={inputClass}
                  value={form.origin_city}
                  onChange={e => handleChange('origin_city', e.target.value)}
                  placeholder="e.g. Dallas"
                />
                {errors.origin_city && <p className="text-red-400 text-xs mt-1">{errors.origin_city}</p>}
              </FieldGroup>
            </div>
            <FieldGroup label="State" required>
              <input
                className={inputClass}
                value={form.origin_state}
                onChange={e => handleChange('origin_state', e.target.value.slice(0, 2))}
                placeholder="TX"
                maxLength={2}
              />
              {errors.origin_state && <p className="text-red-400 text-xs mt-1">{errors.origin_state}</p>}
            </FieldGroup>
            <FieldGroup label="ZIP Code">
              <input
                className={inputClass}
                value={form.origin_zip}
                onChange={e => handleChange('origin_zip', e.target.value)}
                placeholder="75201"
              />
            </FieldGroup>
          </div>
        </div>

        {/* Destination */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Destination</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldGroup label="City" required>
                <input
                  className={inputClass}
                  value={form.dest_city}
                  onChange={e => handleChange('dest_city', e.target.value)}
                  placeholder="e.g. Los Angeles"
                />
                {errors.dest_city && <p className="text-red-400 text-xs mt-1">{errors.dest_city}</p>}
              </FieldGroup>
            </div>
            <FieldGroup label="State" required>
              <input
                className={inputClass}
                value={form.dest_state}
                onChange={e => handleChange('dest_state', e.target.value.slice(0, 2))}
                placeholder="CA"
                maxLength={2}
              />
              {errors.dest_state && <p className="text-red-400 text-xs mt-1">{errors.dest_state}</p>}
            </FieldGroup>
            <FieldGroup label="ZIP Code">
              <input
                className={inputClass}
                value={form.dest_zip}
                onChange={e => handleChange('dest_zip', e.target.value)}
                placeholder="90012"
              />
            </FieldGroup>
          </div>
        </div>

        {/* Lane Details */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Lane Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Equipment Type" required>
              <select
                className={inputClass}
                value={form.equipment_type}
                onChange={e => handleChange('equipment_type', e.target.value)}
              >
                {EQUIPMENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Estimated Miles">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.estimated_miles}
                onChange={e => handleChange('estimated_miles', e.target.value)}
                placeholder="e.g. 1435"
              />
            </FieldGroup>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className={labelClass}>Tags</label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2.5 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#00C650]/50 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1A2235] border border-[#1A2235] text-[#8B95A5]"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <FieldGroup label="Notes">
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Any notes about this lane..."
              />
            </FieldGroup>
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-400 text-sm">{errors.submit}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#00C650] text-black font-semibold text-sm hover:bg-[#00B348] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Lane
          </button>
        </div>
      </form>
    </div>
  );
}
