'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddContactButtonProps {
  carrierId: string;
}

export function AddContactButton({ carrierId }: AddContactButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get('name') as string,
      role: data.get('role') as string,
      phone: (data.get('phone') as string) || null,
      email: (data.get('email') as string) || null,
      isPrimary: data.get('isPrimary') === 'true',
    };

    try {
      const res = await fetch(`/api/carriers/${carrierId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error?.formErrors?.[0] ?? 'Failed to add contact');
      }
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00C650] hover:bg-[#00B347] text-black font-semibold text-sm transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Contact
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Add Contact</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Name <span className="text-[#FF4444]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Role</label>
                <select
                  name="role"
                  defaultValue="other"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                >
                  <option value="dispatch">Dispatch</option>
                  <option value="billing">Billing</option>
                  <option value="operations">Operations</option>
                  <option value="owner">Owner</option>
                  <option value="sales">Sales</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="e.g. 555-123-4567"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="e.g. john@carrier.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Primary Contact?</label>
                <select
                  name="isPrimary"
                  defaultValue="false"
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              {error && <p className="text-sm text-[#FF4444]">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00C650] hover:bg-[#00B347] text-black font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
