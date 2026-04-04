export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Configure your dispatch preferences</p>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Company Name</label>
              <input
                type="text"
                defaultValue="My Freight Brokerage"
                className="w-full rounded-lg border border-[#1A2235] bg-[#040810] px-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:border-[#00C650] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Default Check Call Interval (hours)</label>
              <input
                type="number"
                defaultValue={4}
                min={1}
                max={24}
                className="w-48 rounded-lg border border-[#1A2235] bg-[#040810] px-3 py-2 text-sm text-white focus:border-[#00C650] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#1A2235] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Load Numbering</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1.5">Prefix</label>
              <input
                type="text"
                defaultValue="WLD"
                className="w-48 rounded-lg border border-[#1A2235] bg-[#040810] px-3 py-2 text-sm text-white focus:border-[#00C650] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#1A2235] pt-6">
          <h2 className="text-sm font-semibold text-white mb-2">About</h2>
          <p className="text-xs text-[#8B95A5]">Load Dispatch v0.1.0 — Warp Tools</p>
          <p className="text-xs text-[#8B95A5] mt-1">Free, open-source freight management.</p>
        </div>
      </div>
    </div>
  );
}
