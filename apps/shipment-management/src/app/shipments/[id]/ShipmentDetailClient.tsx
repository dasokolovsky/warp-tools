'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Truck, DollarSign, FileText,
  MapPin, Calendar, Package, Weight, ArrowRight,
  Edit, AlertTriangle,
} from 'lucide-react';
import { StatusActionButtons } from './StatusActionButtons';
import { AssignCarrierModal } from './AssignCarrierModal';
import { AddCheckCallModal } from './AddCheckCallModal';
import { AddDocumentModal } from './AddDocumentModal';
import { CheckCallTimeline } from '@/components/CheckCallTimeline';
import { ShipmentTimeline } from '@/components/ShipmentTimeline';
import { DocChecklist } from '@/components/DocChecklist';
import { HealthScoreBadge } from '@/components/HealthScoreBadge';
import {
  formatCurrency, formatDate,
  getShipmentStatusLabel, getShipmentStatusColor,
  getEquipmentLabel, getEquipmentColor,
  getMarginColor,
} from '@/lib/utils';
import type { Shipment, ShipmentEvent, ShipmentDocument, CheckCall } from '@/db/schema';

interface Props {
  shipment: Shipment;
  events: ShipmentEvent[];
  docs: ShipmentDocument[];
  calls: CheckCall[];
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#1A2235] last:border-0">
      <span className="text-xs text-[#8B95A5] flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-200 text-right">{value ?? '—'}</span>
    </div>
  );
}

export function ShipmentDetailClient({ shipment, events, docs, calls }: Props) {
  const [showAssignCarrier, setShowAssignCarrier] = useState(false);
  const [showAddCheckCall, setShowAddCheckCall] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [addDocType, setAddDocType] = useState('');

  function handleAddDocument(docType: string) {
    setAddDocType(docType);
    setShowAddDocument(true);
  }

  const statusColor = getShipmentStatusColor(shipment.status);
  const equipColor = getEquipmentColor(shipment.equipmentType);
  const marginColor = getMarginColor(shipment.marginPct);

  const isTerminal = ['closed', 'cancelled', 'claim'].includes(shipment.status);

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/shipments" className="text-[#8B95A5] hover:text-white transition-colors mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {shipment.shipmentNumber}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
                {getShipmentStatusLabel(shipment.status)}
              </span>
              <HealthScoreBadge score={shipment.healthScore ?? 0} size="md" />
            </div>
            <p className="text-[#8B95A5] text-sm mt-1.5">
              {shipment.customerName}
              {shipment.loadRef && <span className="ml-2 text-xs">· {shipment.loadRef}</span>}
            </p>
          </div>
        </div>

        {/* Status action buttons */}
        {!isTerminal && (
          <div className="flex-shrink-0">
            <StatusActionButtons shipmentId={shipment.id} status={shipment.status} />
          </div>
        )}
      </div>

      {/* Cancelled / Claim banner */}
      {shipment.status === 'cancelled' && shipment.cancellationReason && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-red-400">Cancelled</span>
            <p className="text-sm text-slate-300 mt-0.5">{shipment.cancellationReason}</p>
          </div>
        </div>
      )}
      {shipment.status === 'claim' && shipment.notes && (
        <div className="bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-orange-400">Claim Filed</span>
            <p className="text-sm text-slate-300 mt-0.5">{shipment.notes}</p>
          </div>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Route Card */}
          <Card>
            <SectionTitle icon={<MapPin className="h-4 w-4 text-[#00C650]" />}>
              Route
            </SectionTitle>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="text-xs text-[#8B95A5] mb-0.5">Origin</div>
                <div className="text-lg font-semibold text-white">
                  {shipment.originCity}, {shipment.originState}
                </div>
                {shipment.originZip && (
                  <div className="text-xs text-[#8B95A5]">{shipment.originZip}</div>
                )}
              </div>
              <ArrowRight className="h-5 w-5 text-[#8B95A5] flex-shrink-0" />
              <div className="flex-1 text-right">
                <div className="text-xs text-[#8B95A5] mb-0.5">Destination</div>
                <div className="text-lg font-semibold text-white">
                  {shipment.destCity}, {shipment.destState}
                </div>
                {shipment.destZip && (
                  <div className="text-xs text-[#8B95A5]">{shipment.destZip}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1A2235]">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-[#8B95A5] mb-1">
                  <Calendar className="h-3 w-3" /> Pickup
                </div>
                <div className="text-sm font-medium text-white">{formatDate(shipment.pickupDate)}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-[#8B95A5] mb-1">
                  <Calendar className="h-3 w-3" /> Delivery
                </div>
                <div className="text-sm font-medium text-white">{formatDate(shipment.deliveryDate)}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-[#8B95A5] mb-1">
                  <Truck className="h-3 w-3" /> Equipment
                </div>
                <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md border ${equipColor}`}>
                  {getEquipmentLabel(shipment.equipmentType)}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-[#8B95A5] mb-1">
                  <ArrowRight className="h-3 w-3" /> Miles
                </div>
                <div className="text-sm font-medium text-white">
                  {shipment.miles?.toLocaleString() ?? '—'}
                </div>
              </div>
            </div>
            {(shipment.commodity || shipment.weight) && (
              <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-[#1A2235]">
                {shipment.commodity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-3.5 w-3.5 text-[#8B95A5]" />
                    <span className="text-[#8B95A5]">Commodity:</span>
                    <span className="text-white">{shipment.commodity}</span>
                  </div>
                )}
                {shipment.weight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="h-3.5 w-3.5 text-[#8B95A5]" />
                    <span className="text-[#8B95A5]">Weight:</span>
                    <span className="text-white">{shipment.weight.toLocaleString()} lbs</span>
                  </div>
                )}
              </div>
            )}
            {shipment.specialInstructions && (
              <div className="mt-3 pt-3 border-t border-[#1A2235]">
                <div className="text-xs text-[#8B95A5] mb-1">Special Instructions</div>
                <p className="text-sm text-slate-300">{shipment.specialInstructions}</p>
              </div>
            )}
          </Card>

          {/* Carrier + Financial side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Carrier Card */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <SectionTitle icon={<Truck className="h-4 w-4 text-[#00C650]" />}>
                  Carrier
                </SectionTitle>
                <button
                  onClick={() => setShowAssignCarrier(true)}
                  className="text-xs text-[#00C650] hover:text-[#00C650]/80 transition-colors flex-shrink-0"
                >
                  {shipment.carrierName ? 'Change' : 'Assign Carrier'}
                </button>
              </div>

              {shipment.carrierName ? (
                <div className="space-y-1">
                  <FieldRow label="Name" value={<span className="font-medium">{shipment.carrierName}</span>} />
                  {shipment.carrierContact && <FieldRow label="Contact" value={shipment.carrierContact} />}
                  {shipment.carrierPhone && (
                    <FieldRow
                      label="Phone"
                      value={
                        <a
                          href={`tel:${shipment.carrierPhone}`}
                          className="flex items-center gap-1.5 text-[#00C650] hover:text-[#00C650]/80 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {shipment.carrierPhone}
                        </a>
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-[#8B95A5] opacity-40" />
                  <p className="text-sm text-[#8B95A5]">No carrier assigned</p>
                  <button
                    onClick={() => setShowAssignCarrier(true)}
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
                  >
                    Assign Carrier
                  </button>
                </div>
              )}
            </Card>

            {/* Financial Card */}
            <Card>
              <SectionTitle icon={<DollarSign className="h-4 w-4 text-[#00C650]" />}>
                Financials
              </SectionTitle>
              <div className="space-y-1">
                <FieldRow label="Customer Rate" value={
                  <span className="font-semibold text-white">{formatCurrency(shipment.customerRate)}</span>
                } />
                <FieldRow label="Carrier Rate" value={
                  <span className="font-semibold text-white">{formatCurrency(shipment.carrierRate)}</span>
                } />
                <FieldRow label="Rate Type" value={
                  <span className="capitalize">{shipment.rateType ?? '—'}</span>
                } />
                <FieldRow label="Margin" value={
                  <span className={`font-semibold ${marginColor}`}>
                    {formatCurrency(shipment.margin)}
                    {shipment.marginPct != null && (
                      <span className="text-xs ml-1">({shipment.marginPct.toFixed(1)}%)</span>
                    )}
                  </span>
                } />
              </div>
              {(shipment.invoiceRef || shipment.carrierPaymentRef) && (
                <div className="mt-3 pt-3 border-t border-[#1A2235] space-y-1">
                  {shipment.invoiceRef && (
                    <FieldRow label="Invoice Ref" value={shipment.invoiceRef} />
                  )}
                  {shipment.carrierPaymentRef && (
                    <FieldRow label="Carrier Pay Ref" value={shipment.carrierPaymentRef} />
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Documents Card */}
          <Card>
            <SectionTitle icon={<FileText className="h-4 w-4 text-[#00C650]" />}>
              Documents
            </SectionTitle>
            <DocChecklist
              hasBol={shipment.hasBol ?? false}
              hasPod={shipment.hasPod ?? false}
              hasRateCon={shipment.hasRateCon ?? false}
              hasInvoice={shipment.hasInvoice ?? false}
              docScore={shipment.docScore ?? 0}
              onAddDocument={handleAddDocument}
            />

            {/* Document list */}
            {docs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1A2235] space-y-1.5">
                <div className="text-xs text-[#8B95A5] mb-2">Uploaded Documents</div>
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-xs px-3 py-2.5 bg-[#0C1528] rounded-lg hover:bg-[#1A2235] transition-colors group">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#8B95A5]" />
                      <span className="text-white">{doc.filename}</span>
                      <span className="text-[#8B95A5] capitalize">{doc.docType.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[#8B95A5]">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Check Calls */}
          <Card>
            <CheckCallTimeline
              shipmentId={shipment.id}
              checkCalls={calls}
              onAddCheckCall={() => setShowAddCheckCall(true)}
            />
          </Card>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <Card>
            <ShipmentTimeline shipmentId={shipment.id} events={events} />
          </Card>

          {/* Notes */}
          {shipment.notes && (
            <Card>
              <SectionTitle>Notes</SectionTitle>
              <p className="text-sm text-slate-300 leading-relaxed">{shipment.notes}</p>
            </Card>
          )}

          {/* Tags */}
          {shipment.tags && shipment.tags.length > 0 && (
            <Card>
              <SectionTitle>Tags</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {shipment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-xs bg-[#1A2235] text-[#8B95A5] border border-[#2A3245]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <SectionTitle>Actions</SectionTitle>
            <div className="space-y-2">
              <Link
                href={`/shipments/${shipment.id}/edit`}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors border border-[#1A2235]"
              >
                <Edit className="h-4 w-4" />
                Edit Shipment
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showAssignCarrier && (
        <AssignCarrierModal
          shipmentId={shipment.id}
          customerRate={shipment.customerRate}
          existingCarrier={shipment.carrierName ? {
            carrierName: shipment.carrierName,
            carrierContact: shipment.carrierContact,
            carrierPhone: shipment.carrierPhone,
            carrierRate: shipment.carrierRate,
          } : undefined}
          onClose={() => setShowAssignCarrier(false)}
        />
      )}
      {showAddCheckCall && (
        <AddCheckCallModal
          shipmentId={shipment.id}
          onClose={() => setShowAddCheckCall(false)}
        />
      )}
      {showAddDocument && (
        <AddDocumentModal
          shipmentId={shipment.id}
          defaultDocType={addDocType}
          onClose={() => setShowAddDocument(false)}
        />
      )}
    </div>
  );
}
