'use server';

import { db } from '@/db';
import {
  carriers,
  carrierContacts,
  carrierInsurance,
  carrierRates,
  carrierPerformance,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Truck, Star, ClipboardList } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreRing } from '@/components/ScoreRing';
import { ContactCard } from '@/components/ContactCard';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CarrierDetailTabs } from './CarrierDetailTabs';
import { LogPerformanceButton } from './LogPerformanceButton';

const equipLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter',
  cargo_van: 'Cargo Van',
};

const insTypeLabels: Record<string, string> = {
  auto_liability: 'Auto Liability',
  cargo: 'Cargo',
  general_liability: 'General Liability',
  workers_comp: "Workers' Comp",
};

const rateTypeLabels: Record<string, string> = {
  per_mile: '/mi',
  flat: 'flat',
  per_cwt: '/cwt',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CarrierDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) notFound();

  const [contacts, insurance, rates, performance] = await Promise.all([
    db.select().from(carrierContacts).where(eq(carrierContacts.carrierId, id)),
    db.select().from(carrierInsurance).where(eq(carrierInsurance.carrierId, id)),
    db.select().from(carrierRates).where(eq(carrierRates.carrierId, id)),
    db
      .select()
      .from(carrierPerformance)
      .where(eq(carrierPerformance.carrierId, id))
      .orderBy(carrierPerformance.recordedAt),
  ]);

  const equip: string[] = JSON.parse(carrier.equipmentTypes ?? '[]');
  const rawServiceAreas: unknown[] = JSON.parse(carrier.serviceAreas ?? '[]');
  // Support both plain string arrays and {origin_states, dest_states} objects from seed data
  const serviceAreas: string[] = rawServiceAreas.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      const origins = Array.isArray(obj.origin_states) ? (obj.origin_states as string[]) : [];
      const dests = Array.isArray(obj.dest_states) ? (obj.dest_states as string[]) : [];
      const parts: string[] = [];
      if (origins.length) parts.push(`From: ${origins.join(', ')}`);
      if (dests.length) parts.push(`To: ${dests.join(', ')}`);
      return parts;
    }
    return [];
  });
  const tags: string[] = JSON.parse(carrier.tags ?? '[]');

  // Performance stats
  const perf = performance;
  const totalShipments = perf.length;
  const onTimePickup = totalShipments
    ? Math.round((perf.filter((p) => p.pickupOnTime).length / totalShipments) * 100)
    : null;
  const onTimeDelivery = totalShipments
    ? Math.round((perf.filter((p) => p.deliveryOnTime).length / totalShipments) * 100)
    : null;
  const claimRate = totalShipments
    ? Math.round((perf.filter((p) => p.claimFiled).length / totalShipments) * 100)
    : null;
  const avgComm = totalShipments
    ? perf.filter((p) => p.communicationScore != null).reduce((s, p) => s + (p.communicationScore ?? 0), 0) /
      (perf.filter((p) => p.communicationScore != null).length || 1)
    : null;

  const tabs = ['overview', 'contacts', 'insurance', 'rates', 'performance'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back */}
      <Link
        href="/carriers"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Carriers
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Score ring — larger */}
          <div className="flex-shrink-0">
            <ScoreRing score={carrier.overallScore} size={72} strokeWidth={5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{carrier.name}</h1>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {carrier.mcNumber && (
                    <span className="text-sm text-[#8B95A5] font-mono">MC# {carrier.mcNumber}</span>
                  )}
                  {carrier.dotNumber && (
                    <span className="text-sm text-[#8B95A5] font-mono">DOT# {carrier.dotNumber}</span>
                  )}
                  {carrier.scacCode && (
                    <span className="text-sm text-[#8B95A5] font-mono">SCAC {carrier.scacCode}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={carrier.status} />
                {carrier.safetyRating && carrier.safetyRating !== 'unknown' && (
                  <StatusBadge status={carrier.safetyRating} />
                )}
                <LogPerformanceButton carrierId={carrier.id} />
              </div>
            </div>

            <div className="mt-3 flex items-center flex-wrap gap-x-5 gap-y-1.5">
              {(carrier.addressCity || carrier.addressState) && (
                <span className="flex items-center gap-1.5 text-sm text-[#8B95A5]">
                  <MapPin className="h-3.5 w-3.5" />
                  {[carrier.addressCity, carrier.addressState, carrier.addressCountry]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              {carrier.website && (
                <a
                  href={carrier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-[#00C650] transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {carrier.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-md bg-[#0C1528] border border-[#1A2235] text-[#8B95A5]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav — client component handles switching */}
      <CarrierDetailTabs activeTab={tab} tabs={tabs} />

      {/* Tab content */}
      <div className="mt-6">
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Performance summary */}
            {totalShipments > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'On-Time Pickup', value: onTimePickup != null ? `${onTimePickup}%` : '—', good: (onTimePickup ?? 0) >= 90 },
                  { label: 'On-Time Delivery', value: onTimeDelivery != null ? `${onTimeDelivery}%` : '—', good: (onTimeDelivery ?? 0) >= 90 },
                  { label: 'Claim Rate', value: claimRate != null ? `${claimRate}%` : '—', good: (claimRate ?? 0) === 0, invert: true },
                  { label: 'Communication', value: avgComm != null ? `${avgComm.toFixed(1)} / 5` : '—', good: (avgComm ?? 0) >= 4 },
                ].map(({ label, value, good, invert }) => (
                  <div key={label} className="p-4 rounded-xl bg-[#080F1E] border border-[#1A2235]">
                    <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-2">{label}</div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: value === '—' ? '#8B95A5' : good ? '#00C650' : invert ? '#FF4444' : '#FFAA00' }}
                    >
                      {value}
                    </div>
                    <div className="text-xs text-[#8B95A5] mt-1">{totalShipments} shipments</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Equipment */}
              <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-4 w-4 text-[#8B95A5]" />
                  <h3 className="text-sm font-semibold text-white">Equipment Types</h3>
                </div>
                {equip.length === 0 ? (
                  <p className="text-sm text-[#8B95A5]">No equipment listed</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {equip.map((e) => (
                      <span
                        key={e}
                        className="px-3 py-1 rounded-lg text-sm bg-[#0C1528] border border-[#1A2235] text-[#8B95A5]"
                      >
                        {equipLabels[e] ?? e}
                      </span>
                    ))}
                  </div>
                )}

                {serviceAreas.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-[#8B95A5]" />
                      <h4 className="text-sm font-semibold text-white">Service Areas</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serviceAreas.map((area) => (
                        <span
                          key={area}
                          className="px-3 py-1 rounded-lg text-sm bg-[#0C1528] border border-[#1A2235] text-[#8B95A5]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-4 w-4 text-[#8B95A5]" />
                  <h3 className="text-sm font-semibold text-white">Notes</h3>
                </div>
                {carrier.notes ? (
                  <p className="text-sm text-[#8B95A5] leading-relaxed whitespace-pre-wrap">{carrier.notes}</p>
                ) : (
                  <p className="text-sm text-[#8B95A5] italic">No notes added.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACTS ── */}
        {tab === 'contacts' && (
          <div>
            {contacts.length === 0 ? (
              <EmptyState message="No contacts on file for this carrier." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contacts
                  .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                  .map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── INSURANCE ── */}
        {tab === 'insurance' && (
          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
            {insurance.length === 0 ? (
              <EmptyState message="No insurance certificates on file." />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A2235]">
                    {['Type', 'Provider', 'Policy #', 'Coverage', 'Effective', 'Expiry', 'Status'].map((col) => (
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
                  {insurance.map((ins) => {
                    const now = new Date();
                    const expiry = new Date(ins.expiryDate);
                    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const computedStatus =
                      expiry < now ? 'expired' : daysLeft <= 30 ? 'expiring_soon' : 'active';

                    return (
                      <tr key={ins.id} className="hover:bg-[#0C1528] transition-colors">
                        <td className="px-4 py-3.5 text-sm text-white font-medium">
                          {insTypeLabels[ins.type] ?? ins.type}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">{ins.provider ?? '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5] font-mono">{ins.policyNumber ?? '—'}</td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                          {ins.coverageAmount != null ? formatCurrency(ins.coverageAmount) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                          {ins.effectiveDate ? formatDate(ins.effectiveDate) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">{formatDate(ins.expiryDate)}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={computedStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── RATES ── */}
        {tab === 'rates' && (
          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
            {rates.length === 0 ? (
              <EmptyState message="No rates on file for this carrier." />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A2235]">
                    {['Origin', 'Destination', 'Equipment', 'Rate', 'Type', 'Effective', 'Expires', 'Notes'].map((col) => (
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
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-[#0C1528] transition-colors">
                      <td className="px-4 py-3.5 text-sm text-white">
                        {rate.originCity && rate.originState
                          ? `${rate.originCity}, ${rate.originState}`
                          : rate.originState ?? rate.originZip ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-white">
                        {rate.destCity && rate.destState
                          ? `${rate.destCity}, ${rate.destState}`
                          : rate.destState ?? rate.destZip ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                        {rate.equipmentType ? (equipLabels[rate.equipmentType] ?? rate.equipmentType) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-[#00C650]">
                        {formatCurrency(rate.rateAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#8B95A5]">
                        {rateTypeLabels[rate.rateType] ?? rate.rateType}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                        {rate.effectiveDate ? formatDate(rate.effectiveDate) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                        {rate.expiryDate ? formatDate(rate.expiryDate) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#8B95A5] max-w-[160px] truncate">
                        {rate.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── PERFORMANCE ── */}
        {tab === 'performance' && (
          <div>
            {/* Quick stats at top */}
            {totalShipments > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Shipments', value: totalShipments.toString(), color: '#00C650' },
                  { label: 'On-Time Pickup', value: onTimePickup != null ? `${onTimePickup}%` : '—', color: (onTimePickup ?? 0) >= 90 ? '#00C650' : '#FFAA00' },
                  { label: 'On-Time Delivery', value: onTimeDelivery != null ? `${onTimeDelivery}%` : '—', color: (onTimeDelivery ?? 0) >= 90 ? '#00C650' : '#FFAA00' },
                  { label: 'Claims Filed', value: perf.filter((p) => p.claimFiled).length.toString(), color: perf.some((p) => p.claimFiled) ? '#FF4444' : '#00C650' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl bg-[#080F1E] border border-[#1A2235]">
                    <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-2">{label}</div>
                    <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
              {performance.length === 0 ? (
                <EmptyState message="No performance records yet. Log a shipment to start tracking." />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A2235]">
                      {['Shipment', 'Date', 'Pickup', 'Delivery', 'Transit Days', 'Comm.', 'Claim', 'Damage', 'Notes'].map((col) => (
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
                    {[...performance].reverse().map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#0C1528] transition-colors">
                        <td className="px-4 py-3.5 text-sm text-white font-mono">
                          {rec.shipmentRef ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                          {formatDate(rec.recordedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          {rec.pickupOnTime == null ? (
                            <span className="text-sm text-[#8B95A5]">—</span>
                          ) : (
                            <OnTimeChip value={rec.pickupOnTime} />
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {rec.deliveryOnTime == null ? (
                            <span className="text-sm text-[#8B95A5]">—</span>
                          ) : (
                            <OnTimeChip value={rec.deliveryOnTime} />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                          {rec.transitDays != null ? `${rec.transitDays}d` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5]">
                          {rec.communicationScore != null ? `${rec.communicationScore}/5` : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {rec.claimFiled ? (
                            <span className="text-xs font-medium text-[#FF4444]">Yes</span>
                          ) : (
                            <span className="text-xs text-[#8B95A5]">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {rec.damageReported ? (
                            <span className="text-xs font-medium text-[#FF4444]">Yes</span>
                          ) : (
                            <span className="text-xs text-[#8B95A5]">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#8B95A5] max-w-[160px] truncate">
                          {rec.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OnTimeChip({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        value
          ? 'bg-[#00C650]/10 text-[#00C650]'
          : 'bg-[#FF4444]/10 text-[#FF4444]'
      }`}
    >
      {value ? 'On Time' : 'Late'}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <Star className="h-8 w-8 text-[#1A2235] mb-3" />
      <p className="text-sm text-[#8B95A5]">{message}</p>
    </div>
  );
}
