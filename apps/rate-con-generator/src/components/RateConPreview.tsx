'use client';

import type { RateConData } from '@/app/types';

interface Props {
  data: RateConData;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatCurrency(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return '$0.00';
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function computeTotal(data: RateConData): string {
  let total = 0;
  const rate = parseFloat(data.rateAmount) || 0;
  const miles = parseFloat(data.miles) || 0;
  const fsc = parseFloat(data.fuelSurcharge) || 0;

  if (data.rateType === 'per_mile') {
    total = rate * miles;
  } else {
    total = rate;
  }

  total += fsc;

  for (const acc of data.accessorials) {
    total += parseFloat(acc.amount) || 0;
  }

  return `$${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatRateDisplay(data: RateConData): string {
  if (!data.rateAmount) return '—';
  const rate = parseFloat(data.rateAmount);
  if (isNaN(rate)) return '—';
  if (data.rateType === 'per_mile') {
    return `$${rate.toFixed(2)}/mile${data.miles ? ` × ${data.miles} miles` : ''}`;
  }
  return `$${rate.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} flat`;
}

function formatAddress(stop: RateConData['pickup']): string {
  const parts = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean);
  if (stop.city && stop.state) {
    return [stop.address, `${stop.city}, ${stop.state} ${stop.zip}`.trim()].filter(Boolean).join(', ');
  }
  return parts.join(', ');
}

export function RateConPreview({ data }: Props) {
  const total = computeTotal(data);
  const companyLine = [data.company.address, data.company.phone, data.company.email]
    .filter(Boolean)
    .join(' | ');
  const hasFSC = data.fuelSurcharge && parseFloat(data.fuelSurcharge) > 0;

  return (
    <div
      id="rate-con-document"
      className="rate-con-preview bg-white text-gray-900 font-sans"
      style={{ fontFamily: 'Georgia, Times New Roman, serif', lineHeight: '1.5' }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '3px solid #1a1a1a',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                margin: 0,
                color: '#111',
              }}
            >
              Rate Confirmation
            </h1>
            {data.company.name && (
              <div style={{ marginTop: '6px' }}>
                <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111' }}>
                  {data.company.name}
                </p>
                {companyLine && (
                  <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 0' }}>
                    {companyLine}
                  </p>
                )}
                {data.company.mc && (
                  <p style={{ fontSize: '11px', color: '#555', margin: '1px 0 0' }}>
                    MC# {data.company.mc}
                  </p>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
              Load #{' '}
              <strong style={{ color: '#111' }}>{data.loadNumber || '—'}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#555', margin: '2px 0 0' }}>
              Date: <strong style={{ color: '#111' }}>{formatDate(data.date)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Pickup + Delivery side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Pickup */}
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#f8f8f8',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#555',
              margin: '0 0 8px',
            }}
          >
            📦 Pickup
          </p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: '#111' }}>
            {data.pickup.company || <span style={{ color: '#aaa' }}>Company Name</span>}
          </p>
          {(data.pickup.address || data.pickup.city) && (
            <p style={{ fontSize: '12px', color: '#444', margin: '0 0 2px' }}>
              {formatAddress(data.pickup)}
            </p>
          )}
          <p style={{ fontSize: '12px', color: '#444', margin: '0 0 2px' }}>
            Date: {formatDate(data.pickup.date)}
            {data.pickup.timeWindow && ` | Time: ${data.pickup.timeWindow}`}
          </p>
          {(data.pickup.contactName || data.pickup.contactPhone) && (
            <p style={{ fontSize: '12px', color: '#444', margin: 0 }}>
              Contact: {data.pickup.contactName}
              {data.pickup.contactName && data.pickup.contactPhone ? ' — ' : ''}
              {data.pickup.contactPhone}
            </p>
          )}
        </div>

        {/* Delivery */}
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#f8f8f8',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#555',
              margin: '0 0 8px',
            }}
          >
            🏁 Delivery
          </p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px', color: '#111' }}>
            {data.delivery.company || <span style={{ color: '#aaa' }}>Company Name</span>}
          </p>
          {(data.delivery.address || data.delivery.city) && (
            <p style={{ fontSize: '12px', color: '#444', margin: '0 0 2px' }}>
              {formatAddress(data.delivery)}
            </p>
          )}
          <p style={{ fontSize: '12px', color: '#444', margin: '0 0 2px' }}>
            Date: {formatDate(data.delivery.date)}
            {data.delivery.timeWindow && ` | Time: ${data.delivery.timeWindow}`}
          </p>
          {(data.delivery.contactName || data.delivery.contactPhone) && (
            <p style={{ fontSize: '12px', color: '#444', margin: 0 }}>
              Contact: {data.delivery.contactName}
              {data.delivery.contactName && data.delivery.contactPhone ? ' — ' : ''}
              {data.delivery.contactPhone}
            </p>
          )}
        </div>
      </div>

      {/* Cargo Info */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '12px',
          backgroundColor: '#f8f8f8',
          marginBottom: '20px',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#555',
            margin: '0 0 8px',
          }}
        >
          Cargo Details
        </p>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12px', color: '#333' }}>
          <span>
            <strong>Equipment:</strong> {data.equipment || '—'}
          </span>
          <span>
            <strong>Weight:</strong> {data.weight ? `${data.weight} lbs` : '—'}
          </span>
          <span>
            <strong>Commodity:</strong> {data.commodity || '—'}
          </span>
        </div>
        {data.specialInstructions && (
          <p style={{ fontSize: '12px', color: '#444', margin: '8px 0 0' }}>
            <strong>Special Instructions:</strong> {data.specialInstructions}
          </p>
        )}
      </div>

      {/* Rate Section */}
      <div
        style={{
          border: '2px solid #111',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fff',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#555',
            margin: '0 0 10px',
          }}
        >
          Rate &amp; Payment
        </p>
        <div style={{ fontSize: '13px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ color: '#444' }}>
              Line Haul Rate {data.rateType === 'per_mile' ? '(per mile)' : '(flat)'}
            </span>
            <strong>{formatRateDisplay(data)}</strong>
          </div>
          {hasFSC && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <span style={{ color: '#444' }}>Fuel Surcharge</span>
              <span>{formatCurrency(data.fuelSurcharge)}</span>
            </div>
          )}
          {data.accessorials.map((acc) => (
            <div
              key={acc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <span style={{ color: '#444' }}>{acc.description || 'Accessorial'}</span>
              <span>{acc.amount ? formatCurrency(acc.amount) : '—'}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0 4px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            <span>TOTAL</span>
            <span>{total}</span>
          </div>
          <p style={{ fontSize: '12px', color: '#555', margin: '4px 0 0' }}>
            <strong>Payment Terms:</strong> {data.paymentTerms}
          </p>
        </div>
      </div>

      {/* Carrier Acceptance */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#f8f8f8',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#555',
            margin: '0 0 8px',
          }}
        >
          Carrier Acceptance
        </p>
        <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
          <p style={{ margin: '0 0 2px' }}>
            <strong>Carrier:</strong> {data.carrierName || '—'}
            {data.carrierMC && ` | MC# ${data.carrierMC}`}
            {data.carrierDOT && ` | DOT# ${data.carrierDOT}`}
          </p>
          <p style={{ margin: '0 0 2px' }}>
            <strong>Driver:</strong> {data.driverName || '—'}
            {data.driverPhone && ` | Phone: ${data.driverPhone}`}
          </p>
          <p style={{ margin: '0 0 16px' }}>
            <strong>Truck #:</strong> {data.truckNumber || '—'}
            {data.trailerNumber && ` | Trailer #: ${data.trailerNumber}`}
          </p>
          <div style={{ display: 'flex', gap: '48px', marginTop: '8px' }}>
            <div>
              <div style={{ borderBottom: '1px solid #888', width: '200px', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Carrier Signature</p>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #888', width: '120px', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {data.terms && (
        <div style={{ marginBottom: '8px' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#555',
              margin: '0 0 6px',
            }}
          >
            Terms &amp; Conditions
          </p>
          <p
            style={{
              fontSize: '10px',
              color: '#444',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            {data.terms}
          </p>
        </div>
      )}
    </div>
  );
}
