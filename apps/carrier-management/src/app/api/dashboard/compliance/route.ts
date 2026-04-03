import { NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierInsurance, carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const allInsurance = await db
    .select({
      id: carrierInsurance.id,
      carrierId: carrierInsurance.carrierId,
      type: carrierInsurance.type,
      provider: carrierInsurance.provider,
      expiryDate: carrierInsurance.expiryDate,
      status: carrierInsurance.status,
      carrierName: carriers.name,
    })
    .from(carrierInsurance)
    .leftJoin(carriers, eq(carrierInsurance.carrierId, carriers.id));

  const now = new Date();

  const expired = allInsurance.filter((i) => {
    const d = new Date(i.expiryDate);
    return d < now;
  });

  const expiringThisWeek = allInsurance.filter((i) => {
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const expiringThisMonth = allInsurance.filter((i) => {
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  return NextResponse.json({
    expired,
    expiringThisWeek,
    expiringThisMonth,
    totals: {
      expired: expired.length,
      expiringThisWeek: expiringThisWeek.length,
      expiringThisMonth: expiringThisMonth.length,
    },
  });
}
