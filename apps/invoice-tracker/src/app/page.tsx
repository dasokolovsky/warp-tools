export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { invoices, carrierPayments, loads, customers, paymentsReceived } from '@/db/schema';
import Link from 'next/link';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  Truck,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AgingChart } from '@/components/AgingChart';

async function getDashboardData() {
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

  const overdueByCustomer: Record<string, { name: string; amount: number; count: number; customerId: string }> = {};
  for (const inv of overdueInvoices) {
    const name = customerMap[inv.customerId] ?? 'Unknown';
    if (!overdueByCustomer[inv.customerId]) {
      overdueByCustomer[inv.customerId] = { name, amount: 0, count: 0, customerId: inv.customerId };
    }
    overdueByCustomer[inv.customerId].amount += inv.total - inv.amountPaid;
    overdueByCustomer[inv.customerId].count += 1;
  }
  const worstOffenders = Object.values(overdueByCustomer)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

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
    const daysOverdue = Math.ceil(
      (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

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
    type: 'invoice_created' | 'payment_received' | 'carrier_payment';
    id: string;
    description: string;
    amount: number;
    timestamp: string;
    linkHref: string;
    status?: string;
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
      status: inv.status,
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
      description: `Carrier pay — ${cp.carrierName}${cp.loadRef ? ` (${cp.loadRef})` : ''}`,
      amount: cp.netAmount,
      timestamp: cp.createdAt,
      linkHref: `/payments`,
      status: cp.status,
    });
  }

  const recentActivity = activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
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
  };
}

const statusColors: Record<string, string> = {
  paid: '#00C650',
  sent: '#3B82F6',
  overdue: '#FF4444',
  partially_paid: '#FFAA00',
  draft: '#8B95A5',
  void: '#4B5563',
  pending: '#8B95A5',
  approved: '#3B82F6',
  disputed: '#FF4444',
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">Cash position, aging summary, and recent activity</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* ─── Cash Position Card ─────────────────────────────────────────────── */}
      <div className="mb-6 p-6 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-[#00C650]" />
          <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide">Cash Position</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receivables */}
          <div>
            <div className="text-xs text-[#8B95A5] mb-1 font-medium uppercase tracking-wide">Total Receivables</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(data.totalReceivables)}</div>
            <div className="text-xs text-[#8B95A5] mt-1">What customers owe you</div>
          </div>

          {/* Payables */}
          <div>
            <div className="text-xs text-[#8B95A5] mb-1 font-medium uppercase tracking-wide">Total Payables</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(data.totalPayables)}</div>
            <div className="text-xs text-[#8B95A5] mt-1">What you owe carriers</div>
          </div>

          {/* Net Position */}
          <div className="md:border-l md:border-[#1A2235] md:pl-6">
            <div className="text-xs text-[#8B95A5] mb-1 font-medium uppercase tracking-wide">Net Position</div>
            <div
              className="text-3xl font-bold"
              style={{ color: data.cashPosition >= 0 ? '#00C650' : '#FF4444' }}
            >
              {data.cashPosition >= 0 ? '+' : ''}{formatCurrency(data.cashPosition)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {data.cashPosition >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-[#00C650]" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-[#FF4444]" />
              )}
              <span className="text-xs" style={{ color: data.cashPosition >= 0 ? '#00C650' : '#FF4444' }}>
                {data.cashPosition >= 0 ? 'Positive' : 'Negative'} cash position
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Overdue Alert ──────────────────────────────────────────────────── */}
      {data.overdueCount > 0 && (
        <Link href="/invoices?status=overdue" className="block mb-6">
          <div className="p-4 rounded-xl bg-[#FF4444]/5 border border-[#FF4444]/20 hover:bg-[#FF4444]/10 transition-colors">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#FF4444] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#FF4444]">
                  {data.overdueCount} invoice{data.overdueCount !== 1 ? 's' : ''} overdue — {formatCurrency(data.overdueTotal)}
                </div>
                <div className="text-xs text-[#FF4444]/70 mt-0.5 mb-3">
                  Collect immediately to maintain healthy cash flow.
                </div>
                <div className="space-y-1.5">
                  {data.worstOffenders.map((offender) => (
                    <div key={offender.customerId} className="flex items-center justify-between">
                      <span className="text-xs text-[#FF4444]/80 font-medium">{offender.name}</span>
                      <span className="text-xs text-[#FF4444] font-semibold">
                        {formatCurrency(offender.amount)}
                        <span className="text-[#FF4444]/60 font-normal ml-1">
                          ({offender.count} invoice{offender.count !== 1 ? 's' : ''})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#FF4444]/50 mt-0.5 flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}

      {/* ─── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Revenue This Month',
            value: formatCurrency(data.revenueThisMonth),
            sub: 'invoiced (non-draft)',
            icon: BarChart3,
            color: '#00C650',
          },
          {
            label: 'Revenue This Quarter',
            value: formatCurrency(data.revenueThisQuarter),
            sub: 'invoiced (non-draft)',
            icon: TrendingUp,
            color: '#3B82F6',
          },
          {
            label: 'Avg Margin',
            value: `${data.averageMarginPct.toFixed(1)}%`,
            sub: 'across all loads',
            icon: DollarSign,
            color: data.averageMarginPct >= 20 ? '#00C650' : data.averageMarginPct >= 10 ? '#FFAA00' : '#FF4444',
          },
          {
            label: 'Total Profit',
            value: formatCurrency(data.totalProfit),
            sub: 'revenue minus carrier cost',
            icon: DollarSign,
            color: data.totalProfit >= 0 ? '#00C650' : '#FF4444',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide leading-tight">{label}</span>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-[#8B95A5] mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Bottom Grid: Aging + Activity ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Aging Summary */}
        <div className="md:col-span-2 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
          <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
            <h2 className="font-semibold text-white">Receivables Aging</h2>
            <Link
              href="/reports/aging"
              className="text-xs text-[#00C650] hover:underline flex items-center gap-1"
            >
              Full report →
            </Link>
          </div>
          <div className="p-5">
            <AgingChart buckets={data.agingBuckets} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-3 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
          <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <Link href="/invoices" className="text-xs text-[#00C650] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#1A2235]">
            {data.recentActivity.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#8B95A5]">No activity yet.</div>
            ) : (
              data.recentActivity.map((item) => {
                const Icon =
                  item.type === 'payment_received'
                    ? CheckCircle2
                    : item.type === 'carrier_payment'
                    ? Truck
                    : FileText;
                const iconColor =
                  item.type === 'payment_received'
                    ? '#00C650'
                    : item.type === 'carrier_payment'
                    ? '#8B95A5'
                    : (item.status ? statusColors[item.status] : '#3B82F6') ?? '#3B82F6';

                const amountColor =
                  item.type === 'payment_received'
                    ? '#00C650'
                    : item.type === 'carrier_payment'
                    ? '#FF4444'
                    : '#FFFFFF';

                const amountPrefix =
                  item.type === 'payment_received'
                    ? '+'
                    : item.type === 'carrier_payment'
                    ? '−'
                    : '';

                // Format timestamp
                const ts = new Date(item.timestamp);
                const timeStr = ts.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <Link
                    key={item.id}
                    href={item.linkHref}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#0C1528] transition-colors"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${iconColor}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{item.description}</div>
                      <div className="text-xs text-[#8B95A5] mt-0.5">{timeStr}</div>
                    </div>
                    <div
                      className="text-sm font-semibold flex-shrink-0"
                      style={{ color: amountColor }}
                    >
                      {amountPrefix}{formatCurrency(item.amount)}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
