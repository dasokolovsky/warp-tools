'use client';

export interface DetentionPreset {
  label: string;
  arrival: string;
  freeTimeStart: string;
  freeDuration: string;
  departure: string;
  hourlyRate: string;
  maxDailyCap: string;
}

export interface DemurragePreset {
  label: string;
  availableDate: string;
  freeDays: string;
  pickupDate: string;
  dailyRate: string;
  tier1Rate: string;
  tier2Rate: string;
  tier3Rate: string;
}

type Preset = DetentionPreset | DemurragePreset;

interface PresetSelectorProps {
  mode: 'detention' | 'demurrage';
  onSelect: (preset: Preset) => void;
}

const DETENTION_PRESETS: DetentionPreset[] = [
  {
    label: 'Standard Shipper',
    arrival: '08:00',
    freeTimeStart: '08:00',
    freeDuration: '2',
    departure: '11:30',
    hourlyRate: '75',
    maxDailyCap: '',
  },
  {
    label: 'Long Wait (Receiver)',
    arrival: '06:00',
    freeTimeStart: '06:00',
    freeDuration: '2',
    departure: '14:00',
    hourlyRate: '85',
    maxDailyCap: '500',
  },
  {
    label: 'Partial Free Time',
    arrival: '14:00',
    freeTimeStart: '15:00',
    freeDuration: '2',
    departure: '18:30',
    hourlyRate: '75',
    maxDailyCap: '',
  },
];

const DEMURRAGE_PRESETS: DemurragePreset[] = [
  {
    label: 'Port Demurrage',
    availableDate: '',
    freeDays: '5',
    pickupDate: '',
    dailyRate: '150',
    tier1Rate: '150',
    tier2Rate: '250',
    tier3Rate: '400',
  },
  {
    label: 'Rail Demurrage',
    availableDate: '',
    freeDays: '2',
    pickupDate: '',
    dailyRate: '100',
    tier1Rate: '100',
    tier2Rate: '175',
    tier3Rate: '275',
  },
  {
    label: 'Flat Rate',
    availableDate: '',
    freeDays: '5',
    pickupDate: '',
    dailyRate: '200',
    tier1Rate: '',
    tier2Rate: '',
    tier3Rate: '',
  },
];

export default function PresetSelector({ mode, onSelect }: PresetSelectorProps) {
  const presets = mode === 'detention' ? DETENTION_PRESETS : DEMURRAGE_PRESETS;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Quick Presets</div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSelect(preset)}
            className="px-3 py-1.5 text-xs bg-warp-card-hover border border-warp-border text-warp-muted hover:text-white hover:border-warp-accent rounded-lg transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
