'use client';

import type { TripRow, DeductionRow, ReimbursementRow, AdvanceRow, PayType, SettlementCalc } from '@/lib/types';
import { fmt, calcTripPay, calcDeduction, rateSuffix } from '@/lib/calculations';

interface Props {
  driverName: string;
  periodStart: string;
  periodEnd: string;
  trips: TripRow[];
  deductions: DeductionRow[];
  reimbursements: ReimbursementRow[];
  advances: AdvanceRow[];
  payType: PayType;
  rate: number;
  calc: SettlementCalc;
}

export default function PrintableStatement({
  driverName,
  periodStart,
  periodEnd,
  trips,
  deductions,
  reimbursements,
  advances,
  payType,
  rate,
  calc,
}: Props) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="print-only" id="printable-statement">
      <style>{`
        @media print {
          * { box-sizing: border-box; }
          body { background: white !important; color: black !important; font-family: Arial, sans-serif; }
          #printable-statement { display: block !important; padding: 40px; max-width: 700px; margin: 0 auto; }
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .print-table th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 12px; border: 1px solid #ddd; }
          .print-table td { padding: 8px 12px; font-size: 12px; border: 1px solid #ddd; }
          .print-table tr:nth-child(even) td { background: #fafafa; }
          .net-pay-box { background: #f0fff4; border: 2px solid #00C650; border-radius: 8px; padding: 20px; margin-top: 20px; text-align: center; }
          .net-pay-amount { font-size: 36px; font-weight: bold; color: #00C650; }
          .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #444; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          .summary-row.total { font-weight: bold; font-size: 14px; border-top: 2px solid #ddd; margin-top: 4px; padding-top: 10px; }
          .deduction-amt { color: #dc2626; }
          .reimb-amt { color: #16a34a; }
          .header-company { font-size: 22px; font-weight: bold; color: #111; }
          .header-sub { font-size: 12px; color: #888; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; font-size: 12px; }
          .meta-item label { display: block; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta-item span { font-weight: 600; color: #111; font-size: 13px; }
        }
      `}</style>

      <div className="header-company">[ Your Company Name ]</div>
      <div className="header-sub">Driver Settlement Statement &mdash; Generated {today}</div>

      <div className="meta-grid">
        <div className="meta-item">
          <label>Driver</label>
          <span>{driverName || 'Driver Name'}</span>
        </div>
        <div className="meta-item">
          <label>Pay Type</label>
          <span>{payType.replace('-', ' ')} @ {rate} {rateSuffix(payType)}</span>
        </div>
        <div className="meta-item">
          <label>Period Start</label>
          <span>{periodStart || '—'}</span>
        </div>
        <div className="meta-item">
          <label>Period End</label>
          <span>{periodEnd || '—'}</span>
        </div>
      </div>

      {trips.length > 0 && (
        <>
          <div className="section-title">Trips / Earnings</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Miles</th>
                <th>Revenue</th>
                <th>Hours</th>
                <th>Stops</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip, i) => (
                <tr key={trip.id}>
                  <td>{i + 1}</td>
                  <td>{trip.description || '—'}</td>
                  <td>{trip.miles || '—'}</td>
                  <td>{trip.revenue ? fmt(parseFloat(trip.revenue)) : '—'}</td>
                  <td>{trip.hours || '—'}</td>
                  <td>{trip.stops || '—'}</td>
                  <td><strong>{fmt(calcTripPay(trip, payType, rate))}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {deductions.length > 0 && (
        <>
          <div className="section-title">Deductions</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Type</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d, i) => {
                const amt = parseFloat(d.amount) || 0;
                const computed = calcDeduction(amt, d.type, calc.grossEarnings);
                return (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td>{d.description || '—'}</td>
                    <td>{d.type === 'fixed' ? 'Fixed $' : '% of Gross'}</td>
                    <td>{d.type === 'percent' ? `${amt}%` : fmt(amt)}</td>
                    <td className="deduction-amt">-{fmt(computed)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {advances.length > 0 && (
        <>
          <div className="section-title">Advances</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td>{a.date || '—'}</td>
                  <td>{a.reason || '—'}</td>
                  <td className="deduction-amt">-{fmt(parseFloat(a.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {reimbursements.length > 0 && (
        <>
          <div className="section-title">Reimbursements</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.description || '—'}</td>
                  <td className="reimb-amt">+{fmt(parseFloat(r.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="section-title">Summary</div>
      <div className="summary-row">
        <span>Gross Earnings</span>
        <span>{fmt(calc.grossEarnings)}</span>
      </div>
      <div className="summary-row">
        <span>Total Deductions</span>
        <span className="deduction-amt">-{fmt(calc.totalDeductions)}</span>
      </div>
      <div className="summary-row">
        <span>Total Advances</span>
        <span className="deduction-amt">-{fmt(calc.totalAdvances)}</span>
      </div>
      <div className="summary-row">
        <span>Total Reimbursements</span>
        <span className="reimb-amt">+{fmt(calc.totalReimbursements)}</span>
      </div>

      <div className="net-pay-box">
        <div style={{ fontSize: '13px', color: '#444', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Net Pay</div>
        <div className="net-pay-amount">{fmt(calc.netPay)}</div>
      </div>
    </div>
  );
}
