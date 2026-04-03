'use client';

import { useState } from 'react';
import { Pencil, X, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ContactCard } from '@/components/ContactCard';
import type { CarrierContact } from '@/db/schema';

interface EditableContactCardProps {
  contact: CarrierContact;
  carrierId: string;
}

export function EditableContactCard({ contact, carrierId }: EditableContactCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const res = await fetch(`/api/carriers/${carrierId}/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/carriers/${carrierId}/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      setDeleteConfirm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group relative">
        <ContactCard contact={contact} />
        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditOpen(true)}
            className="p-1.5 rounded-md bg-[#080F1E]/80 border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3347] transition-all"
            title="Edit contact"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-1.5 rounded-md bg-[#080F1E]/80 border border-[#1A2235] text-[#8B95A5] hover:text-[#FF4444] hover:border-[#FF4444]/30 transition-all"
            title="Delete contact"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
              <h2 className="text-base font-semibold text-white">Edit Contact</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Name <span className="text-[#FF4444]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={contact.name}
                  className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Role</label>
                <select
                  name="role"
                  defaultValue={contact.role ?? 'other'}
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
                    defaultValue={contact.phone ?? ''}
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={contact.email ?? ''}
                    className="w-full px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Primary Contact?</label>
                <select
                  name="isPrimary"
                  defaultValue={contact.isPrimary ? 'true' : 'false'}
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
                  onClick={() => setEditOpen(false)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-2">Delete Contact</h2>
            <p className="text-sm text-[#8B95A5] mb-5">
              Are you sure you want to delete <span className="text-white font-medium">{contact.name}</span>? This cannot be undone.
            </p>
            {error && <p className="text-sm text-[#FF4444] mb-3">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#8B95A5] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF4444] hover:bg-[#E03C3C] text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
