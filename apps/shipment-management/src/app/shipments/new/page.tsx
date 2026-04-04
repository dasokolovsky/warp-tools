import Link from 'next/link';
import { ShipmentWizard } from './ShipmentWizard';
import { ArrowLeft } from 'lucide-react';

export default function NewShipmentPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/shipments"
          className="text-[#8B95A5] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Shipment</h1>
          <p className="text-[#8B95A5] text-sm mt-1">Create a new shipment through the wizard</p>
        </div>
      </div>

      <ShipmentWizard />
    </div>
  );
}
