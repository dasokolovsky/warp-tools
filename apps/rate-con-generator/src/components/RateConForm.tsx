'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RateConData, StopInfo, Accessorial } from '@/app/types';
import { EQUIPMENT_TYPES, PAYMENT_TERMS_OPTIONS } from '@/app/types';

interface Props {
  data: RateConData;
  onChange: (data: RateConData) => void;
}

const inputClass =
  'w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] transition-colors';

const labelClass = 'block text-xs font-medium text-[#8B95A5] mb-1 uppercase tracking-wide';

const sectionClass = 'bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 space-y-3';

const sectionTitleClass = 'text-sm font-semibold text-[#00C650] uppercase tracking-wider mb-3';

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function FullField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="col-span-2">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StopFields({
  prefix,
  stop,
  onChange,
}: {
  prefix: string;
  stop: StopInfo;
  onChange: (s: StopInfo) => void;
}) {
  function update(field: keyof StopInfo, value: string) {
    onChange({ ...stop, [field]: value });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Company Name</label>
        <input
          className={inputClass}
          placeholder="ABC Manufacturing Co."
          value={stop.company}
          onChange={(e) => update('company', e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Street Address</label>
        <input
          className={inputClass}
          placeholder="123 Industrial Blvd"
          value={stop.address}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>
      <FieldRow>
        <Field label="City">
          <input
            className={inputClass}
            placeholder="Chicago"
            value={stop.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </Field>
        <Field label="State">
          <input
            className={inputClass}
            placeholder="IL"
            maxLength={2}
            value={stop.state}
            onChange={(e) => update('state', e.target.value.toUpperCase())}
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="ZIP">
          <input
            className={inputClass}
            placeholder="60601"
            value={stop.zip}
            onChange={(e) => update('zip', e.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputClass}
            value={stop.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </Field>
      </FieldRow>
      <div>
        <label className={labelClass}>Time Window</label>
        <input
          className={inputClass}
          placeholder="08:00 – 12:00"
          value={stop.timeWindow}
          onChange={(e) => update('timeWindow', e.target.value)}
        />
      </div>
      <FieldRow>
        <Field label="Contact Name">
          <input
            className={inputClass}
            placeholder={`${prefix} Contact`}
            value={stop.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
        </Field>
        <Field label="Contact Phone">
          <input
            className={inputClass}
            placeholder="(555) 000-0000"
            value={stop.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
          />
        </Field>
      </FieldRow>
    </div>
  );
}

export function RateConForm({ data, onChange }: Props) {
  function setField<K extends keyof RateConData>(key: K, value: RateConData[K]) {
    onChange({ ...data, [key]: value });
  }

  function setCompany(field: keyof RateConData['company'], value: string) {
    onChange({ ...data, company: { ...data.company, [field]: value } });
  }

  function addAccessorial() {
    const newItem: Accessorial = {
      id: Date.now().toString(),
      description: '',
      amount: '',
    };
    setField('accessorials', [...data.accessorials, newItem]);
  }

  function updateAccessorial(id: string, field: keyof Accessorial, value: string) {
    setField(
      'accessorials',
      data.accessorials.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  }

  function removeAccessorial(id: string) {
    setField(
      'accessorials',
      data.accessorials.filter((a) => a.id !== id)
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Info */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Broker / Company Info</p>
        <p className="text-xs text-[#8B95A5] mb-3">Saved automatically to your browser</p>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              className={inputClass}
              placeholder="Your Freight Brokerage LLC"
              value={data.company.name}
              onChange={(e) => setCompany('name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              className={inputClass}
              placeholder="100 Main St, Chicago, IL 60601"
              value={data.company.address}
              onChange={(e) => setCompany('address', e.target.value)}
            />
          </div>
          <FieldRow>
            <Field label="Phone">
              <input
                className={inputClass}
                placeholder="(555) 000-0000"
                value={data.company.phone}
                onChange={(e) => setCompany('phone', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                placeholder="ops@yourbrokerage.com"
                value={data.company.email}
                onChange={(e) => setCompany('email', e.target.value)}
              />
            </Field>
          </FieldRow>
          <div>
            <label className={labelClass}>MC#</label>
            <input
              className={inputClass}
              placeholder="MC-000000"
              value={data.company.mc}
              onChange={(e) => setCompany('mc', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Load Details */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Load Details</p>
        <FieldRow>
          <Field label="Load / Reference #">
            <input
              className={inputClass}
              placeholder="WT-2024-001"
              value={data.loadNumber}
              onChange={(e) => setField('loadNumber', e.target.value)}
            />
          </Field>
          <Field label="Confirmation Date">
            <input
              type="date"
              className={inputClass}
              value={data.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </Field>
        </FieldRow>
      </div>

      {/* Pickup */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>📦 Pickup</p>
        <StopFields
          prefix="Pickup"
          stop={data.pickup}
          onChange={(s) => setField('pickup', s)}
        />
      </div>

      {/* Delivery */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>🏁 Delivery</p>
        <StopFields
          prefix="Delivery"
          stop={data.delivery}
          onChange={(s) => setField('delivery', s)}
        />
      </div>

      {/* Cargo */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Cargo</p>
        <div>
          <label className={labelClass}>Equipment Type</label>
          <select
            className={inputClass}
            value={data.equipment}
            onChange={(e) => setField('equipment', e.target.value)}
          >
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <FieldRow>
          <Field label="Weight (lbs)">
            <input
              className={inputClass}
              placeholder="42,000"
              value={data.weight}
              onChange={(e) => setField('weight', e.target.value)}
            />
          </Field>
          <Field label="Commodity">
            <input
              className={inputClass}
              placeholder="General freight"
              value={data.commodity}
              onChange={(e) => setField('commodity', e.target.value)}
            />
          </Field>
        </FieldRow>
        <div>
          <label className={labelClass}>Special Instructions</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="No tail swing, team required, temp 34°F, etc."
            value={data.specialInstructions}
            onChange={(e) => setField('specialInstructions', e.target.value)}
          />
        </div>
      </div>

      {/* Carrier Info */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Carrier Info</p>
        <div>
          <label className={labelClass}>Carrier Name</label>
          <input
            className={inputClass}
            placeholder="Fast Freight Carriers LLC"
            value={data.carrierName}
            onChange={(e) => setField('carrierName', e.target.value)}
          />
        </div>
        <FieldRow>
          <Field label="MC#">
            <input
              className={inputClass}
              placeholder="MC-000000"
              value={data.carrierMC}
              onChange={(e) => setField('carrierMC', e.target.value)}
            />
          </Field>
          <Field label="DOT#">
            <input
              className={inputClass}
              placeholder="DOT-000000"
              value={data.carrierDOT}
              onChange={(e) => setField('carrierDOT', e.target.value)}
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Driver Name">
            <input
              className={inputClass}
              placeholder="John Smith"
              value={data.driverName}
              onChange={(e) => setField('driverName', e.target.value)}
            />
          </Field>
          <Field label="Driver Phone">
            <input
              className={inputClass}
              placeholder="(555) 000-0000"
              value={data.driverPhone}
              onChange={(e) => setField('driverPhone', e.target.value)}
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Truck #">
            <input
              className={inputClass}
              placeholder="T-1234"
              value={data.truckNumber}
              onChange={(e) => setField('truckNumber', e.target.value)}
            />
          </Field>
          <Field label="Trailer #">
            <input
              className={inputClass}
              placeholder="TR-5678"
              value={data.trailerNumber}
              onChange={(e) => setField('trailerNumber', e.target.value)}
            />
          </Field>
        </FieldRow>
      </div>

      {/* Rate */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Rate</p>
        <FieldRow>
          <Field label="Rate Amount ($)">
            <input
              className={inputClass}
              placeholder="2500.00"
              value={data.rateAmount}
              onChange={(e) => setField('rateAmount', e.target.value)}
            />
          </Field>
          <Field label="Rate Type">
            <select
              className={inputClass}
              value={data.rateType}
              onChange={(e) => setField('rateType', e.target.value as 'flat' | 'per_mile')}
            >
              <option value="flat">Flat Rate</option>
              <option value="per_mile">Per Mile</option>
            </select>
          </Field>
        </FieldRow>
        {data.rateType === 'per_mile' && (
          <div>
            <label className={labelClass}>Miles</label>
            <input
              className={inputClass}
              placeholder="1250"
              value={data.miles}
              onChange={(e) => setField('miles', e.target.value)}
            />
          </div>
        )}
        <FieldRow>
          <Field label="Payment Terms">
            <select
              className={inputClass}
              value={data.paymentTerms}
              onChange={(e) => setField('paymentTerms', e.target.value)}
            >
              {PAYMENT_TERMS_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fuel Surcharge ($)">
            <input
              className={inputClass}
              placeholder="0.00"
              value={data.fuelSurcharge}
              onChange={(e) => setField('fuelSurcharge', e.target.value)}
            />
          </Field>
        </FieldRow>

        {/* Accessorials */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Accessorials</label>
            <button
              type="button"
              onClick={addAccessorial}
              className="flex items-center gap-1 text-xs text-[#00C650] hover:text-green-400 transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
          {data.accessorials.length === 0 && (
            <p className="text-xs text-[#8B95A5] italic">No accessorials added</p>
          )}
          {data.accessorials.map((acc) => (
            <div key={acc.id} className="flex gap-2 mb-2">
              <input
                className={`${inputClass} flex-1`}
                placeholder="Detention, Lumper, TONU, etc."
                value={acc.description}
                onChange={(e) => updateAccessorial(acc.id, 'description', e.target.value)}
              />
              <input
                className={`${inputClass} w-24`}
                placeholder="$0.00"
                value={acc.amount}
                onChange={(e) => updateAccessorial(acc.id, 'amount', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeAccessorial(acc.id)}
                className="text-[#8B95A5] hover:text-[#FF4444] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Terms &amp; Conditions</p>
        <textarea
          className={`${inputClass} resize-none font-mono text-xs`}
          rows={10}
          value={data.terms}
          onChange={(e) => setField('terms', e.target.value)}
        />
      </div>
    </div>
  );
}
