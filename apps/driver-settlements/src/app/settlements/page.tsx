export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { settlements, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SettlementsListClient } from './SettlementsListClient';

export default async function SettlementsPage() {
  const allSettlements = await db
    .select({
      id: settlements.id,
      settlement_number: settlements.settlement_number,
      driver_id: settlements.driver_id,
      period_start: settlements.period_start,
      period_end: settlements.period_end,
      status: settlements.status,
      gross_earnings: settlements.gross_earnings,
      total_deductions: settlements.total_deductions,
      total_reimbursements: settlements.total_reimbursements,
      total_advances: settlements.total_advances,
      net_pay: settlements.net_pay,
      paid_date: settlements.paid_date,
      payment_method: settlements.payment_method,
    })
    .from(settlements)
    .orderBy(settlements.id);

  const allDrivers = await db.select().from(drivers);

  const enriched = allSettlements.map((s) => {
    const driver = allDrivers.find((d) => d.id === s.driver_id);
    return {
      ...s,
      driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown',
    };
  });

  return <SettlementsListClient settlements={enriched} drivers={allDrivers} />;
}
