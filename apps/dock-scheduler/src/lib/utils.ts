import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppointmentStatus, DoorType } from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  completed: 'Completed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
};

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  checked_in: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  in_progress: 'text-green-400 bg-green-400/10 border-green-400/20',
  completed: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  no_show: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function getAppointmentStatusColor(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

const DOOR_TYPE_LABELS: Record<DoorType, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  both: 'Both',
};

export function getDockDoorTypeLabel(type: DoorType): string {
  return DOOR_TYPE_LABELS[type] ?? type;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hourStr, minuteStr] = startTime.split(':');
  const startH = parseInt(hourStr, 10);
  const startM = parseInt(minuteStr, 10);
  const totalMinutes = startH * 60 + startM + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
