import { db } from '@/db';
import { carriers, carrierRates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ScoreRing } from '@/components/ScoreRing';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { RatesSearch } from './RatesSearch';

const equipLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter',
  cargo_van: 'Cargo Van',
};

const rateTypeLabels: Record<string, string> = {
  per_mile: '/mi',
  flat: 'flat',
  per_cwt: '/cwt',
};

interface PageProps {
  searchParams: Promise<{
    origin?: string;
    dest?: string;
    equipment?: string;
  }>;
}

async function getRates(origin?: string, dest?: string, equipment?: string) {
  const allRates = await db
    .select({
      rate: carrierRates,
      carrier: carriers,
    })
    .from(carrierRates)
    .leftJoin(carriers, eq(carrierRates.carrierId, carriers.id));

  let filtered = allRates.filter((r) => r.carrier != null);

  if (origin) {
    const q = origin.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.rate.originCity?.toLowerCase().includes(q) ||
        r.rate.originState?.toLowerCase().includes(q) ||
        r.rate.originZip?.includes(q)
    );
  }

  if (dest) {
    const q = dest.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.rate.destCity?.toLowerCase().includes(q) ||
        r.rate.destState?.toLowerCase().includes(q) ||
        r.rate.destZip?.includes(q)
    );
  }

  if (equipment && equipment !== 'all') {
    filtered = filtered.filter((r) => r.rate.equipmentType === equipment);
  }

  // Sort by carrier score descending, then rate ascending
  filtered.sort((a, b) => {
    const scoreA = a.carrier?.overallScore ?? 0;
    const scoreB = b.carrier?.overallScore ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.rate.rateAmount - b.rate.rateAmount;
  });

  return filtered;
}

export default async function RatesPage({ searchParams }: PageProps) {
  const { origin, dest, equipment } = await searchParams;
  const results = await getRates(origin, dest, equipment);
  const isFiltered = !!(origin || dest || equipment);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Rate Comparison</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5">
          Compare carrier rates by lane — sorted by performance score
        </p>
      </div>

      {/* Search filters (client) */}
      <RatesSearch
        initialOrigin={origin}
        initialDest={dest}
        initialEquipment={equipment}
      />

      {/* Results */}
      <div className="mt-6 rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {!isFiltered && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div className="h-12 w-12 rounded-full bg-[#0C1528] border border-[#1A2235] flex items-center justify-center mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-white font-medium">Search for a lane</p>
            <p className="text-sm text-[#8B95A5] mt-1 max-w-xs">
              Enter an origin and/or destination above to see carrier rates for that lane.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <p className="text-white font-medium">No rates found</p>
            <p className="text-sm text-[#8B95A5] mt-1">
              No carriers have rates on file for this lane.{' '}
              <Link href="/carriers" className="text-[#00C650] underline">
                Browse carriers →
              </Link>
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A2235]">
                {['Carrier', 'Origin', 'Destination', 'Equipment', 'Rate', 'Type', 'Score', 'Status'].map((col) => (
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
              {results.map(({ rate, carrier }) => (
                <tr key={rate.id} className="hover:bg-[#0C1528] transition-colors group">
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier!.id}?tab=rates`} className="block">
                      <div className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors">
                        {carrier!.name}
                      </div>
                      {carrier!.mcNumber && (
                        <div className="text-xs text-[#8B95A5] font-mono mt-0.5">
                          MC# {carrier!.mcNumber}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                    {rate.originCity && rate.originState
                      ? `${rate.originCity}, ${rate.originState}`
                      : rate.originState ?? rate.originZip ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                    {rate.destCity && rate.destState
                      ? `${rate.destCity}, ${rate.destState}`
                      : rate.destState ?? rate.destZip ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                    {rate.equipmentType
                      ? (equipLabels[rate.equipmentType] ?? rate.equipmentType)
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-[#00C650]">
                      {formatCurrency(rate.rateAmount)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#8B95A5]">
                    {rateTypeLabels[rate.rateType] ?? rate.rateType}
                  </td>
                  <td className="px-4 py-3.5">
                    <ScoreRing score={carrier!.overallScore} size={36} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={carrier!.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {results.length > 0 && (
        <p className="mt-3 text-xs text-[#8B95A5]">
          {results.length} rate{results.length !== 1 ? 's' : ''} found — sorted by performance score
        </p>
      )}
    </div>
  );
}
