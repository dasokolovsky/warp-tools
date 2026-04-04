'use client';

import { useState, useEffect, useRef } from 'react';
import { Printer, Copy, Download, FileText } from 'lucide-react';
import { RateConForm } from '@/components/RateConForm';
import { RateConPreview } from '@/components/RateConPreview';
import { TemplateManager } from '@/components/TemplateManager';
import type { RateConData } from './types';
import { defaultRateConData } from './types';

const COMPANY_STORAGE_KEY = 'warp-ratecon-company';

function loadCompanyFromStorage(): Partial<RateConData['company']> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildPlainText(data: RateConData): string {
  const lines: string[] = [];
  lines.push('RATE CONFIRMATION');
  lines.push('='.repeat(60));
  if (data.company.name) {
    lines.push(data.company.name);
    const info = [data.company.address, data.company.phone, data.company.email]
      .filter(Boolean)
      .join(' | ');
    if (info) lines.push(info);
    if (data.company.mc) lines.push(`MC# ${data.company.mc}`);
  }
  lines.push('');
  lines.push(`Load #: ${data.loadNumber || '—'}    Date: ${data.date}`);
  lines.push('');
  lines.push('PICKUP:');
  lines.push(data.pickup.company || '—');
  const puAddr = [data.pickup.address, data.pickup.city, data.pickup.state, data.pickup.zip].filter(Boolean).join(', ');
  if (puAddr) lines.push(puAddr);
  lines.push(`Date: ${data.pickup.date || '—'}  |  Time: ${data.pickup.timeWindow || '—'}`);
  if (data.pickup.contactName || data.pickup.contactPhone) {
    lines.push(`Contact: ${data.pickup.contactName || ''} — ${data.pickup.contactPhone || ''}`);
  }
  lines.push('');
  lines.push('DELIVERY:');
  lines.push(data.delivery.company || '—');
  const dlAddr = [data.delivery.address, data.delivery.city, data.delivery.state, data.delivery.zip].filter(Boolean).join(', ');
  if (dlAddr) lines.push(dlAddr);
  lines.push(`Date: ${data.delivery.date || '—'}  |  Time: ${data.delivery.timeWindow || '—'}`);
  if (data.delivery.contactName || data.delivery.contactPhone) {
    lines.push(`Contact: ${data.delivery.contactName || ''} — ${data.delivery.contactPhone || ''}`);
  }
  lines.push('');
  lines.push(`EQUIPMENT: ${data.equipment}`);
  lines.push(`WEIGHT: ${data.weight ? `${data.weight} lbs` : '—'}  |  COMMODITY: ${data.commodity || '—'}`);
  lines.push('');
  const rate = parseFloat(data.rateAmount) || 0;
  const miles = parseFloat(data.miles) || 0;
  const fsc = parseFloat(data.fuelSurcharge) || 0;
  const baseRate = data.rateType === 'per_mile' ? rate * miles : rate;
  let total = baseRate + fsc;
  if (data.rateType === 'per_mile') {
    lines.push(`RATE: $${rate.toFixed(2)}/mile × ${miles} miles = $${baseRate.toFixed(2)}`);
  } else {
    lines.push(`RATE: $${rate.toFixed(2)} flat`);
  }
  if (fsc > 0) lines.push(`FUEL SURCHARGE: $${fsc.toFixed(2)}`);
  for (const acc of data.accessorials) {
    const amt = parseFloat(acc.amount) || 0;
    total += amt;
    lines.push(`${acc.description || 'Accessorial'}: $${amt.toFixed(2)}`);
  }
  lines.push(`TOTAL: $${total.toFixed(2)}`);
  lines.push(`PAYMENT TERMS: ${data.paymentTerms}`);
  if (data.specialInstructions) {
    lines.push('');
    lines.push('SPECIAL INSTRUCTIONS:');
    lines.push(data.specialInstructions);
  }
  lines.push('');
  lines.push('TERMS & CONDITIONS:');
  lines.push(data.terms);
  lines.push('');
  lines.push('CARRIER ACCEPTANCE:');
  lines.push(`Carrier: ${data.carrierName || '—'} | MC# ${data.carrierMC || '—'} | DOT# ${data.carrierDOT || '—'}`);
  lines.push(`Driver: ${data.driverName || '—'} | Phone: ${data.driverPhone || '—'}`);
  lines.push(`Truck #: ${data.truckNumber || '—'} | Trailer #: ${data.trailerNumber || '—'}`);
  lines.push('');
  lines.push('Signature: ________________    Date: ________________');
  return lines.join('\n');
}

export default function RateConPage() {
  const [data, setData] = useState<RateConData>(() => {
    const base = defaultRateConData();
    const saved = loadCompanyFromStorage();
    return { ...base, company: { ...base.company, ...saved } };
  });
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Persist company info to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(data.company));
    } catch {
      // ignore storage errors
    }
  }, [data.company]);

  function handlePrint() {
    window.print();
  }

  function handleCopyText() {
    const text = buildPlainText(data);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadHTML() {
    const el = document.getElementById('rate-con-document');
    if (!el) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Rate Confirmation - Load #${data.loadNumber || 'N/A'}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; margin: 40px; color: #111; background: white; line-height: 1.5; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${el.innerHTML}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-con-${data.loadNumber || 'draft'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#040810]">
      {/* Header */}
      <header className="border-b border-[#1A2235] bg-[#040810] sticky top-0 z-20 no-print">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C650] rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-black" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100">Rate Confirmation Generator</h1>
              <p className="text-xs text-[#8B95A5]">Warp Tools — free &amp; open source</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <TemplateManager data={data} onLoad={setData} />
            <div className="w-px h-6 bg-[#1A2235] mx-1" />
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-slate-200 hover:border-[#00C650] transition-colors"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-slate-200 hover:border-[#00C650] transition-colors"
            >
              <Download size={14} />
              Download
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-[#00C650] rounded-lg text-sm font-medium text-black hover:bg-green-400 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Form */}
          <div className="no-print">
            <h2 className="text-xs font-semibold text-[#8B95A5] uppercase tracking-wider mb-4">
              Load Details
            </h2>
            <RateConForm data={data} onChange={setData} />
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-xs font-semibold text-[#8B95A5] uppercase tracking-wider mb-4 no-print">
              Live Preview
            </h2>
            <div
              ref={previewRef}
              className="bg-white rounded-xl shadow-2xl p-8 print:p-0 print:shadow-none print:rounded-none"
              style={{ minHeight: '600px' }}
            >
              <RateConPreview data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
