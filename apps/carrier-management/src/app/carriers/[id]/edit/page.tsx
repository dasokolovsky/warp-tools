export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditCarrierForm } from './EditCarrierForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCarrierPage({ params }: PageProps) {
  const { id } = await params;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) notFound();

  const equipmentTypes: string[] = JSON.parse(carrier.equipmentTypes ?? '[]');

  const initialData = {
    name: carrier.name ?? '',
    mcNumber: carrier.mcNumber ?? '',
    dotNumber: carrier.dotNumber ?? '',
    scacCode: carrier.scacCode ?? '',
    addressStreet: carrier.addressStreet ?? '',
    addressCity: carrier.addressCity ?? '',
    addressState: carrier.addressState ?? '',
    addressZip: carrier.addressZip ?? '',
    website: carrier.website ?? '',
    equipmentTypes,
    notes: carrier.notes ?? '',
    status: (carrier.status ?? 'active') as 'active' | 'inactive' | 'blacklisted',
    authorityStatus: (carrier.authorityStatus ?? 'unknown') as 'active' | 'inactive' | 'revoked' | 'unknown',
    safetyRating: (carrier.safetyRating ?? 'unknown') as 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not_rated' | 'unknown',
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/carriers/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {carrier.name}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Carrier</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Update details for {carrier.name}</p>
      </div>

      <EditCarrierForm carrierId={id} initialData={initialData} />
    </div>
  );
}
