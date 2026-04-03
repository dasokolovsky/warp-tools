import { db } from '@/db';
import { carriers, carrierInsurance } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreRing } from '@/components/ScoreRing';
import { CarrierSearch } from './CarrierSearch';

async function getCarriers(search?: string, status?: string) {
  const all = await db
    .select()
    .from(carriers)
    .orderBy(carriers.name);

  let filtered = all;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mcNumber?.toLowerCase().includes(q) ||
        c.dotNumber?.toLowerCase().includes(q) ||
        c.scacCode?.toLowerCase().includes(q) ||
        c.addressState?.toLowerCase().includes(q)
    );
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status === status);
  }

  return filtered;
}

async function getInsuranceAlerts() {
  const all = await db.select().from(carrierInsurance);
  const now = new Date();
  const alerts: Record<string, 'expired' | 'expiring_soon'> = {};

  for (const ins of all) {
    const d = new Date(ins.expiryDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (d < now) {
      alerts[ins.carrierId] = 'expired';
    } else if (diff <= 30 && alerts[ins.carrierId] !== 'expired') {
      alerts[ins.carrierId] = 'expiring_soon';
    }
  }
  return alerts;
}

const equipLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter',
  cargo_van: 'Cargo Van',
};

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function CarriersPage({ searchParams }: PageProps) {
  const { search, status } = await searchParams;
  const [allCarriers, insuranceAlerts] = await Promise.all([
    getCarriers(search, status),
    getInsuranceAlerts(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Carriers</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">{allCarriers.length} carriers total</p>
        </div>
        <Link
          href="/carriers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Carrier
        </Link>
      </div>

      {/* Search + Filter (client component) */}
      <CarrierSearch initialSearch={search} initialStatus={status} />

      {/* Table */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              {['Carrier', 'MC #', 'Equipment', 'Location', 'Score', 'Insurance', 'Status'].map((col) => (
                <th
                  key={col}
                  className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {allCarriers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[#8B95A5] py-12 text-sm">
                  No carriers found. <Link href="/carriers/new" className="text-[#00C650] underline">Add your first carrier →</Link>
                </td>
              </tr>
            )}
            {allCarriers.map((carrier) => {
              const equip: string[] = JSON.parse(carrier.equipmentTypes ?? '[]');
              const insAlert = insuranceAlerts[carrier.id];

              return (
                <tr
                  key={carrier.id}
                  className="hover:bg-[#0C1528] transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <div className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors">
                        {carrier.name}
                      </div>
                      {carrier.dotNumber && (
                        <div className="text-xs text-[#8B95A5] mt-0.5">DOT {carrier.dotNumber}</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <span className="text-sm text-[#8B95A5] font-mono">{carrier.mcNumber ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <div className="flex flex-wrap gap-1">
                        {equip.slice(0, 2).map((e) => (
                          <span
                            key={e}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-[#0C1528] border border-[#1A2235] text-[#8B95A5]"
                          >
                            {equipLabels[e] ?? e}
                          </span>
                        ))}
                        {equip.length > 2 && (
                          <span className="text-[10px] text-[#8B95A5]">+{equip.length - 2}</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">
                        {carrier.addressCity && carrier.addressState
                          ? `${carrier.addressCity}, ${carrier.addressState}`
                          : '—'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <ScoreRing score={carrier.overallScore} size={36} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      {insAlert ? (
                        <StatusBadge status={insAlert} />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#00C650]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00C650]" />
                          OK
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <StatusBadge status={carrier.status} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
