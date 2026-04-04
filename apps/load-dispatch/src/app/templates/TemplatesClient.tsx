'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LoadTemplate, EquipmentType } from '@/db/schema';
import { EQUIPMENT_TYPES } from '@/db/schema';
import { TemplateCard } from '@/components/TemplateCard';
import { getEquipmentLabel } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface TemplatesClientProps {
  initialTemplates: LoadTemplate[];
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

const inputClass = 'w-full px-3 py-2 bg-[#040810] border border-[#1A2235] rounded-lg text-sm text-white placeholder:text-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/40 transition-colors';
const selectClass = 'w-full px-3 py-2 bg-[#040810] border border-[#1A2235] rounded-lg text-sm text-white focus:outline-none focus:border-[#00C650]/40 transition-colors';
const textareaClass = 'w-full px-3 py-2 bg-[#040810] border border-[#1A2235] rounded-lg text-sm text-white placeholder:text-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/40 transition-colors resize-none';

interface TemplateFormData {
  name: string;
  customer_name: string;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: EquipmentType;
  weight: string;
  commodity: string;
  customer_rate: string;
  special_instructions: string;
}

const emptyForm: TemplateFormData = {
  name: '',
  customer_name: '',
  origin_city: '',
  origin_state: '',
  dest_city: '',
  dest_state: '',
  equipment_type: 'dry_van',
  weight: '',
  commodity: '',
  customer_rate: '',
  special_instructions: '',
};

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[#8B95A5] font-medium">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<LoadTemplate[]>(() => initialTemplates);
  const [search, setSearch] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LoadTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(() => emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<LoadTemplate | null>(null);
  const [usingTemplate, setUsingTemplate] = useState<number | null>(null);

  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.origin_city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.dest_city ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.customer_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchEquip = !filterEquipment || t.equipment_type === filterEquipment;
    return matchSearch && matchEquip;
  });

  const openNew = useCallback(() => {
    setEditingTemplate(null);
    setFormData(emptyForm);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((template: LoadTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      customer_name: template.customer_name ?? '',
      origin_city: template.origin_city ?? '',
      origin_state: template.origin_state ?? '',
      dest_city: template.dest_city ?? '',
      dest_state: template.dest_state ?? '',
      equipment_type: (template.equipment_type as EquipmentType) ?? 'dry_van',
      weight: template.weight != null ? String(template.weight) : '',
      commodity: template.commodity ?? '',
      customer_rate: template.customer_rate != null ? String(template.customer_rate) : '',
      special_instructions: template.special_instructions ?? '',
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData(emptyForm);
  }, []);

  const handleFormChange = useCallback((field: keyof TemplateFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmitForm = useCallback(async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true);

    const body = {
      name: formData.name,
      customer_name: formData.customer_name || null,
      origin_city: formData.origin_city || null,
      origin_state: formData.origin_state || null,
      dest_city: formData.dest_city || null,
      dest_state: formData.dest_state || null,
      equipment_type: formData.equipment_type || null,
      weight: formData.weight ? parseInt(formData.weight, 10) : null,
      commodity: formData.commodity || null,
      customer_rate: formData.customer_rate ? parseFloat(formData.customer_rate) : null,
      special_instructions: formData.special_instructions || null,
    };

    try {
      if (editingTemplate) {
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? data.template : t)));
      } else {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setTemplates((prev) => [data.template, ...prev]);
      }
      closeModal();
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingTemplate, closeModal]);

  const handleDelete = useCallback(async (template: LoadTemplate) => {
    await fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    setDeleteConfirm(null);
  }, []);

  const handleUse = useCallback(async (template: LoadTemplate) => {
    setUsingTemplate(template.id);
    try {
      const res = await fetch(`/api/templates/${template.id}/use`, { method: 'POST' });
      const data = await res.json();
      // Increment local use count
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, use_count: t.use_count + 1 } : t))
      );
      router.push(`/loads/${data.load.id}/edit`);
    } finally {
      setUsingTemplate(null);
    }
  }, [router]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Templates</h1>
          <p className="text-sm text-[#8B95A5] mt-1">Reusable templates for common lanes</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#00C650] text-black px-4 py-2 text-sm font-semibold hover:bg-[#00C650]/90 transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/40"
          />
        </div>
        <select
          value={filterEquipment}
          onChange={(e) => setFilterEquipment(e.target.value)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        >
          <option value="">All Equipment</option>
          {EQUIPMENT_TYPES.map((eq) => (
            <option key={eq} value={eq}>{getEquipmentLabel(eq)}</option>
          ))}
        </select>
        {(search || filterEquipment) && (
          <button
            onClick={() => { setSearch(''); setFilterEquipment(''); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1A2235] p-12 text-center">
          <p className="text-[#8B95A5] text-sm">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div key={template.id} className={usingTemplate === template.id ? 'opacity-50 pointer-events-none' : ''}>
              <TemplateCard
                template={template}
                onUse={handleUse}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] border border-[#1A2235] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
              <h2 className="text-lg font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={closeModal} className="text-[#8B95A5] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Template Name" required>
                <input
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. DAL → LA Dry Van"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer Name">
                  <input
                    value={formData.customer_name}
                    onChange={(e) => handleFormChange('customer_name', e.target.value)}
                    className={inputClass}
                    placeholder="Acme Corp"
                  />
                </Field>
                <Field label="Equipment Type">
                  <select
                    value={formData.equipment_type}
                    onChange={(e) => handleFormChange('equipment_type', e.target.value)}
                    className={selectClass}
                  >
                    {EQUIPMENT_TYPES.map((eq) => (
                      <option key={eq} value={eq}>{getEquipmentLabel(eq)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Origin City">
                  <input
                    value={formData.origin_city}
                    onChange={(e) => handleFormChange('origin_city', e.target.value)}
                    className={inputClass}
                    placeholder="Dallas"
                  />
                </Field>
                <Field label="Origin State">
                  <select
                    value={formData.origin_state}
                    onChange={(e) => handleFormChange('origin_state', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">—</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Dest City">
                  <input
                    value={formData.dest_city}
                    onChange={(e) => handleFormChange('dest_city', e.target.value)}
                    className={inputClass}
                    placeholder="Los Angeles"
                  />
                </Field>
                <Field label="Dest State">
                  <select
                    value={formData.dest_state}
                    onChange={(e) => handleFormChange('dest_state', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">—</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Weight (lbs)">
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleFormChange('weight', e.target.value)}
                    className={inputClass}
                    placeholder="42000"
                  />
                </Field>
                <Field label="Commodity">
                  <input
                    value={formData.commodity}
                    onChange={(e) => handleFormChange('commodity', e.target.value)}
                    className={inputClass}
                    placeholder="General Merchandise"
                  />
                </Field>
                <Field label="Customer Rate ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.customer_rate}
                    onChange={(e) => handleFormChange('customer_rate', e.target.value)}
                    className={inputClass}
                    placeholder="4200"
                  />
                </Field>
              </div>

              <Field label="Special Instructions">
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => handleFormChange('special_instructions', e.target.value)}
                  rows={3}
                  className={textareaClass}
                  placeholder="Temperature requirements, handling notes..."
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#1A2235]">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-[#1A2235] text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={submitting || !formData.name.trim()}
                className="px-6 py-2 rounded-lg bg-[#00C650] text-black text-sm font-semibold hover:bg-[#00C650]/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] border border-[#1A2235] rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Template?</h2>
            <p className="text-sm text-[#8B95A5] mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-[#1A2235] text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
