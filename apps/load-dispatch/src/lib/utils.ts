import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LoadStatus, EquipmentType } from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  // Handle plain dates like "2025-04-03" — parse in local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';
  // Expects HH:MM 24hr
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

const STATUS_LABELS: Record<LoadStatus, string> = {
  new: 'New',
  posted: 'Posted',
  covered: 'Covered',
  dispatched: 'Dispatched',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export function getStatusLabel(status: LoadStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_COLORS: Record<LoadStatus, string> = {
  new: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  posted: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  covered: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  dispatched: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  picked_up: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  in_transit: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
  invoiced: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  closed: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function getStatusColor(status: LoadStatus): string {
  return STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  tanker: 'Tanker',
  intermodal: 'Intermodal',
  power_only: 'Power Only',
  other: 'Other',
};

export function getEquipmentLabel(equipmentType: EquipmentType): string {
  return EQUIPMENT_LABELS[equipmentType] ?? equipmentType;
}

/** Returns urgency based on pickup date vs today */
export function getUrgencyLevel(pickupDate: string | null | undefined): 'urgent' | 'soon' | 'normal' {
  if (!pickupDate) return 'normal';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let target: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
    const [y, m, d] = pickupDate.split('-').map(Number);
    target = new Date(y, m - 1, d);
  } else {
    target = new Date(pickupDate);
    target.setHours(0, 0, 0, 0);
  }
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'urgent';
  if (diffDays <= 1) return 'soon';
  return 'normal';
}
