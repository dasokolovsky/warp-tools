'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import type { EquipmentType, RateBasis } from '@/db/schema';

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'power_only', label: 'Power Only' },
];

interface Lane {
  id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: EquipmentType;
}

export default function CreateRFQPage() {
  const router = useRouter();

  const [lanes, setLanes] = useState<Lane[]>([]);
  const [laneId, setLaneId] = useState('');
  const [laneSearch, setLaneSearch] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('dry_van');
  const [pickupDate, setPickupDate] = useState('');
  const [desiredRate, setDesiredRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefix, setPrefix] = useState('RFQ');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const settings = JSON.parse(localStorage.getItem('rateSettings') ?? '{}');
      if (settings.rfqPrefix) setPrefix(settings.rfqPrefix);
      if (settings.defaultRateBasis) {
        // handled separately
      }
    }
    fetchLanes();
  }, []);

  async function fetchLanes() {
    try {
      const res = await fetch('/api/lanes');
      if (res.ok) {
        const json = await res.json();
        setLanes(json.data ?? []);
      }
    } catch {
      // lanes API might not exist — that's fine
    }
  }

  const filteredLanes = lanes.filter(l => {
    const q = laneSearch.toLowerCase();
    return (
      `${l.origin_city} ${l.origin_state} ${l.dest_city} ${l.dest_state}`.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(status: 'draft' | 'sent') {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lane_id: laneId ? parseInt(laneId) : null,
          equipment_type: equipmentType,
          pickup_date: pickupDate || null,
          desired_rate: desiredRate ? parseFloat(desiredRate) : null,
          notes: notes || null,
          status,
          prefix,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to create RFQ');
      }
      const json = await res.json();
      router.push(`/rfqs/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const selectedLane = lanes.find(l => l.id === parseInt(laneId));

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Link href="/rfqs" className="flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to RFQs
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Plus className="h-6 w-6 text-[#00C650]" />
          Create RFQ
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Request rates from carriers for a lane.</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 space-y-5">
        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Lane Selector */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">Lane</label>
          {lanes.length > 0 ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search lanes..."
                value={laneSearch}
                onChange={e => setLaneSearch(e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
              />
              <select
                value={laneId}
                onChange={e => {
                  setLaneId(e.target.value);
                  const lane = lanes.find(l => l.id === parseInt(e.target.value));
                  if (lane) setEquipmentType(lane.equipment_type);
                }}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
                size={Math.min(5, filteredLanes.length + 1)}
              >
                <option value="">— No lane selected —</option>
                {filteredLanes.map(lane => (
                  <option key={lane.id} value={lane.id}>
                    {lane.origin_city}, {lane.origin_state} → {lane.dest_city}, {lane.dest_state} ({lane.equipment_type.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {selectedLane && (
                <div className="text-xs text-[#00C650]">
                  Selected: {selectedLane.origin_city}, {selectedLane.origin_state} → {selectedLane.dest_city}, {selectedLane.dest_state}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-[#8B95A5]">No lanes found. <Link href="/lanes" className="text-[#00C650] hover:underline">Create lanes first.</Link></div>
          )}
        </div>

        {/* Equipment Type */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">Equipment Type</label>
          <select
            value={equipmentType}
            onChange={e => setEquipmentType(e.target.value as EquipmentType)}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            {EQUIPMENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Pickup Date */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">Pickup Date</label>
          <input
            type="date"
            value={pickupDate}
            onChange={e => setPickupDate(e.target.value)}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          />
        </div>

        {/* Desired Rate */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">Target Rate ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={desiredRate}
            onChange={e => setDesiredRate(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional context for carriers..."
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 resize-none"
          />
        </div>

        {/* RFQ Prefix */}
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1.5">RFQ Number Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={e => setPrefix(e.target.value.toUpperCase())}
            placeholder="RFQ"
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
          />
          <p className="text-xs text-[#8B95A5] mt-1">Will generate e.g. {prefix || 'RFQ'}-{new Date().getFullYear()}-001</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium bg-[#0C1528] hover:bg-[#1A2235] text-white border border-[#1A2235] rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create as Draft'}
          </button>
          <button
            onClick={() => handleSubmit('sent')}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium bg-[#00C650] hover:bg-[#00C650]/90 text-black rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create & Mark Sent'}
          </button>
        </div>
      </div>
    </div>
  );
}
