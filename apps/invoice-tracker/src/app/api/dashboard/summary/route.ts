export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, carrierPayments, loads, customers, paymentsReceived } from '@/db/schema';

export async function GET() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const [
    allInvoices,
    allCarrierPayments,
    allLoads,
    allCustomers,
    allPaymentsReceived,
  ] = await Promise.all([
    db.select().from(invoices),
    db.select().from(carrierPayments),
    db.select().from(loads),
    db.select().from(customers),
    db.select().from(paymentsReceived),
  ]);

  // Customer name map
  const customerMap = Object.fromEntries(allCustomers.map((c) => [c.id, c.name]));

  // ─── Receivables ───────────────────────────────────────────────────────────
  const openInvoices = allInvoices.filter((inv) =>
    ['sent', 'partially_paid', 'overdue'].includes(inv.status)
  );
  const totalReceivables = openInvoices.reduce(
    (sum, inv) => sum + (inv.total - inv.amountPaid),
    0
  );

  // ─── Payables ──────────────────────────────────────────────────────────────
  const openPayables = allCarrierPayments.filter((cp) =>
    ['pending', 'approved', 'disputed'].includes(cp.status)
  );
  const totalPayables = openPayables.reduce((sum, cp) => sum + cp.netAmount, 0);
  const cashPosition = totalReceivables - totalPayables;

  // ─── Overdue ───────────────────────────────────────────────────────────────
  const overdueInvoices = allInvoices.filter((inv) => inv.status === 'overdue');
  const overdueCount = overdueInvoices.length;
  const overdueTotal = overdueInvoices.reduce(
    (sum, inv) => sum + (inv.total - inv.amountPaid),
    0
  );

  // Worst offenders by customer
  const overdueByCustomer: Record<string, { name: string; amount: number; count: number }> = {};
  for (const inv of overdueInvoices) {
    const name = customerMap[inv.customerId] ?? 'Unknown';
    if (!overdueByCustomer[inv.customerId]) {
      overdueByCustomer[inv.customerId] = { name, amount: 0, count: 0 };
    }
    overdueByCustomer[inv.customerId].amount += inv.total - inv.amountPaid;
    overdueByCustomer[inv.customerId].count += 1;
  }
  const worstOffenders = Object.entries(overdueByCustomer)
    .map(([id, data]) => ({ customerId: id, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ─── Revenue ───────────────────────────────────────────────────────────────
  const revenueInvoices = allInvoices.filter((inv) => !['void', 'draft'].includes(inv.status));
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const firstOfQuarter = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
  ).toISOString().split('T')[0];

  const revenueThisMonth = revenueInvoices
    .filter((inv) => inv.invoiceDate >= firstOfMonth)
    .reduce((sum, inv) => sum + inv.total, 0);

  const revenueThisQuarter = revenueInvoices
    .filter((inv) => inv.invoiceDate >= firstOfQuarter)
    .reduce((sum, inv) => sum + inv.total, 0);

  // ─── Margin / Profit ───────────────────────────────────────────────────────
  const loadsWithMargin = allLoads.filter((l) => l.revenue > 0);
  const totalProfit = loadsWithMargin.reduce((sum, l) => sum + (l.revenue - l.cost), 0);
  const averageMarginPct =
    loadsWithMargin.length > 0
      ? loadsWithMargin.reduce((sum, l) => sum + ((l.revenue - l.cost) / l.revenue) * 100, 0) /
        loadsWithMargin.length
      : 0;

  // ─── Aging Buckets ─────────────────────────────────────────────────────────
  const agingBuckets = {
    current: { amount: 0, count: 0 },
    days1to30: { amount: 0, count: 0 },
    days31to60: { amount: 0, count: 0 },
    days61to90: { amount: 0, count: 0 },
    days90plus: { amount: 0, count: 0 },
  };

  for (const inv of openInvoices) {
    const outstanding = inv.total - inv.amountPaid;
    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.ceil((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      agingBuckets.current.amount += outstanding;
      agingBuckets.current.count += 1;
    } else if (daysOverdue <= 30) {
      agingBuckets.days1to30.amount += outstanding;
      agingBuckets.days1to30.count += 1;
    } else if (daysOverdue <= 60) {
      agingBuckets.days31to60.amount += outstanding;
      agingBuckets.days31to60.count += 1;
    } else if (daysOverdue <= 90) {
      agingBuckets.days61to90.amount += outstanding;
      agingBuckets.days61to90.count += 1;
    } else {
      agingBuckets.days90plus.amount += outstanding;
      agingBuckets.days90plus.count += 1;
    }
  }

  // ─── Recent Activity ───────────────────────────────────────────────────────
  type ActivityItem = {
    type: 'invoice_created' | 'invoice_updated' | 'payment_received' | 'carrier_payment';
    id: string;
    description: string;
    amount: number;
    timestamp: string;
    linkHref: string;
  };

  const activity: ActivityItem[] = [];

  for (const inv of allInvoices) {
    const customerName = customerMap[inv.customerId] ?? 'Unknown';
    activity.push({
      type: 'invoice_created',
      id: `inv-${inv.id}`,
      description: `Invoice ${inv.invoiceNumber} — ${customerName}`,
      amount: inv.total,
      timestamp: inv.createdAt,
      linkHref: `/invoices/${inv.id}`,
    });
  }

  for (const pr of allPaymentsReceived) {
    const inv = allInvoices.find((i) => i.id === pr.invoiceId);
    const customerName = inv ? (customerMap[inv.customerId] ?? 'Unknown') : 'Unknown';
    activity.push({
      type: 'payment_received',
      id: `pr-${pr.id}`,
      description: `Payment received — ${inv?.invoiceNumber ?? 'Invoice'} from ${customerName}`,
      amount: pr.amount,
      timestamp: pr.createdAt,
      linkHref: `/invoices/${pr.invoiceId}`,
    });
  }

  for (const cp of allCarrierPayments) {
    activity.push({
      type: 'carrier_payment',
      id: `cp-${cp.id}`,
      description: `Carrier pay — ${cp.carrierName} (${cp.loadRef ?? ''})`,
      amount: cp.netAmount,
      timestamp: cp.createdAt,
      linkHref: `/payments/${cp.id}`,
    });
  }

  const recentActivity = activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return NextResponse.json({
    totalReceivables,
    totalPayables,
    cashPosition,
    overdueCount,
    overdueTotal,
    worstOffenders,
    revenueThisMonth,
    revenueThisQuarter,
    averageMarginPct,
    totalProfit,
    agingBuckets,
    recentActivity,
  });
}
