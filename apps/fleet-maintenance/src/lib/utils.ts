import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatMileage(miles: number): string {
  return new Intl.NumberFormat('en-US').format(miles) + ' mi';
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  const d = daysUntil(dateStr);
  return d !== null && d < 0;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function generateWONumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${year}${month}-${rand}`;
}

export const STATUS_COLORS = {
  // Vehicle status
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  out_of_service: 'bg-red-500/15 text-red-400 border-red-500/20',
  in_shop: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  retired: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  // Work order status
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  waiting_parts: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  // DVIR status
  no_defects: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  defects_noted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  // Priority
  low: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
} as const;

export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
