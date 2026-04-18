import { useState, useEffect } from 'react';
import { CheckCircle, ShieldAlert, Gavel, FileText, MapPin, Loader2, Brain, Navigation, ArrowRight, Calendar, User, CreditCard, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface CaseDetail {
  case: {
    id: number;
    name: string;
    aadhaar: string;
    scheme: string;
    district: string;
    amount: number;
    transaction_date: string;
    leakage_type: string;
    risk_score: number;
    risk_reason: string;
    status: string;
    assigned_to: string | null;
    verification_remarks: string | null;
    verification_lat: number | null;
    verification_lng: number | null;
    verification_timestamp: string | null;
  };
  evidence: Record<string, any>;
  audit_log: Array<{ action: string; actor_id: string; timestamp: string; new_value: string }>;
}

const STATUS_FLOW = ['Flagged', 'Reviewing', 'Verified', 'Fraud', 'Cleared'];

function CaseLifecycle({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'Flagged', label: 'Flagged', color: 'bg-red-600' },
    { key: 'Reviewing', label: 'Under Review', color: 'bg-black' },
    { key: 'final', label: currentStatus === 'Fraud' ? 'Fraud Confirmed' : currentStatus === 'Cleared' ? 'Cleared' : 'Verified', color: currentStatus === 'Fraud' ? 'bg-red-600' : currentStatus === 'Cleared' ? 'bg-amber-600' : 'bg-green-600' },
  ];
  const currentIdx = currentStatus === 'Flagged' ? 0 : currentStatus === 'Reviewing' ? 1 : 2;

  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-2 flex-1">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black font-label uppercase tracking-widest flex-1 justify-center transition-all
            ${idx <= currentIdx ? `${step.color} text-white shadow-sm` : 'bg-surface-container-high text-on-surface-variant'}`}>
            {idx < currentIdx && <CheckCircle size={10} />}
            {step.label}
          </div>
          {idx < steps.length - 1 && <ArrowRight size={12} className="text-on-surface-variant/30 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function StructuredEvidence({ evidence, leakageType }: { evidence: Record<string, any>; leakageType: string }) {
  if (!evidence || Object.keys(evidence).length === 0) return null;

  const renderDeceasedEvidence = () => (
    <div className="grid grid-cols-2 gap-3">
      <EvidenceField icon={<User size={14} />} label="Death Register Name" value={evidence.death_register_name || evidence.matched_with_name} />
      <EvidenceField icon={<Calendar size={14} />} label="Death Date" value={evidence.death_date} highlight />
      <EvidenceField icon={<Calendar size={14} />} label="Transaction Date" value={evidence.transaction_date} />
      <EvidenceField icon={<AlertTriangle size={14} />} label="Days Since Death" value={`${evidence.days_since_death} days`} highlight />
      <EvidenceField icon={<CreditCard size={14} />} label="Amount" value={`₹${evidence.transaction_amount?.toLocaleString('en-IN')}`} />
      <EvidenceField icon={<ShieldAlert size={14} />} label="Detection Method" value={evidence.detection_method?.replace(/_/g, ' ')} />
      {evidence.name_similarity_pct && (
        <EvidenceField icon={<User size={14} />} label="Name Similarity" value={`${evidence.name_similarity_pct}%`} highlight />
      )}
      <EvidenceField label="Withdrawn" value={evidence.was_withdrawn ? 'Yes' : 'No'} />
    </div>
  );

  const renderDuplicateEvidence = () => (
    <div className="grid grid-cols-2 gap-3">
      <EvidenceField icon={<User size={14} />} label="Matched Name" value={evidence.matched_with_name} />
      <EvidenceField icon={<CreditCard size={14} />} label="Matched Aadhaar" value={`****${evidence.matched_with_aadhaar?.slice(-4) || ''}`} />
      <EvidenceField icon={<ShieldAlert size={14} />} label="Name Similarity" value={`${evidence.name_similarity_pct}%`} highlight />
      <EvidenceField label="Detection" value={evidence.detection_method?.replace(/_/g, ' ')} />
      {evidence.duplicate_count && <EvidenceField label="Duplicate Count" value={evidence.duplicate_count} highlight />}
      {evidence.total_occurrences && <EvidenceField label="Total Occurrences" value={evidence.total_occurrences} />}
    </div>
  );

  const renderUnwithdrawnEvidence = () => (
    <div className="grid grid-cols-2 gap-3">
      <EvidenceField icon={<Calendar size={14} />} label="Transaction Date" value={evidence.transaction_date} />
      <EvidenceField icon={<AlertTriangle size={14} />} label="Days Unclaimed" value={`${evidence.days_since_transaction} days`} highlight />
      <EvidenceField icon={<CreditCard size={14} />} label="Amount at Risk" value={`₹${evidence.amount_at_risk?.toLocaleString('en-IN')}`} />
      <EvidenceField label="Threshold" value={`${evidence.threshold_days} days`} />
    </div>
  );

  const renderCrossSchemeEvidence = () => (
    <div className="grid grid-cols-2 gap-3">
      {evidence.schemes_enrolled && (
        <div className="col-span-2">
          <EvidenceField label="Schemes Enrolled" value={evidence.schemes_enrolled.join(', ')} highlight />
        </div>
      )}
      <EvidenceField label="Scheme Count" value={evidence.scheme_count} highlight />
      <EvidenceField label="Total Transactions" value={evidence.total_transactions} />
      <EvidenceField icon={<CreditCard size={14} />} label="Total Amount" value={`₹${evidence.total_amount_disbursed?.toLocaleString('en-IN')}`} />
      {evidence.name_similarity_pct && (
        <EvidenceField label="Name Similarity" value={`${evidence.name_similarity_pct}%`} />
      )}
    </div>
  );

  return (
    <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/15">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={14} className="text-on-surface" />
        <span className="text-[10px] font-black font-label uppercase tracking-widest">Structured Evidence</span>
      </div>
      {leakageType === 'DECEASED' && renderDeceasedEvidence()}
      {leakageType === 'DUPLICATE' && renderDuplicateEvidence()}
      {leakageType === 'UNWITHDRAWN' && renderUnwithdrawnEvidence()}
      {leakageType === 'CROSS_SCHEME' && renderCrossSchemeEvidence()}
      {!['DECEASED', 'DUPLICATE', 'UNWITHDRAWN', 'CROSS_SCHEME'].includes(leakageType) && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(evidence).filter(([k]) => !k.startsWith('__')).slice(0, 8).map(([key, val]) => (
            <EvidenceField key={key} label={key.replace(/_/g, ' ')} value={String(val)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceField({ icon, label, value, highlight }: { icon?: React.ReactNode; label: string; value: any; highlight?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`p-2.5 rounded-lg ${highlight ? 'bg-red-50 border border-red-100' : 'bg-white border border-outline-variant/10'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-on-surface-variant">{icon}</span>}
        <span className="text-[9px] font-black font-label uppercase tracking-widest text-on-surface-variant">{label}</span>
      </div>
      <p className={`text-sm font-black ${highlight ? 'text-red-700' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}

export default function SchemeVerification() {
  const location = useLocation();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(location.state?.caseId || null);
  const [cases, setCases] = useState<CaseDetail['case'][]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ pending: 0, verified: 0, fraud: 0 });

  useEffect(() => {
    api.get('/cases?limit=20&status=Reviewing').then((data: any) => {
      if (data.cases.length === 0) {
        api.get('/cases?limit=20').then((d2: any) => {
          setCases(d2.cases);
          if (!selectedCaseId && d2.cases.length > 0) {
            setSelectedCaseId(d2.cases[0].id);
          }
        });
      } else {
        setCases(data.cases);
        if (!selectedCaseId && data.cases.length > 0) {
          setSelectedCaseId(data.cases[0].id);
        }
      }
    });

    api.get('/analytics/summary').then((data: any) => {
      const byStatus = data.by_status || [];
      setStats({
        pending: byStatus.find((s: any) => s.status === 'Flagged')?.count || 0,
        verified: byStatus.find((s: any) => s.status === 'Verified')?.count || 0,
        fraud: byStatus.find((s: any) => s.status === 'Fraud')?.count || 0,
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    api.get(`/cases/${selectedCaseId}`).then(setSelectedCase);
    setAiSummary('');
    setRemarks('');
    setGpsCoords(null);
  }, [selectedCaseId]);

  const loadAiSummary = async () => {
    if (!selectedCaseId) return;
    setAiLoading(true);
    const data = await api.get(`/cases/${selectedCaseId}/ai-summary`);
    setAiSummary(data.summary);
    setAiLoading(false);
  };

  const captureGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsCoords({ lat: 22.2587, lng: 71.1924 });
        setGpsLoading(false);
      }
    );
  };

  const submitVerification = async (status: 'Verified' | 'Fraud' | 'Cleared') => {
    if (!selectedCaseId) return;
    setSubmitting(true);
    await api.post(`/cases/${selectedCaseId}/verify`, {
      status,
      remarks,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
      actor_id: 'VERIFIER'
    });
    const updated = await api.get(`/cases/${selectedCaseId}`);
    setSelectedCase(updated);
    setSubmitting(false);
  };

  const statItems = [
    { label: 'Pending Verification', value: stats.pending, color: 'border-amber-600', icon: FileText },
    { label: 'Verified Genuine', value: stats.verified, color: 'border-green-600', icon: CheckCircle },
    { label: 'Fraud Confirmed', value: stats.fraud, color: 'border-red-600', icon: Gavel },
  ];

  const leakageTypeLabel: Record<string, string> = {
    DECEASED: 'Deceased Beneficiary',
    DUPLICATE: 'Duplicate Identity',
    UNWITHDRAWN: 'Unwithdrawn Funds',
    CROSS_SCHEME: 'Cross-Scheme Duplication',
  };

  const riskLevel = (score: number) => {
    if (score >= 90) return { label: 'CRITICAL', color: 'bg-red-600 text-white', ring: 'ring-red-200' };
    if (score >= 75) return { label: 'HIGH', color: 'bg-amber-600 text-white', ring: 'ring-amber-200' };
    if (score >= 50) return { label: 'MEDIUM', color: 'bg-yellow-500 text-white', ring: 'ring-yellow-200' };
    return { label: 'LOW', color: 'bg-blue-600 text-white', ring: 'ring-blue-200' };
  };

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">Scheme Verification</h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Field verification queue. Submit GPS-stamped investigation results.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        {statItems.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-surface-container-lowest p-6 rounded-2xl border-t-4 ${stat.color} shadow-sm flex justify-between items-end`}
          >
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label mb-2">{stat.label}</p>
              <h4 className="text-4xl font-black tracking-tighter text-on-surface">{stat.value}</h4>
            </div>
            <stat.icon size={24} className="text-on-surface-variant/30 mb-1" />
          </motion.div>
        ))}
      </div>

      {/* Case list + Detail panel */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2 border-b-2 border-black pb-2">
            <h3 className="text-2xl font-black tracking-tight">Case Queue</h3>
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">{cases.length} Cases</span>
          </div>
          {cases.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-label text-[11px] uppercase tracking-widest">
              No cases in queue
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {cases.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`relative bg-surface-container-lowest p-5 rounded-2xl shadow-sm border transition-all cursor-pointer
                  ${selectedCaseId === c.id ? 'ring-2 ring-black border-transparent scale-[1.01] shadow-xl' : 'border-outline-variant/15 hover:bg-surface-container-low'}`}
              >
                {selectedCaseId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black rounded-l-2xl" />}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">#{c.id}</span>
                    <h4 className="text-sm font-black text-on-surface mt-0.5">{c.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black font-label uppercase tracking-widest
                    ${c.status === 'Verified' ? 'bg-green-100 text-green-700' :
                      c.status === 'Fraud' ? 'bg-red-100 text-red-700' :
                      c.status === 'Reviewing' ? 'bg-black text-white' :
                      'bg-amber-100 text-amber-700'}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-on-surface-variant font-bold"><MapPin size={10} />{c.district}</span>
                  <span className={`flex items-center gap-1 font-black ${c.risk_score >= 90 ? 'text-red-600' : c.risk_score >= 75 ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                    <ShieldAlert size={10} />Risk: {c.risk_score}
                  </span>
                  <span className="text-on-surface-variant">{leakageTypeLabel[c.leakage_type]?.split(' ')[0]}</span>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="col-span-8">
          {selectedCase ? (
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/10 flex flex-col ring-1 ring-black/5">
              {/* Header with Risk Score */}
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/15">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{selectedCase.case.name}</h3>
                    <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mt-1">
                      Case #{selectedCase.case.id} • {leakageTypeLabel[selectedCase.case.leakage_type]} • {selectedCase.case.scheme}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={loadAiSummary}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-label text-[10px] font-black uppercase tracking-widest hover:opacity-80 active:scale-95 disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                      AI Brief
                    </button>
                    <div className={`flex flex-col items-center px-4 py-2 rounded-xl ${riskLevel(selectedCase.case.risk_score).color} ring-4 ${riskLevel(selectedCase.case.risk_score).ring} min-w-[80px]`}>
                      <span className="text-2xl font-black leading-none">{selectedCase.case.risk_score}</span>
                      <span className="text-[8px] font-black tracking-widest mt-0.5">{riskLevel(selectedCase.case.risk_score).label}</span>
                    </div>
                  </div>
                </div>
                {/* Case Lifecycle */}
                <CaseLifecycle currentStatus={selectedCase.case.status} />
              </div>

              <div className="p-6 space-y-5 flex-1 max-h-[480px] overflow-y-auto">
                {/* AI Summary */}
                {aiSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-black/5 to-transparent p-4 rounded-xl border border-black/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-black" />
                      <span className="text-[10px] font-black font-label uppercase tracking-widest">Gemini AI Investigation Brief</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-on-surface">{aiSummary}</p>
                  </motion.div>
                )}

                {/* Risk Reason */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <ShieldAlert size={16} />
                    <span className="text-[10px] font-black font-label uppercase tracking-widest">Detection Reason</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-on-surface">{selectedCase.case.risk_reason}</p>
                </div>

                {/* Structured Evidence */}
                <StructuredEvidence evidence={selectedCase.evidence} leakageType={selectedCase.case.leakage_type} />

                {/* Case Fields */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Aadhaar', value: `**** **** ${selectedCase.case.aadhaar.slice(-4)}` },
                    { label: 'Disbursement', value: `₹${selectedCase.case.amount.toLocaleString('en-IN')}` },
                    { label: 'Transaction Date', value: selectedCase.case.transaction_date },
                    { label: 'District', value: selectedCase.case.district },
                    { label: 'Assigned To', value: selectedCase.case.assigned_to || 'Unassigned' },
                    { label: 'Scheme', value: selectedCase.case.scheme },
                  ].map(field => (
                    <div key={field.label} className="bg-white p-3 rounded-lg border border-outline-variant/10">
                      <p className="text-[9px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">{field.label}</p>
                      <p className="text-sm font-black">{field.value}</p>
                    </div>
                  ))}
                </div>

                {/* GPS Capture */}
                <div className="bg-surface-container-high/30 p-4 rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black font-label uppercase tracking-widest">GPS Verification Stamp</span>
                    <button
                      onClick={captureGPS}
                      disabled={gpsLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg font-label text-[10px] font-black uppercase tracking-widest hover:opacity-80 active:scale-95 disabled:opacity-50"
                    >
                      {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      Capture Location
                    </button>
                  </div>
                  {gpsCoords ? (
                    <p className="text-sm font-mono font-bold text-green-700">
                      ✓ {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                    </p>
                  ) : selectedCase.case.verification_lat ? (
                    <p className="text-sm font-mono font-medium text-on-surface-variant">
                      Previous: {selectedCase.case.verification_lat.toFixed(6)}, {selectedCase.case.verification_lng?.toFixed(6)}
                      <br /><span className="text-[10px]">at {selectedCase.case.verification_timestamp}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-on-surface-variant font-medium">No GPS captured yet — capture before verification</p>
                  )}
                </div>
              </div>

              {/* Action Panel */}
              <div className="p-6 bg-surface-container-low border-t border-outline-variant/15 space-y-4">
                <textarea
                  className="w-full bg-white border-none rounded-xl p-4 text-sm font-medium placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-black outline-none resize-none h-20 shadow-sm"
                  placeholder="Add field verification remarks..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => submitVerification('Fraud')}
                    disabled={submitting || selectedCase.case.status === 'Fraud'}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all font-black font-label text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    <Gavel size={16} />
                    Fraud Confirmed
                  </button>
                  <button
                    onClick={() => submitVerification('Cleared')}
                    disabled={submitting || selectedCase.case.status === 'Cleared'}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-amber-500 text-amber-700 hover:bg-amber-50 transition-all font-black font-label text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    <ShieldAlert size={16} />
                    Needs Review
                  </button>
                  <button
                    onClick={() => submitVerification('Verified')}
                    disabled={submitting || selectedCase.case.status === 'Verified'}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl gradient-cta text-white shadow-xl hover:opacity-90 transition-all font-black font-label text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Verified Genuine
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-on-surface-variant font-label text-[11px] uppercase tracking-widest">
              Select a case to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
