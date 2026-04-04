'use client';

import { X } from 'lucide-react';
import type { TripRow as TripRowType, PayType } from '@/lib/types';
import { calcTripPay, fmt } from '@/lib/calculations';

interface Props {
  trip: TripRowType;
  payType: PayType;
  rate: number;
  index: number;
  onChange: (id: string, field: keyof TripRowType, value: string) => void;
  onRemove: (id: string) => void;
}

export default function TripRow({ trip, payType, rate, index, onChange, onRemove }: Props) {
  const pay = calcTripPay(trip, payType, rate);
  const showMiles = payType === 'per-mile';
  const showRevenue = payType === 'percentage';
  const showHours = payType === 'hourly';
  const showStops = payType === 'per-stop';
  // flat: only description

  return (
    <div className="bg-warp-bg border border-warp-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-warp-muted font-medium">Trip {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-warp-accent">{fmt(pay)}</span>
          <button
            onClick={() => onRemove(trip.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-warp-muted hover:text-warp-danger hover:bg-warp-danger/10 transition-colors"
            aria-label="Remove trip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={trip.description}
        onChange={(e) => onChange(trip.id, 'description', e.target.value)}
        placeholder="Trip description (e.g. Chicago → Dallas)"
        className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {showMiles && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-warp-muted">Miles</label>
            <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
              <input
                type="number"
                value={trip.miles}
                onChange={(e) => onChange(trip.id, 'miles', e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
              />
              <span className="px-2 text-xs text-warp-muted border-l border-warp-border">mi</span>
            </div>
          </div>
        )}
        {showRevenue && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-warp-muted">Revenue</label>
            <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
              <span className="px-2 text-xs text-warp-muted border-r border-warp-border">$</span>
              <input
                type="number"
                value={trip.revenue}
                onChange={(e) => onChange(trip.id, 'revenue', e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
              />
            </div>
          </div>
        )}
        {showHours && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-warp-muted">Hours</label>
            <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
              <input
                type="number"
                value={trip.hours}
                onChange={(e) => onChange(trip.id, 'hours', e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
              />
              <span className="px-2 text-xs text-warp-muted border-l border-warp-border">hr</span>
            </div>
          </div>
        )}
        {showStops && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-warp-muted">Stops</label>
            <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
              <input
                type="number"
                value={trip.stops}
                onChange={(e) => onChange(trip.id, 'stops', e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
              />
              <span className="px-2 text-xs text-warp-muted border-l border-warp-border">stops</span>
            </div>
          </div>
        )}
        {payType === 'flat' && (
          <div className="col-span-2 sm:col-span-3 text-xs text-warp-muted italic py-1">
            Flat rate — {fmt(rate)} per load
          </div>
        )}
      </div>
    </div>
  );
}
