'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const EQUIPMENT_OPTIONS = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
];

interface FormData {
  name: string;
  mcNumber: string;
  dotNumber: string;
  scacCode: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  website: string;
  equipmentTypes: string[];
  notes: string;
  status: 'active' | 'inactive' | 'blacklisted';
  authorityStatus: 'active' | 'inactive' | 'revoked' | 'unknown';
  safetyRating: 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not_rated' | 'unknown';
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
        {label} {required && <span className="text-[#FF4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

export function NewCarrierForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    mcNumber: '',
    dotNumber: '',
    scacCode: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    website: '',
    equipmentTypes: [],
    notes: '',
    status: 'active',
    authorityStatus: 'unknown',
    safetyRating: 'unknown',
  });

  function set(key: keyof FormData, value: string | string[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleEquipment(val: string) {
    set(
      'equipmentTypes',
      form.equipmentTypes.includes(val)
        ? form.equipmentTypes.filter((e) => e !== val)
        : [...form.equipmentTypes, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mcNumber: form.mcNumber || null,
          dotNumber: form.dotNumber || null,
          scacCode: form.scacCode || null,
          addressStreet: form.addressStreet || null,
          addressCity: form.addressCity || null,
          addressState: form.addressState || null,
          addressZip: form.addressZip || null,
          website: form.website || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.formErrors?.[0] ?? 'Failed to create carrier');
        return;
      }

      const carrier = await res.json();
      router.push(`/carriers/${carrier.id}`);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 text-sm text-[#FF4444]">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white mb-4">Basic Information</h2>

        <Field label="Company Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Apex Freight Solutions"
            required
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="MC Number">
            <input
              type="text"
              value={form.mcNumber}
              onChange={(e) => set('mcNumber', e.target.value)}
              placeholder="MC-123456"
              className={inputClass}
            />
          </Field>
          <Field label="DOT Number">
            <input
              type="text"
              value={form.dotNumber}
              onChange={(e) => set('dotNumber', e.target.value)}
              placeholder="DOT-1234567"
              className={inputClass}
            />
          </Field>
          <Field label="SCAC Code">
            <input
              type="text"
              value={form.scacCode}
              onChange={(e) => set('scacCode', e.target.value.toUpperCase())}
              placeholder="APEX"
              maxLength={4}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://example.com"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Address */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white mb-4">Address</h2>

        <Field label="Street">
          <input
            type="text"
            value={form.addressStreet}
            onChange={(e) => set('addressStreet', e.target.value)}
            placeholder="1200 Industrial Blvd"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="City">
            <input
              type="text"
              value={form.addressCity}
              onChange={(e) => set('addressCity', e.target.value)}
              placeholder="Dallas"
              className={inputClass}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={form.addressState}
              onChange={(e) => set('addressState', e.target.value.toUpperCase())}
              placeholder="TX"
              maxLength={2}
              className={inputClass}
            />
          </Field>
          <Field label="ZIP">
            <input
              type="text"
              value={form.addressZip}
              onChange={(e) => set('addressZip', e.target.value)}
              placeholder="75201"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Equipment */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Equipment Types</h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleEquipment(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                form.equipmentTypes.includes(value)
                  ? 'bg-[#00C650]/10 border-[#00C650]/30 text-[#00C650]'
                  : 'bg-[#0C1528] border-[#1A2235] text-[#8B95A5] hover:border-[#2A3347] hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white mb-4">Compliance</h2>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </Field>

          <Field label="Authority Status">
            <select
              value={form.authorityStatus}
              onChange={(e) => set('authorityStatus', e.target.value)}
              className={inputClass}
            >
              <option value="unknown">Unknown</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="revoked">Revoked</option>
            </select>
          </Field>

          <Field label="Safety Rating">
            <select
              value={form.safetyRating}
              onChange={(e) => set('safetyRating', e.target.value)}
              className={inputClass}
            >
              <option value="unknown">Unknown</option>
              <option value="satisfactory">Satisfactory</option>
              <option value="conditional">Conditional</option>
              <option value="unsatisfactory">Unsatisfactory</option>
              <option value="not_rated">Not Rated</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Internal Notes</h2>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Add any notes about this carrier — preferred lanes, performance history, special requirements..."
          rows={4}
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          {loading ? 'Creating...' : 'Create Carrier'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/carriers')}
          className="px-6 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
