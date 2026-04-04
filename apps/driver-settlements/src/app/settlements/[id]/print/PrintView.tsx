'use client';

import { useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  Settlement,
  Driver,
  Trip,
  SettlementDeduction,
  SettlementReimbursement,
  Advance,
} from '@/db/schema';

interface Props {
  settlement: Settlement;
  driver: Driver | null;
  trips: Trip[];
  deductions: SettlementDeduction[];
  reimbursements: SettlementReimbursement[];
  advances: Advance[];
}

export function PrintView({ settlement, driver, trips, deductions, reimbursements, advances }: Props) {
  const companyName = 'Warp Tools Transport';
  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'N/A';

  return (
    <div className="print-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; color: #111; font-family: 'Inter', Arial, sans-serif; }
        .print-container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; min-height: 100vh; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #111; }
        .company-name { font-size: 20px; font-weight: 700; color: #111; }
        .company-sub { font-size: 12px; color: #666; margin-top: 4px; }
        .settlement-title { font-size: 14px; color: #666; }
        .settlement-number { font-size: 22px; font-weight: 700; font-family: monospace; }
        .settlement-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f8f8f8; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .info-label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.05em; }
        .info-value { font-size: 13px; font-weight: 600; color: #111; margin-top: 2px; }
        h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin: 24px 0 10px; color: #333; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 6px 10px; background: #f0f0f0; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #ddd; }
        th.right { text-align: right; }
        td { padding: 6px 10px; border: 1px solid #eee; }
        td.right { text-align: right; }
        tr.total td { font-weight: 700; background: #f8f8f8; border-top: 2px solid #ddd; }
        .net-pay-box { margin-top: 32px; border: 2px solid #111; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
        .net-label { font-size: 14px; font-weight: 700; }
        .net-formula { font-size: 11px; color: #666; margin-top: 4px; }
        .net-amount { font-size: 28px; font-weight: 700; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print-container { padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print / Close buttons — hidden when printing */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 100 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#111', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Print
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      <div className="header">
        <div>
          <div className="company-name">{companyName}</div>
          <div className="company-sub">Driver Settlement Statement</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="settlement-title">Settlement #</div>
          <div className="settlement-number">{settlement.settlement_number}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {formatDate(settlement.period_start)} – {formatDate(settlement.period_end)}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            Status: {settlement.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="settlement-info">
        <div>
          <div className="info-label">Driver</div>
          <div className="info-value">{driverName}</div>
        </div>
        <div>
          <div className="info-label">Pay Type</div>
          <div className="info-value" style={{ textTransform: 'capitalize' }}>
            {driver?.pay_type?.replace('_', ' ') ?? 'N/A'} @ {driver?.pay_type === 'percentage' ? `${driver.pay_rate}%` : `$${driver?.pay_rate}`}
          </div>
        </div>
        {settlement.paid_date && (
          <div>
            <div className="info-label">Paid Date</div>
            <div className="info-value">{formatDate(settlement.paid_date)}</div>
          </div>
        )}
        {settlement.payment_method && (
          <div>
            <div className="info-label">Payment Method</div>
            <div className="info-value" style={{ textTransform: 'uppercase' }}>{settlement.payment_method}</div>
          </div>
        )}
        {settlement.payment_reference && (
          <div>
            <div className="info-label">Reference #</div>
            <div className="info-value" style={{ fontFamily: 'monospace' }}>{settlement.payment_reference}</div>
          </div>
        )}
        {settlement.approved_by && (
          <div>
            <div className="info-label">Approved By</div>
            <div className="info-value">{settlement.approved_by}</div>
          </div>
        )}
      </div>

      <h2>Earnings</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Load Ref</th>
            <th>Origin</th>
            <th>Destination</th>
            <th className="right">Miles</th>
            <th className="right">Revenue</th>
            <th className="right">Pay</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id}>
              <td>{formatDate(t.trip_date)}</td>
              <td style={{ fontFamily: 'monospace' }}>{t.load_ref ?? '—'}</td>
              <td>{t.origin_city}, {t.origin_state}</td>
              <td>{t.dest_city}, {t.dest_state}</td>
              <td className="right">{t.miles ?? '—'}</td>
              <td className="right">{t.revenue != null ? formatCurrency(t.revenue) : '—'}</td>
              <td className="right">{formatCurrency(t.pay_amount)}</td>
            </tr>
          ))}
          <tr className="total">
            <td colSpan={6}>Gross Earnings</td>
            <td className="right">{formatCurrency(settlement.gross_earnings)}</td>
          </tr>
        </tbody>
      </table>

      {deductions.length > 0 && (
        <>
          <h2>Deductions</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d) => (
                <tr key={d.id}>
                  <td>{d.description}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.category.replace('_', ' ')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.deduction_type.replace('_', ' ')}</td>
                  <td className="right" style={{ color: '#c00' }}>−{formatCurrency(d.amount)}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total Deductions</td>
                <td className="right" style={{ color: '#c00' }}>−{formatCurrency(settlement.total_deductions)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {reimbursements.length > 0 && (
        <>
          <h2>Reimbursements</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Receipt Ref</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.map((r) => (
                <tr key={r.id}>
                  <td>{r.description}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.receipt_ref ?? '—'}</td>
                  <td className="right" style={{ color: '#0070c0' }}>+{formatCurrency(r.amount)}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total Reimbursements</td>
                <td className="right" style={{ color: '#0070c0' }}>+{formatCurrency(settlement.total_reimbursements)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {advances.length > 0 && (
        <>
          <h2>Advance Deductions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.reason ?? '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.status}</td>
                  <td className="right" style={{ color: '#c60' }}>−{formatCurrency(a.amount)}</td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total Advances</td>
                <td className="right" style={{ color: '#c60' }}>−{formatCurrency(settlement.total_advances)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <div className="net-pay-box">
        <div>
          <div className="net-label">NET PAY</div>
          <div className="net-formula">
            {formatCurrency(settlement.gross_earnings)} gross
            {settlement.total_deductions > 0 && ` − ${formatCurrency(settlement.total_deductions)} deductions`}
            {settlement.total_advances > 0 && ` − ${formatCurrency(settlement.total_advances)} advances`}
            {settlement.total_reimbursements > 0 && ` + ${formatCurrency(settlement.total_reimbursements)} reimbursements`}
          </div>
        </div>
        <div className="net-amount" style={{ color: settlement.net_pay >= 0 ? '#008000' : '#c00000' }}>
          {formatCurrency(settlement.net_pay)}
        </div>
      </div>

      {settlement.notes && (
        <div style={{ marginTop: 24, padding: 16, background: '#f8f8f8', borderRadius: 8, fontSize: 12, color: '#555' }}>
          <strong>Notes:</strong> {settlement.notes}
        </div>
      )}

      <div className="footer">
        Generated by Warp Tools — Driver Settlement System · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}
