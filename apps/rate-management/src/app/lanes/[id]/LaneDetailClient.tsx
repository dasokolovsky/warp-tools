'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, PowerOff, Plus, Trash2, Pencil, Star, Clock } from 'lucide-react';
import { LaneDisplay } from '@/components/LaneDisplay';
import { RateBasisBadge } from '@/components/RateBasisBadge';
import { RateTypeBadge } from '@/components/RateTypeBadge';
import { TariffStatusBadge } from '@/components/TariffStatusBadge';
import { MarginIndicator } from '@/components/MarginIndicator';
import { AddCarrierRateModal } from '@/components/AddCarrierRateModal';
import { AddTariffModal } from '@/components/AddTariffModal';
import { cn, getEquipmentLabel, getEquipmentColor, getLaneStatusColor, getLaneStatusLabel, formatCurrency, formatDate } from '@/lib/utils';
import type { Lane, CarrierRate, CustomerTariff, RFQ } from '@/db/schema';

type Tab = 'rates' | 'tariffs' | 'history' | 'rfqs';

interface LaneDetailClientProps {
  lane: Lane;
  rates: CarrierRate[];
  tariffs: CustomerTariff[];
  rfqs: RFQ[];
}

interface HistoryEntry {
  date: string;
  type: 'carrier' | 'tariff';
  name: string;
  rate: number;
  id: number;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function BestBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-[#00C650]/10 border border-[#00C650]/30 text-[#00C650]">
      <Star className="h-2.5 w-2.5 fill-current" />
      Best
    </span>
  );
}

export function LaneDetailClient({ lane: initialLane, rates: initialRates, tariffs: initialTariffs, rfqs }: LaneDetailClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('rates');
  const [lane, setLane] = useState<Lane>(initialLane);
  const [rates, setRates] = useState<CarrierRate[]>(initialRates);
  const [tariffs, setTariffs] = useState<CustomerTariff[]>(initialTariffs);

  const [addRateOpen, setAddRateOpen] = useState(false);
  const [editRate, setEditRate] = useState<CarrierRate | null>(null);
  const [addTariffOpen, setAddTariffOpen] = useState(false);
  const [editTariff, setEditTariff] = useState<CustomerTariff | null>(null);

  const [deactivating, setDeactivating] = useState(false);

  const bestRate = rates.length > 0 ? rates.reduce((a, b) => a.rate_amount < b.rate_amount ? a : b) : null;
  const activeTariff = tariffs.find(t => t.status === 'active') ?? null;

  // Rate History: combine rates + tariffs sorted by created_at desc
  const history: HistoryEntry[] = [
    ...rates.map(r => ({ date: r.created_at, type: 'carrier' as const, name: r.carrier_name, rate: r.rate_amount, id: r.id })),
    ...tariffs.map(t => ({ date: t.created_at, type: 'tariff' as const, name: t.customer_name, rate: t.rate_amount, id: t.id })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  async function handleDeactivate() {
    if (!confirm('Deactivate this lane? It will be marked inactive.')) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/lanes/${lane.id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setLane(data.lane);
      }
    } finally {
      setDeactivating(false);
    }
  }

  function handleRateSuccess(rate: CarrierRate) {
    setRates(prev => {
      const exists = prev.find(r => r.id === rate.id);
      if (exists) return prev.map(r => r.id === rate.id ? rate : r).sort((a, b) => a.rate_amount - b.rate_amount);
      return [...prev, rate].sort((a, b) => a.rate_amount - b.rate_amount);
    });
  }

  function handleTariffSuccess(tariff: CustomerTariff) {
    setTariffs(prev => {
      const exists = prev.find(t => t.id === tariff.id);
      if (exists) return prev.map(t => t.id === tariff.id ? tariff : t);
      return [...prev, tariff];
    });
  }

  async function handleDeleteRate(rateId: number) {
    if (!confirm('Delete this carrier rate?')) return;
    const res = await fetch(`/api/lanes/${lane.id}/carrier-rates/${rateId}`, { method: 'DELETE' });
    if (res.ok) setRates(prev => prev.filter(r => r.id !== rateId));
  }

  async function handleDeleteTariff(tariffId: number) {
    if (!confirm('Delete this tariff?')) return;
    const res = await fetch(`/api/lanes/${lane.id}/tariffs/${tariffId}`, { method: 'DELETE' });
    if (res.ok) setTariffs(prev => prev.filter(t => t.id !== tariffId));
  }

  const tags: string[] = lane.tags ? JSON.parse(lane.tags) : [];

  const tabClass = (t: Tab) => cn(
    'px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer',
    tab === t
      ? 'border-[#00C650] text-[#00C650]'
      : 'border-transparent text-[#8B95A5] hover:text-white'
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <LaneDisplay
              originCity={lane.origin_city}
              originState={lane.origin_state}
              destCity={lane.dest_city}
              destState={lane.dest_state}
              size="lg"
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border', getEquipmentColor(lane.equipment_type as Parameters<typeof getEquipmentColor>[0]))}>
                {getEquipmentLabel(lane.equipment_type as Parameters<typeof getEquipmentLabel>[0])}
              </span>
              {lane.estimated_miles && (
                <span className="text-xs text-[#8B95A5]">{lane.estimated_miles.toLocaleString()} mi</span>
              )}
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getLaneStatusColor(lane.status as Parameters<typeof getLaneStatusColor>[0]))}>
                {getLaneStatusLabel(lane.status as Parameters<typeof getLaneStatusLabel>[0])}
              </span>
              {tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-[#1A2235] text-[#8B95A5]">{tag}</span>
              ))}
            </div>
            {lane.notes && (
              <p className="text-sm text-[#8B95A5] mt-2 italic">{lane.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/lanes/${lane.id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white text-sm transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            {lane.status === 'active' && (
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 text-sm transition-colors disabled:opacity-50"
              >
                <PowerOff className="h-3.5 w-3.5" />
                Deactivate
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {(bestRate || activeTariff) && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1A2235]">
            {bestRate && (
              <div>
                <div className="text-xs text-[#8B95A5]">Best Carrier Rate</div>
                <div className="text-lg font-bold text-[#00C650]">
                  {formatCurrency(bestRate.rate_amount)}
                  <span className="text-xs font-normal text-[#8B95A5] ml-1">
                    <RateBasisBadge basis={bestRate.rate_basis} />
                  </span>
                </div>
              </div>
            )}
            {activeTariff && (
              <div>
                <div className="text-xs text-[#8B95A5]">Customer Tariff</div>
                <div className="text-lg font-bold text-white">{formatCurrency(activeTariff.rate_amount)}</div>
              </div>
            )}
            {bestRate && activeTariff && (
              <div>
                <div className="text-xs text-[#8B95A5]">Margin</div>
                <MarginIndicator tariffRate={activeTariff.rate_amount} carrierRate={bestRate.rate_amount} className="text-lg" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#1A2235]">
          <button className={tabClass('rates')} onClick={() => setTab('rates')}>
            Carrier Rates ({rates.length})
          </button>
          <button className={tabClass('tariffs')} onClick={() => setTab('tariffs')}>
            Customer Tariffs ({tariffs.length})
          </button>
          <button className={tabClass('history')} onClick={() => setTab('history')}>
            Rate History
          </button>
          <button className={tabClass('rfqs')} onClick={() => setTab('rfqs')}>
            RFQs ({rfqs.length})
          </button>
        </div>

        {/* Carrier Rates Tab */}
        {tab === 'rates' && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A2235]">
              <span className="text-sm text-[#8B95A5]">{rates.length} carrier rate{rates.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setEditRate(null); setAddRateOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C650] text-black font-semibold rounded-lg text-xs hover:bg-[#00B348] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rate
              </button>
            </div>
            {rates.length === 0 ? (
              <div className="py-16 text-center text-[#8B95A5]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No carrier rates yet</p>
                <p className="text-xs mt-1">Add your first rate to start tracking</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-[#1A2235]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Basis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Effective</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Source</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2235]">
                  {rates.map(rate => {
                    const isBest = bestRate?.id === rate.id;
                    const expired = isExpired(rate.expiry_date);
                    return (
                      <tr
                        key={rate.id}
                        className={cn(
                          'transition-colors',
                          isBest && 'bg-[#00C650]/5',
                          expired && 'opacity-50',
                          'hover:bg-[#0D1526]'
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">{rate.carrier_name}</span>
                            {isBest && <BestBadge />}
                          </div>
                          {rate.contact_name && (
                            <div className="text-xs text-[#8B95A5] mt-0.5">{rate.contact_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(rate.rate_amount)}</td>
                        <td className="px-4 py-3"><RateBasisBadge basis={rate.rate_basis} /></td>
                        <td className="px-4 py-3"><RateTypeBadge type={rate.rate_type} /></td>
                        <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(rate.effective_date)}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={expired ? 'text-red-400' : 'text-[#8B95A5]'}>
                            {formatDate(rate.expiry_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#8B95A5] capitalize">{rate.source ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditRate(rate); setAddRateOpen(true); }}
                              className="p-1.5 rounded text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(rate.id)}
                              className="p-1.5 rounded text-[#8B95A5] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Customer Tariffs Tab */}
        {tab === 'tariffs' && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A2235]">
              <span className="text-sm text-[#8B95A5]">{tariffs.length} tariff{tariffs.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setEditTariff(null); setAddTariffOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C650] text-black font-semibold rounded-lg text-xs hover:bg-[#00B348] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Tariff
              </button>
            </div>
            {tariffs.length === 0 ? (
              <div className="py-16 text-center text-[#8B95A5]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No customer tariffs yet</p>
                <p className="text-xs mt-1">Add a tariff to track margin on this lane</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-[#1A2235]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Basis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Contract</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Effective</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Margin</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2235]">
                  {tariffs.map(tariff => (
                    <tr key={tariff.id} className="hover:bg-[#0D1526] transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm text-white font-medium">{tariff.customer_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(tariff.rate_amount)}</td>
                      <td className="px-4 py-3"><RateBasisBadge basis={tariff.rate_basis} /></td>
                      <td className="px-4 py-3 text-xs text-[#8B95A5]">{tariff.contract_ref ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(tariff.effective_date)}</td>
                      <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(tariff.expiry_date)}</td>
                      <td className="px-4 py-3"><TariffStatusBadge status={tariff.status} /></td>
                      <td className="px-4 py-3">
                        {bestRate ? (
                          <MarginIndicator tariffRate={tariff.rate_amount} carrierRate={bestRate.rate_amount} />
                        ) : <span className="text-[#8B95A5] text-xs">No rate</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditTariff(tariff); setAddTariffOpen(true); }}
                            className="p-1.5 rounded text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTariff(tariff.id)}
                            className="p-1.5 rounded text-[#8B95A5] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rate History Tab */}
        {tab === 'history' && (
          <div>
            <div className="px-5 py-3 border-b border-[#1A2235]">
              <span className="text-sm text-[#8B95A5]">{history.length} rate entr{history.length !== 1 ? 'ies' : 'y'}</span>
            </div>
            {history.length === 0 ? (
              <div className="py-16 text-center text-[#8B95A5]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No rate history yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-[#1A2235]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Date Added</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Carrier / Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2235]">
                  {history.map(entry => (
                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-[#0D1526] transition-colors">
                      <td className="px-5 py-3 text-xs text-[#8B95A5]">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded border font-medium',
                          entry.type === 'carrier'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                        )}>
                          {entry.type === 'carrier' ? 'Carrier Rate' : 'Customer Tariff'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{entry.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(entry.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* RFQs Tab */}
        {tab === 'rfqs' && (
          <div className="py-16 text-center text-[#8B95A5]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D1526] mb-3">
              <Clock className="h-6 w-6 opacity-30" />
            </div>
            <p className="font-medium">RFQs for this lane</p>
            <p className="text-xs mt-1">{rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''} found — full RFQ management coming soon</p>
            {rfqs.length > 0 && (
              <div className="mt-4 space-y-2 max-w-sm mx-auto text-left">
                {rfqs.map(rfq => (
                  <div key={rfq.id} className="bg-[#0D1526] border border-[#1A2235] rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{rfq.rfq_number}</span>
                      <span className="text-xs text-[#8B95A5] capitalize">{rfq.status}</span>
                    </div>
                    {rfq.pickup_date && (
                      <div className="text-xs text-[#8B95A5] mt-1">Pickup: {formatDate(rfq.pickup_date)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCarrierRateModal
        laneId={lane.id}
        open={addRateOpen}
        onOpenChange={open => { setAddRateOpen(open); if (!open) setEditRate(null); }}
        onSuccess={handleRateSuccess}
        editRate={editRate}
      />
      <AddTariffModal
        laneId={lane.id}
        open={addTariffOpen}
        onOpenChange={open => { setAddTariffOpen(open); if (!open) setEditTariff(null); }}
        onSuccess={handleTariffSuccess}
        editTariff={editTariff}
      />
    </div>
  );
}
