'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface WorkOrderActionsProps {
  workOrder: {
    id: string;
    status: string;
  };
}

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  open: { next: 'in_progress', label: 'Start Work' },
  in_progress: { next: 'waiting_parts', label: 'Mark Waiting Parts' },
  waiting_parts: { next: 'in_progress', label: 'Resume Work' },
};

export function WorkOrderActions({ workOrder }: WorkOrderActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const canAdvance = STATUS_FLOW[workOrder.status];
  const canComplete = ['in_progress', 'waiting_parts'].includes(workOrder.status);
  const isTerminal = ['completed', 'cancelled'].includes(workOrder.status);

  async function transition(newStatus: string) {
    setLoading(true);
    try {
      const url = newStatus === 'completed'
        ? `/api/work-orders/${workOrder.id}/complete`
        : `/api/work-orders/${workOrder.id}`;

      let res;
      if (newStatus === 'completed') {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed_at: new Date().toISOString() }),
        });
      } else {
        // fetch current WO data first
        const cur = await fetch(`/api/work-orders/${workOrder.id}`);
        const wo = await cur.json();
        res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...wo, status: newStatus, started_at: newStatus === 'in_progress' && !wo.started_at ? new Date().toISOString() : wo.started_at }),
        });
      }
      if (!res.ok) throw new Error('Failed');
      toast('Work order updated');
      router.refresh();
    } catch {
      toast('Failed to update work order', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (isTerminal) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#111113] p-4">
      <span className="text-sm text-zinc-500">Workflow:</span>
      {canAdvance && (
        <button
          onClick={() => transition(canAdvance.next)}
          disabled={loading}
          className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {canAdvance.label}
        </button>
      )}
      {canComplete && (
        <button
          onClick={() => transition('completed')}
          disabled={loading}
          className="rounded-lg bg-[#00C650] px-4 py-1.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
        >
          Mark Completed
        </button>
      )}
      {workOrder.status === 'open' && (
        <button
          onClick={() => transition('completed')}
          disabled={loading}
          className="rounded-lg bg-[#00C650] px-4 py-1.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
        >
          Mark Completed
        </button>
      )}
    </div>
  );
}
