export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { db } from '@/db';
import { shipments } from '@/db/schema';
import { ShipmentsClient } from './ShipmentsClient';

async function getShipmentMeta() {
  const all = await db
    .select({
      customerName: shipments.customerName,
      carrierName: shipments.carrierName,
    })
    .from(shipments);

  const customerSet = new Set<string>();
  const carrierSet = new Set<string>();

  for (const s of all) {
    customerSet.add(s.customerName);
    if (s.carrierName) carrierSet.add(s.carrierName);
  }

  return {
    customers: Array.from(customerSet).sort(),
    carriers: Array.from(carrierSet).sort(),
  };
}

interface ShipmentsPageProps {
  searchParams: Promise<{ view?: string; status?: string }>;
}

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const [meta, params] = await Promise.all([
    getShipmentMeta(),
    searchParams,
  ]);

  return (
    <Suspense fallback={<div className="p-6 text-[#8B95A5]">Loading…</div>}>
      <ShipmentsClient
        initialView={params.view ?? 'table'}
        initialStatus={params.status ?? ''}
        customers={meta.customers}
        carriers={meta.carriers}
      />
    </Suspense>
  );
}
