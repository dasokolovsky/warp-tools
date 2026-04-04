export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8B95A5] text-sm mt-1">Configure your shipment management system</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6">
        <h2 className="text-sm font-semibold text-white mb-4">System Settings</h2>
        <p className="text-sm text-[#8B95A5]">
          Settings configuration coming soon. This will include notification preferences, default equipment types, carrier integrations, and user management.
        </p>
      </div>
    </div>
  );
}
