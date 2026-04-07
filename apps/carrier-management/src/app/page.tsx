export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carriers, carrierInsurance, carrierContacts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, XCircle, Truck, TrendingUp, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreRing } from '@/components/ScoreRing';
import { formatDate } from '@/lib/utils';
import { RequestCertButton } from '@/components/RequestCertButton';

async function getDashboardData() {
  const allCarriers = await db.select().from(carriers);

  const pendingVetting = allCarriers.filter(
    (c) => c.vettingStatus === 'not_started' || c.vettingStatus === 'in_progress'
  );

  const [allInsurance, allContacts] = await Promise.all([
    db
      .select({
        id: carrierInsurance.id,
        carrierId: carrierInsurance.carrierId,
        type: carrierInsurance.type,
        policyNumber: carrierInsurance.policyNumber,
        expiryDate: carrierInsurance.expiryDate,
        status: carrierInsurance.status,
        carrierName: carriers.name,
      })
      .from(carrierInsurance)
      .leftJoin(carriers, eq(carrierInsurance.carrierId, carriers.id)),
    db.select().from(carrierContacts),
  ]);

  // Build primary contact email map: carrierId -> { name, email }
  const primaryContactMap: Record<string, { name: string; email: string | null }> = {};
  for (const c of allContacts) {
    if (c.isPrimary || !primaryContactMap[c.carrierId]) {
      primaryContactMap[c.carrierId] = { name: c.name, email: c.email ?? null };
    }
  }

  const now = new Date();

  const expired = allInsurance.filter((i) => new Date(i.expiryDate) < now);
  const expiringSoon = allInsurance.filter((i) => {
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const activeCount = allCarriers.filter((c) => c.status === 'active').length;
  const avgScore =
    allCarriers.filter((c) => c.overallScore != null).reduce((s, c) => s + (c.overallScore ?? 0), 0) /
    (allCarriers.filter((c) => c.overallScore != null).length || 1);

  const topCarriers = [...allCarriers]
    .filter((c) => c.overallScore != null)
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
    .slice(0, 5);

  return { allCarriers, expired, expiringSoon, activeCount, avgScore, topCarriers, primaryContactMap, pendingVetting };
}

const typeLabels: Record<string, string> = {
  auto_liability: 'Auto Liability',
  cargo: 'Cargo',
  general_liability: 'Gen. Liability',
  workers_comp: "Workers' Comp",
};

export default async function DashboardPage() {
  const { allCarriers, expired, expiringSoon, activeCount, avgScore, topCarriers, primaryContactMap, pendingVetting } =
    await getDashboardData();

  const uniqueExpiredCarriers = new Set(expired.map((i) => i.carrierId)).size;
  const uniqueExpiringSoonCarriers = new Set(expiringSoon.map((i) => i.carrierId)).size;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">Carrier compliance & performance overview</p>
        </div>
        <Link
          href="/carriers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Carrier
        </Link>
      </div>

      {/* Vetting Alert */}
      {pendingVetting.length > 0 && (
        <div className="mb-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#3B82F6]/5 border border-[#3B82F6]/20">
            <ClipboardCheck className="h-5 w-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#3B82F6]">
                {pendingVetting.length} carrier{pendingVetting.length !== 1 ? 's' : ''} pending vetting
              </div>
              <div className="text-xs text-[#3B82F6]/70 mt-0.5">
                Complete carrier vetting before tendering loads to unvetted carriers.
              </div>
              <div className="mt-2">
                <Link
                  href="/carriers?vetting=pending"
                  className="text-xs text-[#3B82F6] underline underline-offset-2 hover:no-underline"
                >
                  View unvetted carriers →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Alerts */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="mb-6 space-y-3">
          {expired.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FF4444]/5 border border-[#FF4444]/20">
              <XCircle className="h-5 w-5 text-[#FF4444] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#FF4444]">
                  {expired.length} expired insurance certificate{expired.length !== 1 ? 's' : ''} — {uniqueExpiredCarriers} carrier{uniqueExpiredCarriers !== 1 ? 's' : ''} affected
                </div>
                <div className="text-xs text-[#FF4444]/70 mt-0.5">
                  Review immediately before tendering loads to these carriers.
                </div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {[...new Map(expired.map((i) => [i.carrierId, i])).values()].slice(0, 4).map((i) => {
                    const contact = primaryContactMap[i.carrierId];
                    return (
                      <span key={i.carrierId} className="flex items-center gap-1.5">
                        <Link
                          href={`/carriers/${i.carrierId}`}
                          className="text-xs text-[#FF4444] underline underline-offset-2 hover:no-underline"
                        >
                          {i.carrierName}
                        </Link>
                        <RequestCertButton
                          variant="compact"
                          carrierName={i.carrierName ?? ''}
                          contactEmail={contact?.email}
                          contactName={contact?.name}
                          insuranceType={i.type}
                          policyNumber={i.policyNumber}
                          expiryDate={i.expiryDate}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {expiringSoon.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFAA00]/5 border border-[#FFAA00]/20">
              <AlertTriangle className="h-5 w-5 text-[#FFAA00] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#FFAA00]">
                  {expiringSoon.length} certificate{expiringSoon.length !== 1 ? 's' : ''} expiring within 30 days — {uniqueExpiringSoonCarriers} carrier{uniqueExpiringSoonCarriers !== 1 ? 's' : ''} affected
                </div>
                <div className="text-xs text-[#FFAA00]/70 mt-0.5">
                  Request updated certificates before expiration.
                </div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {[...new Map(expiringSoon.map((i) => [i.carrierId, i])).values()].slice(0, 4).map((i) => {
                    const contact = primaryContactMap[i.carrierId];
                    return (
                      <span key={i.carrierId} className="flex items-center gap-1.5">
                        <Link
                          href={`/carriers/${i.carrierId}`}
                          className="text-xs text-[#FFAA00] underline underline-offset-2 hover:no-underline"
                        >
                          {i.carrierName}
                        </Link>
                        <RequestCertButton
                          variant="compact"
                          carrierName={i.carrierName ?? ''}
                          contactEmail={contact?.email}
                          contactName={contact?.name}
                          insuranceType={i.type}
                          policyNumber={i.policyNumber}
                          expiryDate={i.expiryDate}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Carriers',
            value: allCarriers.length,
            sub: `${activeCount} active`,
            icon: Truck,
            color: '#00C650',
          },
          {
            label: 'Avg Performance',
            value: Math.round(avgScore),
            sub: 'composite score',
            icon: TrendingUp,
            color: avgScore >= 85 ? '#00C650' : avgScore >= 70 ? '#FFAA00' : '#FF4444',
          },
          {
            label: 'Expired Insurance',
            value: expired.length,
            sub: `${uniqueExpiredCarriers} carriers`,
            icon: XCircle,
            color: expired.length > 0 ? '#FF4444' : '#00C650',
          },
          {
            label: 'Expiring Soon',
            value: expiringSoon.length,
            sub: 'within 30 days',
            icon: AlertTriangle,
            color: expiringSoon.length > 0 ? '#FFAA00' : '#00C650',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">{label}</span>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-xs text-[#8B95A5] mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Top Carriers */}
        <div className="md:col-span-3 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
          <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
            <h2 className="font-semibold text-white">Top Performers</h2>
            <Link href="/carriers" className="text-xs text-[#00C650] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#1A2235]">
            {topCarriers.map((carrier) => {
              const equip: string[] = JSON.parse(carrier.equipmentTypes ?? '[]');
              return (
                <Link
                  key={carrier.id}
                  href={`/carriers/${carrier.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#0C1528] transition-colors"
                >
                  <ScoreRing score={carrier.overallScore} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{carrier.name}</div>
                    <div className="text-xs text-[#8B95A5] mt-0.5">
                      {carrier.mcNumber} · {equip.slice(0, 2).map((e) => e.replace('_', ' ')).join(', ')}
                    </div>
                  </div>
                  <StatusBadge status={carrier.status} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Expiring Certs */}
        <div className="md:col-span-2 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
          <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
            <h2 className="font-semibold text-white">Upcoming Expirations</h2>
          </div>
          {expiringSoon.length === 0 && expired.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <CheckCircle className="h-8 w-8 text-[#00C650] mb-2" />
              <div className="text-sm font-medium text-white">All clear!</div>
              <div className="text-xs text-[#8B95A5] mt-1">No expiring certificates in the next 30 days.</div>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2235]">
              {[...expired, ...expiringSoon]
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .slice(0, 6)
                .map((ins) => {
                  const isExpired = new Date(ins.expiryDate) < new Date();
                  const contact = primaryContactMap[ins.carrierId];
                  return (
                    <div
                      key={ins.id}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-[#0C1528] transition-colors"
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isExpired ? 'bg-[#FF4444]' : 'bg-[#FFAA00]'}`} />
                      <Link href={`/carriers/${ins.carrierId}`} className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{ins.carrierName}</div>
                        <div className="text-xs text-[#8B95A5]">
                          {typeLabels[ins.type] ?? ins.type}
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className={`text-xs font-medium ${isExpired ? 'text-[#FF4444]' : 'text-[#FFAA00]'}`}>
                          {formatDate(ins.expiryDate)}
                        </div>
                        <RequestCertButton
                          variant="compact"
                          carrierName={ins.carrierName ?? ''}
                          contactEmail={contact?.email}
                          contactName={contact?.name}
                          insuranceType={ins.type}
                          policyNumber={ins.policyNumber}
                          expiryDate={ins.expiryDate}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
