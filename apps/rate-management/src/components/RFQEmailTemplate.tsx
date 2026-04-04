'use client';

import { useState } from 'react';
import { Copy, Mail, Check } from 'lucide-react';

interface RFQEmailTemplateProps {
  rfqNumber: string;
  origin: string;
  destination: string;
  equipmentType: string;
  pickupDate?: string | null;
  desiredRate?: number | null;
  companyName?: string;
}

export function RFQEmailTemplate({
  rfqNumber,
  origin,
  destination,
  equipmentType,
  pickupDate,
  desiredRate,
  companyName,
}: RFQEmailTemplateProps) {
  const [copied, setCopied] = useState(false);

  const text = [
    `RATE REQUEST — ${rfqNumber}`,
    ``,
    `Lane: ${origin} → ${destination}`,
    `Equipment: ${equipmentType}`,
    `Pickup: ${pickupDate ?? 'TBD'}`,
    desiredRate != null ? `Target Rate: $${desiredRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
    ``,
    `Please reply with your rate for this lane.`,
    companyName ? `\n— ${companyName}` : null,
  ].filter(Boolean).join('\n');

  const subject = encodeURIComponent(`Rate Request — ${rfqNumber}: ${origin} → ${destination}`);
  const body = encodeURIComponent(text);
  const mailtoHref = `mailto:?subject=${subject}&body=${body}`;

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-[#0C1528] border border-[#1A2235] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235]">
        <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Email Template</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1A2235] hover:bg-[#243047] text-[#8B95A5] hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a
            href={mailtoHref}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00C650]/10 hover:bg-[#00C650]/20 text-[#00C650] border border-[#00C650]/20 transition-colors"
          >
            <Mail className="h-3 w-3" />
            Open in Email
          </a>
        </div>
      </div>
      <pre className="px-4 py-4 text-sm text-white font-mono whitespace-pre-wrap leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
