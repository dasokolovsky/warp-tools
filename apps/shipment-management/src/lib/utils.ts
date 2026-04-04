import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  ShipmentStatus,
  EquipmentType,
  EventType,
} from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Shipment Status ──────────────────────────────────────────────────────────

const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  quote: 'Quote',
  booked: 'Booked',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
  closed: 'Closed',
  cancelled: 'Cancelled',
  claim: 'Claim',
};

export function getShipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  quote: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  booked: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  dispatched: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  in_transit: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  invoiced: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  paid: 'text-green-400 bg-green-400/10 border-green-400/20',
  closed: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
  claim: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

export function getShipmentStatusColor(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Equipment Type ────────────────────────────────────────────────────────────

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter Van',
  cargo_van: 'Cargo Van',
  power_only: 'Power Only',
};

export function getEquipmentLabel(type: EquipmentType): string {
  return EQUIPMENT_LABELS[type] ?? type;
}

const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  dry_van: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  reefer: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  flatbed: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  step_deck: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  lowboy: 'text-red-400 bg-red-400/10 border-red-400/20',
  sprinter_van: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  cargo_van: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  power_only: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export function getEquipmentColor(type: EquipmentType): string {
  return EQUIPMENT_COLORS[type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Event Type ───────────────────────────────────────────────────────────────

export function getEventTypeIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    status_change: '🔄',
    note: '📝',
    check_call: '📞',
    document: '📄',
    invoice: '🧾',
    payment: '💰',
    carrier_assign: '🚛',
  };
  return icons[type] ?? '📋';
}

export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    status_change: 'Status Change',
    note: 'Note',
    check_call: 'Check Call',
    document: 'Document',
    invoice: 'Invoice',
    payment: 'Payment',
    carrier_assign: 'Carrier Assigned',
  };
  return labels[type] ?? type;
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export function calculateHealthScore(params: {
  status: ShipmentStatus;
  hasRateCon: boolean;
  hasBol: boolean;
  hasPod: boolean;
  hasInvoice: boolean;
  pickupOnTime: boolean | null;
  deliveryOnTime: boolean | null;
  marginPct: number | null;
}): number {
  const { status, hasRateCon, hasBol, hasPod, hasInvoice, pickupOnTime, deliveryOnTime, marginPct } = params;

  if (status === 'cancelled') return 0;
  if (status === 'claim') return 15;

  let score = 100;

  // Doc penalties
  if (status !== 'quote' && !hasRateCon) score -= 15;
  if (['dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'closed'].includes(status) && !hasBol) score -= 10;
  if (['delivered', 'invoiced', 'paid', 'closed'].includes(status) && !hasPod) score -= 10;
  if (['invoiced', 'paid', 'closed'].includes(status) && !hasInvoice) score -= 10;

  // On-time penalties
  if (pickupOnTime === false) score -= 10;
  if (deliveryOnTime === false) score -= 15;

  // Margin bonus/penalty
  if (marginPct !== null) {
    if (marginPct < 10) score -= 10;
    else if (marginPct >= 20) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export function getHealthScoreColor(score: number): string {
  if (score >= 85) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 85) return 'Healthy';
  if (score >= 60) return 'Fair';
  return 'At Risk';
}

// ─── Doc Score ────────────────────────────────────────────────────────────────

export function calculateDocScore(params: {
  hasBol: boolean;
  hasPod: boolean;
  hasRateCon: boolean;
  hasInvoice: boolean;
}): number {
  const { hasBol, hasPod, hasRateCon, hasInvoice } = params;
  const total = [hasBol, hasPod, hasRateCon, hasInvoice].filter(Boolean).length;
  return Math.round((total / 4) * 100);
}

// ─── Margin ───────────────────────────────────────────────────────────────────

export function getMarginColor(marginPct: number | null | undefined): string {
  if (marginPct == null) return 'text-slate-400';
  if (marginPct >= 20) return 'text-green-400';
  if (marginPct >= 12) return 'text-yellow-400';
  return 'text-red-400';
}

export function getMarginLabel(marginPct: number | null | undefined): string {
  if (marginPct == null) return 'N/A';
  if (marginPct >= 20) return 'Healthy';
  if (marginPct >= 12) return 'Moderate';
  return 'Thin';
}
