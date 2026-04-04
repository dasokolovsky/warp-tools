'use client';

import { CheckCircle2, XCircle, Plus } from 'lucide-react';

interface DocItem {
  label: string;
  key: 'bol' | 'pod' | 'rate_confirmation' | 'invoice';
  has: boolean;
}

interface Props {
  hasBol: boolean;
  hasPod: boolean;
  hasRateCon: boolean;
  hasInvoice: boolean;
  docScore: number;
  onAddDocument: (docType: string) => void;
}

export function DocChecklist({
  hasBol,
  hasPod,
  hasRateCon,
  hasInvoice,
  docScore,
  onAddDocument,
}: Props) {
  const items: DocItem[] = [
    { label: 'BOL', key: 'bol', has: hasBol },
    { label: 'POD', key: 'pod', has: hasPod },
    { label: 'Rate Confirmation', key: 'rate_confirmation', has: hasRateCon },
    { label: 'Invoice', key: 'invoice', has: hasInvoice },
  ];

  const count = items.filter((i) => i.has).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#8B95A5]">
            {count}/4 documents
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            docScore >= 75 ? 'bg-green-400/10 text-green-400' :
            docScore >= 50 ? 'bg-yellow-400/10 text-yellow-400' :
            'bg-red-400/10 text-red-400'
          }`}>
            {docScore}%
          </span>
        </div>
        <button
          onClick={() => onAddDocument('')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Document
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
              item.has
                ? 'border-green-400/20 bg-green-400/5'
                : 'border-[#1A2235] bg-[#0C1528]'
            }`}
          >
            {item.has ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-[#8B95A5] flex-shrink-0" />
            )}
            <span className={`text-sm flex-1 ${item.has ? 'text-white' : 'text-[#8B95A5]'}`}>
              {item.label}
            </span>
            {!item.has && (
              <button
                onClick={() => onAddDocument(item.key)}
                className="text-xs text-[#00C650] hover:text-[#00C650]/80 transition-colors flex-shrink-0"
              >
                Upload
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
