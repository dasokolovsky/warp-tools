'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineItemEditor, LineItemRow } from '@/components/LineItemEditor';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  paymentTerms: string;
}

interface InvoiceFormProps {
  mode: 'create' | 'edit';
  invoiceId?: string;
  initialData?: {
    invoiceNumber?: string;
    customerId?: string;
    loadRef?: string;
    invoiceDate?: string;
    dueDate?: string;
    taxAmount?: number;
    notes?: string;
    status?: string;
    lineItems?: LineItemRow[];
  };
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

const TERMS_DAYS: Record<string, number> = {
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
  quick_pay: 1,
  factored: 30,
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function InvoiceForm({ mode, invoiceId, initialData }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    invoiceNumber: initialData?.invoiceNumber ?? '',
    customerId: initialData?.customerId ?? '',
    loadRef: initialData?.loadRef ?? '',
    invoiceDate: initialData?.invoiceDate ?? today,
    paymentTerms: 'net_30',
    dueDate: initialData?.dueDate ?? addDays(today, 30),
    taxAmount: initialData?.taxAmount ? String(initialData.taxAmount) : '0',
    notes: initialData?.notes ?? '',
  });

  const [lineItems, setLineItems] = useState<LineItemRow[]>(initialData?.lineItems ?? []);
  const [dueDateManual, setDueDateManual] = useState(!!initialData?.dueDate);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/customers')
      .then((r) => r.json())
      .then((data: Customer[]) => {
        if (cancelled) return;
        setCustomers(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingCustomers(false);
      });
    return () => { cancelled = true; };
  }, []);

  // When customers load, apply pre-selected customer's payment terms (edit mode)
  useEffect(() => {
    if (initialData?.customerId && customers.length > 0) {
      const c = customers.find((x) => x.id === initialData.customerId);
      if (c) setForm((f) => ({ ...f, paymentTerms: c.paymentTerms }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers.length]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCustomerChange(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    const terms = customer?.paymentTerms ?? 'net_30';
    const days = TERMS_DAYS[terms] ?? 30;
    const newDue = addDays(form.invoiceDate, days);
    setForm((f) => ({
      ...f,
      customerId,
      paymentTerms: terms,
      dueDate: dueDateManual ? f.dueDate : newDue,
    }));
  }

  function handleTermsChange(terms: string) {
    const days = TERMS_DAYS[terms] ?? 30;
    const newDue = addDays(form.invoiceDate, days);
    set('paymentTerms', terms);
    if (!dueDateManual) {
      set('dueDate', newDue);
    }
  }

  function handleInvoiceDateChange(date: string) {
    const days = TERMS_DAYS[form.paymentTerms] ?? 30;
    set('invoiceDate', date);
    if (!dueDateManual) {
      set('dueDate', addDays(date, days));
    }
  }

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = parseFloat(form.taxAmount) || 0;
  const total = subtotal + taxAmount;

  async function handleSubmit(status: 'draft' | 'sent') {
    setLoading(true);
    setError(null);

    if (!form.customerId) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    if (lineItems.length === 0) {
      setError('Please add at least one line item');
      setLoading(false);
      return;
    }

    const payload = {
      invoiceNumber: form.invoiceNumber.trim() || undefined,
      customerId: form.customerId,
      loadRef: form.loadRef || null,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      taxAmount: parseFloat(form.taxAmount) || 0,
      notes: form.notes || null,
      status,
      lineItems: lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        lineType: li.lineType,
      })),
    };

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Edit: PATCH invoice + update line items separately
        res = await fetch(`/api/invoices/${invoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber: payload.invoiceNumber,
            customerId: payload.customerId,
            loadRef: payload.loadRef,
            invoiceDate: payload.invoiceDate,
            dueDate: payload.dueDate,
            taxAmount: payload.taxAmount,
            notes: payload.notes,
            status,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(', ')
          : data.error?.formErrors?.[0] ?? 'Failed to save invoice';
        setError(msg);
        toast({ message: msg, type: 'error' });
        return;
      }

      const invoice = await res.json();
      toast({ message: mode === 'create' ? 'Invoice created' : 'Invoice updated', type: 'success' });
      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch {
      const msg = 'An unexpected error occurred';
      setError(msg);
      toast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Invoice Details */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Invoice Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Customer" required>
            <select
              value={form.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
              className={inputClass}
              disabled={loadingCustomers}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Invoice Number">
            <input
              type="text"
              value={form.invoiceNumber}
              onChange={(e) => set('invoiceNumber', e.target.value)}
              placeholder="Auto-generated if blank"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Load Reference">
          <input
            type="text"
            value={form.loadRef}
            onChange={(e) => set('loadRef', e.target.value)}
            placeholder="LD-10001 (optional)"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Invoice Date" required>
            <input
              type="date"
              required
              value={form.invoiceDate}
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Payment Terms">
            <select
              value={form.paymentTerms}
              onChange={(e) => handleTermsChange(e.target.value)}
              className={inputClass}
            >
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
              <option value="quick_pay">Quick Pay</option>
              <option value="factored">Factored</option>
            </select>
          </Field>

          <Field label="Due Date" required>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => { set('dueDate', e.target.value); setDueDateManual(true); }}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Tax Amount ($)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A5] text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.taxAmount}
              onChange={(e) => set('taxAmount', e.target.value)}
              className={cn(inputClass, 'pl-7')}
            />
          </div>
        </Field>
      </div>

      {/* Line Items */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Line Items</h2>
        <LineItemEditor lineItems={lineItems} onChange={setLineItems} />

        {/* Running totals */}
        {lineItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1A2235] space-y-1.5 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-[#8B95A5]">Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#8B95A5]">Tax</span>
                <span className="text-white">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-[#1A2235] pt-2">
              <span className="text-white">Total</span>
              <span className="text-[#00C650]">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Notes</h2>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="Internal notes, delivery details, special instructions..."
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] disabled:opacity-50 text-[#8B95A5] hover:text-white font-semibold rounded-xl text-sm border border-[#1A2235] transition-colors"
        >
          {loading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('sent')}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          {loading ? 'Saving...' : 'Save & Send'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
