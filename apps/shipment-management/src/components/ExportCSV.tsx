'use client';

import type { Shipment } from '@/db/schema';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExportCSVProps {
  shipments: Shipment[];
  filename?: string;
}

export function ExportCSV({ shipments, filename = 'shipments.csv' }: ExportCSVProps) {
  function handleExport() {
    const headers = [
      'Shipment #',
      'Status',
      'Customer',
      'Origin',
      'Destination',
      'Equipment',
      'Carrier',
      'Pickup Date',
      'Delivery Date',
      'Revenue',
      'Cost',
      'Margin',
      'Margin %',
      'Health Score',
      'BOL',
      'POD',
      'Rate Con',
      'Invoice',
    ];

    const rows = shipments.map((s) => [
      s.shipmentNumber,
      s.status,
      s.customerName,
      `${s.originCity}, ${s.originState}`,
      `${s.destCity}, ${s.destState}`,
      s.equipmentType,
      s.carrierName ?? '',
      s.pickupDate ?? '',
      s.deliveryDate ?? '',
      s.customerRate != null ? s.customerRate.toFixed(2) : '',
      s.carrierRate != null ? s.carrierRate.toFixed(2) : '',
      s.margin != null ? s.margin.toFixed(2) : '',
      s.marginPct != null ? s.marginPct.toFixed(1) + '%' : '',
      s.healthScore != null ? String(s.healthScore) : '',
      s.hasBol ? 'Yes' : 'No',
      s.hasPod ? 'Yes' : 'No',
      s.hasRateCon ? 'Yes' : 'No',
      s.hasInvoice ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="px-3 py-2 text-sm font-medium rounded-lg bg-[#0C1528] border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
    >
      Export CSV
    </button>
  );
}
