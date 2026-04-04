'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WizardStepper } from '@/components/WizardStepper';
import { FinancialSummary } from '@/components/FinancialSummary';
import { formatCurrency, getEquipmentLabel } from '@/lib/utils';

const STEPS = ['Customer', 'Route', 'Rate', 'Carrier', 'Details', 'Review'];

const EQUIPMENT_OPTIONS = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'power_only', label: 'Power Only' },
];

interface FormData {
  // Step 1
  customerName: string;
  // Step 2
  originCity: string;
  originState: string;
  originZip: string;
  destCity: string;
  destState: string;
  destZip: string;
  equipmentType: string;
  pickupDate: string;
  deliveryDate: string;
  // Step 3
  customerRate: string;
  rateType: string;
  miles: string;
  // Step 4
  carrierName: string;
  carrierContact: string;
  carrierPhone: string;
  carrierRate: string;
  // Step 5
  commodity: string;
  weight: string;
  specialInstructions: string;
  notes: string;
}

function InputField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50';

export function ShipmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    customerName: '',
    originCity: '',
    originState: '',
    originZip: '',
    destCity: '',
    destState: '',
    destZip: '',
    equipmentType: 'dry_van',
    pickupDate: '',
    deliveryDate: '',
    customerRate: '',
    rateType: 'flat',
    miles: '',
    carrierName: '',
    carrierContact: '',
    carrierPhone: '',
    carrierRate: '',
    commodity: '',
    weight: '',
    specialInstructions: '',
    notes: '',
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canAdvance(): boolean {
    if (step === 1) return form.customerName.trim().length > 0;
    if (step === 2)
      return (
        form.originCity.trim().length > 0 &&
        form.originState.trim().length > 0 &&
        form.destCity.trim().length > 0 &&
        form.destState.trim().length > 0
      );
    return true;
  }

  function handleNext() {
    if (!canAdvance()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit(status: 'quote' | 'booked') {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          customerName: form.customerName,
          originCity: form.originCity,
          originState: form.originState,
          originZip: form.originZip,
          destCity: form.destCity,
          destState: form.destState,
          destZip: form.destZip,
          equipmentType: form.equipmentType,
          pickupDate: form.pickupDate,
          deliveryDate: form.deliveryDate,
          customerRate: form.customerRate ? parseFloat(form.customerRate) : null,
          rateType: form.rateType,
          miles: form.miles ? parseInt(form.miles) : null,
          carrierName: form.carrierName || null,
          carrierContact: form.carrierContact || null,
          carrierPhone: form.carrierPhone || null,
          carrierRate: form.carrierRate ? parseFloat(form.carrierRate) : null,
          commodity: form.commodity || null,
          weight: form.weight ? parseInt(form.weight) : null,
          specialInstructions: form.specialInstructions || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to create shipment');
      }

      const result = (await res.json()) as { id: string; shipmentNumber: string };
      router.push(`/shipments/${result.id}?created=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  const customerRate = parseFloat(form.customerRate) || null;
  const carrierRate = parseFloat(form.carrierRate) || null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex justify-center">
        <WizardStepper steps={STEPS} currentStep={step} />
      </div>

      {/* Step content */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6">
        {/* Step 1: Customer */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Customer</h2>
            <InputField label="Customer Name" required>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Acme Logistics Inc"
                value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
                autoFocus
              />
            </InputField>
          </div>
        )}

        {/* Step 2: Route */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Route</h2>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Origin City" required>
                <input type="text" className={inputClass} placeholder="Chicago" value={form.originCity} onChange={(e) => update('originCity', e.target.value)} />
              </InputField>
              <InputField label="State" required>
                <input type="text" className={inputClass} placeholder="IL" maxLength={2} value={form.originState} onChange={(e) => update('originState', e.target.value.toUpperCase())} />
              </InputField>
              <InputField label="ZIP">
                <input type="text" className={inputClass} placeholder="60601" value={form.originZip} onChange={(e) => update('originZip', e.target.value)} />
              </InputField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Dest City" required>
                <input type="text" className={inputClass} placeholder="Dallas" value={form.destCity} onChange={(e) => update('destCity', e.target.value)} />
              </InputField>
              <InputField label="State" required>
                <input type="text" className={inputClass} placeholder="TX" maxLength={2} value={form.destState} onChange={(e) => update('destState', e.target.value.toUpperCase())} />
              </InputField>
              <InputField label="ZIP">
                <input type="text" className={inputClass} placeholder="75201" value={form.destZip} onChange={(e) => update('destZip', e.target.value)} />
              </InputField>
            </div>
            <InputField label="Equipment Type">
              <select className={inputClass} value={form.equipmentType} onChange={(e) => update('equipmentType', e.target.value)}>
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Pickup Date">
                <input type="date" className={inputClass} value={form.pickupDate} onChange={(e) => update('pickupDate', e.target.value)} />
              </InputField>
              <InputField label="Delivery Date">
                <input type="date" className={inputClass} value={form.deliveryDate} onChange={(e) => update('deliveryDate', e.target.value)} />
              </InputField>
            </div>
          </div>
        )}

        {/* Step 3: Rate */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Customer Rate</h2>
            <InputField label="Customer Rate ($)">
              <input type="number" className={inputClass} placeholder="0.00" step="0.01" min="0" value={form.customerRate} onChange={(e) => update('customerRate', e.target.value)} />
            </InputField>
            <InputField label="Rate Type">
              <select className={inputClass} value={form.rateType} onChange={(e) => update('rateType', e.target.value)}>
                <option value="flat">Flat Rate</option>
                <option value="per_mile">Per Mile</option>
              </select>
            </InputField>
            <InputField label="Miles">
              <input type="number" className={inputClass} placeholder="0" min="0" value={form.miles} onChange={(e) => update('miles', e.target.value)} />
            </InputField>
          </div>
        )}

        {/* Step 4: Carrier */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Carrier <span className="text-sm font-normal text-[#8B95A5]">(optional)</span></h2>
            <InputField label="Carrier Name">
              <input type="text" className={inputClass} placeholder="Apex Freight Solutions" value={form.carrierName} onChange={(e) => update('carrierName', e.target.value)} />
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Contact Name">
                <input type="text" className={inputClass} placeholder="Mike Rodriguez" value={form.carrierContact} onChange={(e) => update('carrierContact', e.target.value)} />
              </InputField>
              <InputField label="Phone">
                <input type="tel" className={inputClass} placeholder="214-555-0101" value={form.carrierPhone} onChange={(e) => update('carrierPhone', e.target.value)} />
              </InputField>
            </div>
            <InputField label="Carrier Rate ($)">
              <input type="number" className={inputClass} placeholder="0.00" step="0.01" min="0" value={form.carrierRate} onChange={(e) => update('carrierRate', e.target.value)} />
            </InputField>
            {(customerRate != null || carrierRate != null) && (
              <FinancialSummary
                customerRate={customerRate}
                carrierRate={carrierRate}
                rateType={form.rateType as 'flat' | 'per_mile'}
                miles={parseInt(form.miles) || null}
              />
            )}
          </div>
        )}

        {/* Step 5: Details */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Commodity">
                <input type="text" className={inputClass} placeholder="General Merchandise" value={form.commodity} onChange={(e) => update('commodity', e.target.value)} />
              </InputField>
              <InputField label="Weight (lbs)">
                <input type="number" className={inputClass} placeholder="0" min="0" value={form.weight} onChange={(e) => update('weight', e.target.value)} />
              </InputField>
            </div>
            <InputField label="Special Instructions">
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Any special handling requirements…" value={form.specialInstructions} onChange={(e) => update('specialInstructions', e.target.value)} />
            </InputField>
            <InputField label="Notes">
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Internal notes…" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </InputField>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Review</h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Customer</div>
                  <div className="text-white font-medium">{form.customerName}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Equipment</div>
                  <div className="text-white">{getEquipmentLabel(form.equipmentType as Parameters<typeof getEquipmentLabel>[0])}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Origin</div>
                  <div className="text-white">{form.originCity}, {form.originState} {form.originZip}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Destination</div>
                  <div className="text-white">{form.destCity}, {form.destState} {form.destZip}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Pickup</div>
                  <div className="text-white">{form.pickupDate || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Delivery</div>
                  <div className="text-white">{form.deliveryDate || '—'}</div>
                </div>
                {form.carrierName && (
                  <div>
                    <div className="text-xs text-[#8B95A5] mb-1">Carrier</div>
                    <div className="text-white">{form.carrierName}</div>
                  </div>
                )}
                {form.commodity && (
                  <div>
                    <div className="text-xs text-[#8B95A5] mb-1">Commodity</div>
                    <div className="text-white">{form.commodity} {form.weight ? `· ${parseInt(form.weight).toLocaleString()} lbs` : ''}</div>
                  </div>
                )}
              </div>

              {(customerRate != null || carrierRate != null) && (
                <FinancialSummary
                  customerRate={customerRate}
                  carrierRate={carrierRate}
                  rateType={form.rateType as 'flat' | 'per_mile'}
                  miles={parseInt(form.miles) || null}
                />
              )}

              {form.specialInstructions && (
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Special Instructions</div>
                  <div className="text-white text-sm">{form.specialInstructions}</div>
                </div>
              )}
              {form.notes && (
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Notes</div>
                  <div className="text-white text-sm">{form.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0C1528] border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <div className="text-xs text-[#8B95A5]">
          Step {step} of {STEPS.length}
        </div>

        {step < STEPS.length ? (
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit('quote')}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0C1528] border border-[#1A2235] text-white hover:border-[#2A3245] transition-colors disabled:opacity-40"
            >
              Create as Quote
            </button>
            <button
              onClick={() => handleSubmit('booked')}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Creating…' : 'Create & Book'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
