import { NewCarrierForm } from './NewCarrierForm';

export default function NewCarrierPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add Carrier</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5">Enter carrier details to add to your network</p>
      </div>
      <NewCarrierForm />
    </div>
  );
}
