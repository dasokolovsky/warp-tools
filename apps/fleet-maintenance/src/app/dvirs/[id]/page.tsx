import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatDate, formatMileage, statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Defect {
  area: string;
  description: string;
  severity: string;
  corrected: boolean;
}

async function getDvir(id: string) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/dvirs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DvirDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dvir = await getDvir(id);
  if (!dvir) notFound();

  let defects: Defect[] = [];
  try {
    defects = dvir.defects_json ? JSON.parse(dvir.defects_json) : [];
  } catch {
    defects = [];
  }

  const severityColor: Record<string, string> = {
    minor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    major: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    out_of_service: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <Link href="/dvirs" className="mt-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">DVIR Report</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge status={dvir.status} />
              <Badge status={dvir.inspection_type} />
              <span className="text-xs text-zinc-500">{formatDate(dvir.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Inspection Info</h2>
          <InfoRow label="Driver" value={dvir.driver_name} />
          <InfoRow label="Vehicle" value={dvir.unit_number} href={`/vehicles/${dvir.vehicle_id}`} />
          <InfoRow label="Make / Model" value={dvir.make ? `${dvir.make} ${dvir.model ?? ''}`.trim() : undefined} />
          <InfoRow label="Date" value={formatDate(dvir.date)} />
          <InfoRow label="Mileage" value={dvir.mileage ? formatMileage(dvir.mileage) : undefined} />
          <InfoRow label="Type" value={statusLabel(dvir.inspection_type)} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Summary</h2>
          <InfoRow label="Status" value={statusLabel(dvir.status)} />
          <InfoRow label="Defects Found" value={String(dvir.defects_found)} />
          {dvir.corrective_action && <InfoRow label="Corrective Action" value={dvir.corrective_action} />}
          {dvir.reviewed_by && <InfoRow label="Reviewed By" value={dvir.reviewed_by} />}
          {dvir.reviewed_at && <InfoRow label="Reviewed At" value={formatDate(dvir.reviewed_at)} />}
        </div>
      </div>

      {/* Defects */}
      {defects.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Defects ({defects.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Area</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Corrected</th>
              </tr>
            </thead>
            <tbody>
              {defects.map((d, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-zinc-300">{statusLabel(d.area)}</td>
                  <td className="px-4 py-3 text-zinc-400">{d.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${severityColor[d.severity] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'}`}>
                      {d.severity === 'out_of_service' ? 'Out of Service' : statusLabel(d.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${d.corrected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {d.corrected ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {defects.length === 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <p className="text-sm text-emerald-400">No defects found — vehicle passed inspection.</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-zinc-500">{label}</span>
      {href && value ? (
        <Link href={href} className="text-sm text-[#00C650] hover:text-[#00b347] transition-colors">{value}</Link>
      ) : (
        <span className="text-sm text-zinc-300">{value ?? '—'}</span>
      )}
    </div>
  );
}
