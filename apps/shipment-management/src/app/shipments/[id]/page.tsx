export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments, shipmentEvents, shipmentDocuments, checkCalls } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getShipmentStatusLabel,
  getShipmentStatusColor,
  getEquipmentLabel,
  getEventTypeIcon,
  getEventTypeLabel,
} from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) notFound();

  const events = await db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, id))
    .orderBy(shipmentEvents.createdAt);

  const docs = await db
    .select()
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, id));

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.shipmentId, id))
    .orderBy(checkCalls.createdAt);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/shipments" className="text-[#8B95A5] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{shipment.shipmentNumber}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getShipmentStatusColor(shipment.status)}`}>
              {getShipmentStatusLabel(shipment.status)}
            </span>
          </div>
          <p className="text-[#8B95A5] text-sm mt-1">
            {shipment.customerName} · {shipment.originCity}, {shipment.originState} → {shipment.destCity}, {shipment.destState}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route & Schedule */}
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Route & Schedule</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Origin</div>
                <div className="text-white">{shipment.originCity}, {shipment.originState} {shipment.originZip}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Destination</div>
                <div className="text-white">{shipment.destCity}, {shipment.destState} {shipment.destZip}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Pickup Date</div>
                <div className="text-white">{formatDate(shipment.pickupDate)}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Delivery Date</div>
                <div className="text-white">{formatDate(shipment.deliveryDate)}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Equipment</div>
                <div className="text-white">{getEquipmentLabel(shipment.equipmentType)}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Miles</div>
                <div className="text-white">{shipment.miles?.toLocaleString() ?? '—'}</div>
              </div>
              {shipment.commodity && (
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Commodity</div>
                  <div className="text-white">{shipment.commodity}</div>
                </div>
              )}
              {shipment.weight && (
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Weight</div>
                  <div className="text-white">{shipment.weight.toLocaleString()} lbs</div>
                </div>
              )}
            </div>
          </div>

          {/* Financials */}
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Financials</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Customer Rate</div>
                <div className="text-white text-lg font-semibold">{formatCurrency(shipment.customerRate)}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Carrier Rate</div>
                <div className="text-white text-lg font-semibold">{formatCurrency(shipment.carrierRate)}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-1">Margin</div>
                <div className={`text-lg font-semibold ${shipment.marginPct != null && shipment.marginPct >= 20 ? 'text-green-400' : shipment.marginPct != null && shipment.marginPct >= 12 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {formatCurrency(shipment.margin)} {shipment.marginPct != null ? `(${shipment.marginPct.toFixed(1)}%)` : ''}
                </div>
              </div>
            </div>
            {shipment.loadRef && (
              <div className="mt-3 pt-3 border-t border-[#1A2235] flex gap-6 text-xs">
                <div><span className="text-[#8B95A5]">Load Ref: </span><span className="text-white">{shipment.loadRef}</span></div>
                {shipment.invoiceRef && <div><span className="text-[#8B95A5]">Invoice Ref: </span><span className="text-white">{shipment.invoiceRef}</span></div>}
                {shipment.carrierPaymentRef && <div><span className="text-[#8B95A5]">Carrier Pay Ref: </span><span className="text-white">{shipment.carrierPaymentRef}</span></div>}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Documents</h2>
            <div className="grid grid-cols-4 gap-3">
              {([
                ['Rate Con', shipment.hasRateCon],
                ['BOL', shipment.hasBol],
                ['POD', shipment.hasPod],
                ['Invoice', shipment.hasInvoice],
              ] as [string, boolean | null][]).map(([label, has]) => (
                <div
                  key={label}
                  className={`text-center py-3 rounded-lg border text-xs font-medium ${
                    has
                      ? 'border-green-400/20 bg-green-400/5 text-green-400'
                      : 'border-[#1A2235] bg-[#0C1528] text-[#8B95A5]'
                  }`}
                >
                  <div className="text-lg mb-1">{has ? '✓' : '○'}</div>
                  {label}
                </div>
              ))}
            </div>
            {docs.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-xs px-3 py-2 bg-[#0C1528] rounded">
                    <span className="text-white">{doc.filename}</span>
                    <span className="text-[#8B95A5]">{formatDateTime(doc.uploadedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check Calls */}
          {calls.length > 0 && (
            <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Check Calls ({calls.length})</h2>
              <div className="space-y-2">
                {calls.slice().reverse().map((call) => (
                  <div key={call.id} className="text-xs px-3 py-2.5 bg-[#0C1528] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium capitalize">{call.status.replace('_', ' ')}</span>
                      <span className="text-[#8B95A5]">{formatDateTime(call.createdAt)}</span>
                    </div>
                    {call.locationCity && (
                      <div className="text-[#8B95A5]">📍 {call.locationCity}, {call.locationState}</div>
                    )}
                    {call.notes && <div className="text-slate-300 mt-1">{call.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Carrier */}
          {shipment.carrierName && (
            <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Carrier</h2>
              <div className="text-sm space-y-2">
                <div className="text-white font-medium">{shipment.carrierName}</div>
                {shipment.carrierContact && <div className="text-[#8B95A5]">{shipment.carrierContact}</div>}
                {shipment.carrierPhone && <div className="text-[#8B95A5]">{shipment.carrierPhone}</div>}
              </div>
            </div>
          )}

          {/* Health Score */}
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Health Score</h2>
            <div className={`text-3xl font-bold ${(shipment.healthScore ?? 0) >= 85 ? 'text-green-400' : (shipment.healthScore ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {shipment.healthScore ?? 0}
            </div>
            <div className="mt-2 h-2 bg-[#1A2235] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${(shipment.healthScore ?? 0) >= 85 ? 'bg-green-400' : (shipment.healthScore ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${shipment.healthScore ?? 0}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Activity ({events.length})</h2>
            <div className="space-y-3">
              {events.slice().reverse().map((evt) => (
                <div key={evt.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>{getEventTypeIcon(evt.eventType)}</span>
                    <span className="text-[#8B95A5] text-xs">{getEventTypeLabel(evt.eventType)}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5 ml-5">{evt.description}</div>
                  <div className="text-[#8B95A5] ml-5 mt-0.5">{formatDateTime(evt.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
