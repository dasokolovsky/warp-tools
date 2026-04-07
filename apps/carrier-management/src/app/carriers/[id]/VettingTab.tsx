'use client';

import { useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import type { CarrierVetting, Carrier } from '@/db/schema';
import type { FmcsaLookupResult } from '@/lib/fmcsa-lookup';

// ─── Types ────────────────────────────────────────────────────────────────────

type VettingStatus = 'pending' | 'passed' | 'failed' | 'waived' | 'expired';
type CheckType = CarrierVetting['checkType'];

interface VettingTabProps {
  carrier: Carrier;
  initialChecks: CarrierVetting[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECK_DEFINITIONS: { type: CheckType; label: string; description: string; required: boolean }[] = [
  { type: 'authority', label: 'Authority Active', description: 'Operating authority (MC#) is active with FMCSA', required: true },
  { type: 'insurance_verified', label: 'Auto Liability Insurance', description: 'Auto liability insurance certificate on file, minimum $750k', required: true },
  { type: 'cargo_coverage', label: 'Cargo Insurance', description: 'Cargo coverage on file, minimum $100k', required: true },
  { type: 'general_liability', label: 'General Liability', description: 'General liability insurance verified', required: false },
  { type: 'workers_comp', label: "Workers' Comp", description: "Workers' compensation insurance on file", required: false },
  { type: 'safety_rating', label: 'Safety Rating Satisfactory', description: 'FMCSA safety rating is Satisfactory or Not Rated', required: true },
  { type: 'w9_received', label: 'W-9 Received', description: 'Completed W-9 form received and on file', required: true },
  { type: 'contract_signed', label: 'Carrier Agreement Signed', description: 'Carrier agreement / broker-carrier contract executed', required: true },
  { type: 'reference_checked', label: 'References Checked', description: 'At least 2 broker references verified', required: false },
  { type: 'drug_testing', label: 'Drug Testing Program', description: 'Carrier has documented DOT drug testing program', required: false },
];

const REQUIRED_CHECKS: CheckType[] = ['authority', 'insurance_verified', 'safety_rating', 'cargo_coverage', 'w9_received', 'contract_signed'];

// ─── Helper: status badge ─────────────────────────────────────────────────────

function VettingBadge({ status }: { status: VettingStatus }) {
  const config: Record<VettingStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    passed: { color: '#00C650', bg: '#00C650/10', icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Passed' },
    failed: { color: '#FF4444', bg: '#FF4444/10', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Failed' },
    waived: { color: '#8B5CF6', bg: '#8B5CF6/10', icon: <Shield className="h-3.5 w-3.5" />, label: 'Waived' },
    expired: { color: '#FFAA00', bg: '#FFAA00/10', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Expired' },
    pending: { color: '#8B95A5', bg: '#8B95A5/10', icon: <Clock className="h-3.5 w-3.5" />, label: 'Pending' },
  };
  const { color, icon, label } = config[status] ?? config.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {icon}
      {label}
    </span>
  );
}

function VettingStatusBadge({ status }: { status: Carrier['vettingStatus'] }) {
  const map: Record<string, { color: string; label: string }> = {
    not_started: { color: '#8B95A5', label: 'Not Started' },
    in_progress: { color: '#FFAA00', label: 'In Progress' },
    vetted: { color: '#3B82F6', label: 'Vetted' },
    approved: { color: '#00C650', label: 'Approved' },
    rejected: { color: '#FF4444', label: 'Rejected' },
  };
  const s = status ?? 'not_started';
  const { color, label } = map[s] ?? map.not_started;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VettingTab({ carrier, initialChecks }: VettingTabProps) {
  const [checks, setChecks] = useState<CarrierVetting[]>(() => initialChecks);
  const [carrierData, setCarrierData] = useState<Carrier>(() => carrier);
  const [loading, setLoading] = useState<string | null>(null);
  const [fmcsaResult, setFmcsaResult] = useState<FmcsaLookupResult | null>(null);
  const [fmcsaLoading, setFmcsaLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Map checkType → existing check record
  const checkMap = useMemo(() => {
    const map: Record<string, CarrierVetting> = {};
    for (const c of checks) {
      map[c.checkType] = c;
    }
    return map;
  }, [checks]);

  const passedCount = checks.filter((c) => c.status === 'passed' || c.status === 'waived').length;
  const totalCount = CHECK_DEFINITIONS.length;
  const score = Math.round((passedCount / totalCount) * 100);

  const requiredPassed = REQUIRED_CHECKS.every((ct) => {
    const c = checkMap[ct];
    return c && (c.status === 'passed' || c.status === 'waived');
  });

  const refreshVettingStatus = useCallback(async (currentVettingStatus: Carrier['vettingStatus']) => {
    const res = await fetch(`/api/carriers/${carrier.id}/vetting`);
    if (res.ok) {
      const updatedChecks = await res.json() as CarrierVetting[];
      setChecks(updatedChecks);

      const newPassed = updatedChecks.filter((c) => c.status === 'passed' || c.status === 'waived').length;
      const newScore = Math.round((newPassed / totalCount) * 100);
      const reqPassed = REQUIRED_CHECKS.every((ct) => {
        const c = updatedChecks.find((x) => x.checkType === ct);
        return c && (c.status === 'passed' || c.status === 'waived');
      });

      if (currentVettingStatus === 'approved' || currentVettingStatus === 'rejected') {
        return; // don't override approved/rejected
      }

      let newVettingStatus: Carrier['vettingStatus'] = 'not_started';
      if (newPassed === 0) newVettingStatus = 'not_started';
      else if (reqPassed && newScore >= 70) newVettingStatus = 'vetted';
      else newVettingStatus = 'in_progress';

      await fetch(`/api/carriers/${carrier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vettingScore: newScore, vettingStatus: newVettingStatus }),
      });
      setCarrierData((prev) => ({ ...prev, vettingScore: newScore, vettingStatus: newVettingStatus }));
    }
  }, [carrier.id, totalCount]);

  const updateCheck = useCallback(async (checkType: CheckType, status: VettingStatus, note?: string) => {
    setLoading(checkType);
    try {
      const existing = checkMap[checkType];
      const checkedAt = status === 'pending' ? null : new Date().toISOString();

      if (existing) {
        const res = await fetch(`/api/carriers/${carrier.id}/vetting/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, checkedAt, notes: note ?? existing.notes }),
        });
        if (res.ok) {
          const updated = await res.json() as CarrierVetting;
          setChecks((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }
      } else {
        const res = await fetch(`/api/carriers/${carrier.id}/vetting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkType, status, checkedAt, notes: note ?? null }),
        });
        if (res.ok) {
          const created = await res.json() as CarrierVetting;
          setChecks((prev) => [...prev, created]);
        }
      }

      await refreshVettingStatus(carrierData.vettingStatus ?? 'not_started');
    } finally {
      setLoading(null);
    }
  }, [carrier.id, checkMap, carrierData.vettingStatus, refreshVettingStatus]);

  const handleFmcsaLookup = async () => {
    if (!carrier.mcNumber) return;
    setFmcsaLoading(true);
    try {
      const res = await fetch(`/api/carriers/fmcsa-lookup?mc=${encodeURIComponent(carrier.mcNumber)}`);
      if (res.ok) {
        const data = await res.json() as FmcsaLookupResult;
        setFmcsaResult(data);
      }
    } finally {
      setFmcsaLoading(false);
    }
  };

  const handleAutoFill = async () => {
    if (!fmcsaResult?.found) return;
    setLoading('autofill');
    try {
      // Update carrier record with FMCSA data
      const updateData: Partial<Carrier> = {};
      if (fmcsaResult.authorityStatus) updateData.authorityStatus = fmcsaResult.authorityStatus;
      if (fmcsaResult.safetyRating) updateData.safetyRating = fmcsaResult.safetyRating;
      if (fmcsaResult.dotNumber) updateData.dotNumber = fmcsaResult.dotNumber;

      await fetch(`/api/carriers/${carrier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      // Mark authority check as passed/failed
      if (fmcsaResult.authorityStatus === 'active') {
        await updateCheck('authority', 'passed', 'Auto-verified via FMCSA lookup');
      } else {
        await updateCheck('authority', 'failed', `Authority status: ${fmcsaResult.authorityStatus}`);
      }

      // Mark safety rating check
      if (fmcsaResult.safetyRating === 'satisfactory' || fmcsaResult.safetyRating === 'not_rated') {
        await updateCheck('safety_rating', 'passed', 'Auto-verified via FMCSA lookup');
      } else if (fmcsaResult.safetyRating) {
        await updateCheck('safety_rating', 'failed', `Safety rating: ${fmcsaResult.safetyRating}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async () => {
    setLoading('approve');
    try {
      const res = await fetch(`/api/carriers/${carrier.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Current User' }),
      });
      if (res.ok) {
        const updated = await res.json() as Carrier;
        setCarrierData(updated);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading('reject');
    try {
      const res = await fetch(`/api/carriers/${carrier.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      if (res.ok) {
        const updated = await res.json() as Carrier;
        setCarrierData(updated);
        setShowRejectModal(false);
        setRejectReason('');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Status Banner */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-white">Onboarding Status</h3>
              <VettingStatusBadge status={carrierData.vettingStatus} />
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[#1A2235] overflow-hidden" style={{ minWidth: '200px' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    backgroundColor: score >= 80 ? '#00C650' : score >= 50 ? '#FFAA00' : '#FF4444',
                  }}
                />
              </div>
              <span className="text-sm font-bold text-white whitespace-nowrap">
                {passedCount}/{totalCount} <span className="text-[#8B95A5] font-normal">checks</span> · {score}%
              </span>
            </div>
            {carrierData.vettingStatus === 'rejected' && carrierData.rejectionReason && (
              <p className="text-xs text-[#FF4444] mt-2">
                Rejected: {carrierData.rejectionReason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {carrierData.vettingStatus !== 'approved' && carrierData.vettingStatus !== 'rejected' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={!requiredPassed || loading === 'approve'}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: requiredPassed ? '#00C650' : '#1A2235',
                    color: requiredPassed ? '#000' : '#8B95A5',
                  }}
                >
                  {loading === 'approve' ? 'Approving…' : 'Approve Carrier'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF4444]/10 text-[#FF4444] hover:bg-[#FF4444]/20 transition-all"
                >
                  Reject
                </button>
              </>
            )}
            {carrierData.vettingStatus === 'approved' && (
              <div className="flex items-center gap-2 text-[#00C650]">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">Approved</span>
                {carrierData.approvedAt && (
                  <span className="text-xs text-[#8B95A5]">
                    {new Date(carrierData.approvedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            {carrierData.vettingStatus === 'rejected' && (
              <button
                onClick={() => {
                  setCarrierData((prev) => ({ ...prev, vettingStatus: 'in_progress' }));
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1A2235] text-[#8B95A5] hover:text-white transition-all"
              >
                Re-open Vetting
              </button>
            )}
          </div>
        </div>
        {!requiredPassed && carrierData.vettingStatus !== 'approved' && carrierData.vettingStatus !== 'rejected' && (
          <p className="text-xs text-[#8B95A5] mt-3">
            Minimum requirements to approve: Authority, Auto Liability, Cargo Insurance, Safety Rating, W-9, Carrier Agreement must all pass.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vetting Checklist */}
        <div className="lg:col-span-2 rounded-2xl bg-[#080F1E] border border-[#1A2235]">
          <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
            <h3 className="text-sm font-semibold text-white">Vetting Checklist</h3>
            <span className="text-xs text-[#8B95A5]">{passedCount} of {totalCount} complete</span>
          </div>
          <div className="divide-y divide-[#1A2235]">
            {CHECK_DEFINITIONS.map(({ type, label, description, required }) => {
              const check = checkMap[type];
              const status: VettingStatus = check?.status ?? 'pending';
              const isLoading = loading === type;

              return (
                <div key={type} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{label}</span>
                        {required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C650]/10 text-[#00C650] font-medium">
                            Required
                          </span>
                        )}
                        <VettingBadge status={status} />
                      </div>
                      <p className="text-xs text-[#8B95A5] mt-0.5">{description}</p>
                      {check?.checkedAt && (
                        <p className="text-xs text-[#8B95A5] mt-1">
                          {check.checkedBy ? `By ${check.checkedBy} · ` : ''}
                          {new Date(check.checkedAt).toLocaleDateString()}
                          {check.expiryDate ? ` · Expires ${new Date(check.expiryDate).toLocaleDateString()}` : ''}
                        </p>
                      )}
                      {check?.notes && (
                        <p className="text-xs text-[#8B95A5] mt-0.5 italic">{check.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {status !== 'passed' && (
                        <button
                          onClick={() => updateCheck(type, 'passed')}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#00C650]/10 text-[#00C650] hover:bg-[#00C650]/20 transition-all disabled:opacity-50"
                        >
                          {isLoading ? '…' : 'Pass'}
                        </button>
                      )}
                      {status !== 'failed' && (
                        <button
                          onClick={() => updateCheck(type, 'failed')}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FF4444]/10 text-[#FF4444] hover:bg-[#FF4444]/20 transition-all disabled:opacity-50"
                        >
                          {isLoading ? '…' : 'Fail'}
                        </button>
                      )}
                      {status !== 'waived' && (
                        <button
                          onClick={() => updateCheck(type, 'waived')}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-all disabled:opacity-50"
                        >
                          Waive
                        </button>
                      )}
                      {status !== 'pending' && (
                        <button
                          onClick={() => updateCheck(type, 'pending')}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1A2235] text-[#8B95A5] hover:text-white transition-all disabled:opacity-50"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Notes input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Add note…"
                      value={notes[type] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [type]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && notes[type]) {
                          updateCheck(type, status, notes[type]);
                          setNotes((prev) => ({ ...prev, [type]: '' }));
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0C1528] border border-[#1A2235] text-[#8B95A5] placeholder-[#4B5568] focus:outline-none focus:border-[#2A3347]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: FMCSA Lookup */}
        <div className="space-y-4">
          {/* FMCSA Card */}
          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235]">
            <div className="p-5 border-b border-[#1A2235]">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00C650]" />
                <h3 className="text-sm font-semibold text-white">FMCSA Verify</h3>
              </div>
              <p className="text-xs text-[#8B95A5] mt-1">
                Lookup carrier authority, safety rating, and insurance via FMCSA.
              </p>
            </div>
            <div className="p-5 space-y-3">
              {carrier.mcNumber ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235]">
                    <span className="text-xs text-[#8B95A5]">MC#</span>
                    <span className="text-sm font-mono text-white">{carrier.mcNumber}</span>
                  </div>
                  <button
                    onClick={handleFmcsaLookup}
                    disabled={fmcsaLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#00C650] hover:bg-[#00B347] text-black transition-all disabled:opacity-60"
                  >
                    {fmcsaLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Verify with FMCSA
                      </>
                    )}
                  </button>

                  {fmcsaResult && (
                    <div className="space-y-3 mt-1">
                      {fmcsaResult.found ? (
                        <>
                          <FmcsaResultRow label="Legal Name" value={fmcsaResult.legalName} />
                          <FmcsaResultRow
                            label="Authority"
                            value={fmcsaResult.authorityStatus}
                            color={
                              fmcsaResult.authorityStatus === 'active'
                                ? '#00C650'
                                : '#FF4444'
                            }
                          />
                          <FmcsaResultRow
                            label="Safety Rating"
                            value={fmcsaResult.safetyRating?.replace('_', ' ')}
                            color={
                              fmcsaResult.safetyRating === 'satisfactory'
                                ? '#00C650'
                                : fmcsaResult.safetyRating === 'conditional'
                                ? '#FFAA00'
                                : fmcsaResult.safetyRating === 'unsatisfactory'
                                ? '#FF4444'
                                : '#8B95A5'
                            }
                          />
                          <FmcsaResultRow
                            label="Insurance"
                            value={fmcsaResult.insuranceOnFile ? `On file ($${(fmcsaResult.insuranceAmount ?? 0).toLocaleString()})` : 'Not on file'}
                            color={fmcsaResult.insuranceOnFile ? '#00C650' : '#FF4444'}
                          />
                          {fmcsaResult.outOfServiceDate && (
                            <FmcsaResultRow
                              label="Out of Service"
                              value={`${fmcsaResult.outOfServiceDate} — ${fmcsaResult.outOfServiceReason}`}
                              color="#FF4444"
                            />
                          )}
                          <button
                            onClick={handleAutoFill}
                            disabled={loading === 'autofill'}
                            className="w-full px-4 py-2 rounded-xl text-sm font-semibold bg-[#0C1528] border border-[#1A2235] text-white hover:border-[#2A3347] transition-all disabled:opacity-50"
                          >
                            {loading === 'autofill' ? 'Updating…' : 'Auto-fill from FMCSA'}
                          </button>
                          <p className="text-[10px] text-[#8B95A5] leading-relaxed">
                            {fmcsaResult.simulatedNote}
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <XCircle className="h-6 w-6 text-[#FF4444] mx-auto mb-2" />
                          <p className="text-xs text-[#8B95A5]">Carrier not found in FMCSA database.</p>
                          <p className="text-[10px] text-[#8B95A5] mt-2">{fmcsaResult.simulatedNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#8B95A5]">No MC# on file. Add an MC number to enable FMCSA lookup.</p>
              )}
            </div>
          </div>

          {/* Required checks summary */}
          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Minimum Requirements</h3>
            <div className="space-y-2">
              {REQUIRED_CHECKS.map((ct) => {
                const check = checkMap[ct];
                const passed = check && (check.status === 'passed' || check.status === 'waived');
                const def = CHECK_DEFINITIONS.find((d) => d.type === ct);
                return (
                  <div key={ct} className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle className="h-4 w-4 text-[#00C650] flex-shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#8B95A5] flex-shrink-0" />
                    )}
                    <span className={`text-xs ${passed ? 'text-white' : 'text-[#8B95A5]'}`}>
                      {def?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Reject Carrier</h3>
            <p className="text-sm text-[#8B95A5] mb-4">
              This will mark the carrier as rejected. Provide a reason below.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm bg-[#0C1528] border border-[#1A2235] text-white placeholder-[#4B5568] focus:outline-none focus:border-[#2A3347] resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#8B95A5] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading === 'reject'}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF4444] hover:bg-[#e03333] text-white transition-all disabled:opacity-50"
              >
                {loading === 'reject' ? 'Rejecting…' : 'Reject Carrier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FmcsaResultRow({
  label,
  value,
  color,
}: {
  label: string;
  value?: string | null;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-[#8B95A5]">{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: color ?? '#ffffff' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
