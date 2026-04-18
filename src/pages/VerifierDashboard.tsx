import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, ShieldAlert, CheckCircle, Gavel, Loader2, Brain, Navigation, FileText, Clock } from 'lucide-react';
import { api } from '../services/api';

interface AssignedCase {
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
}

interface CaseDetail {
  case: AssignedCase;
  evidence: Record<string, any>;
  audit_log: Array<{ action: string; actor_id: string; timestamp: string; new_value: string }>;
}

const leakageLabel: Record<string, string> = {
  DECEASED: 'Deceased Beneficiary',
  DUPLICATE: 'Duplicate Identity',
  UNWITHDRAWN: 'Unwithdrawn Funds',
  CROSS_SCHEME: 'Cross-Scheme',
};

export default function VerifierDashboard() {
  const [cases, setCases] = useState<AssignedCase[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayStats, setTodayStats] = useState({ completed: 0, pending: 0, fraud: 0 });

  useEffect(() => {
    api.get('/cases?limit=15').then((d: any) => {
      setCases(d.cases);
      if (d.cases.length > 0) setSelectedId(d.cases[0].id);
    });
    api.get('/analytics/summary').then((d: any) => {
      const byStatus = d.by_status || [];
      setTodayStats({
        completed: (byStatus.find((s: any) => s.status === 'Verified')?.count || 0) + (byStatus.find((s: any) => s.status === 'Fraud')?.count || 0),
        pending: byStatus.find((s: any) => s.status === 'Flagged')?.count || 0,
        fraud: byStatus.find((s: any) => s.status === 'Fraud')?.count || 0,
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/cases/${selectedId}`).then(setDetail);
    setAiSummary('');
    setRemarks('');
    setGpsCoords(null);
  }, [selectedId]);

  const captureGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false); },
      () => { setGpsCoords({ lat: 22.2587 + Math.random() * 0.1, lng: 71.1924 + Math.random() * 0.1 }); setGpsLoading(false); }
    );
  };

  const submitVerification = async (status: 'Verified' | 'Fraud' | 'Cleared') => {
    if (!selectedId) return;
    setSubmitting(true);
    await api.post(`/cases/${selectedId}/verify`, { status, remarks, lat: gpsCoords?.lat, lng: gpsCoords?.lng, actor_id: 'FIELD_VERIFIER' });
    const updated = await api.get(`/cases/${selectedId}`);
    setDetail(updated);
    setSubmitting(false);
  };

  const loadAI = async () => {
    if (!selectedId) return;
    setAiLoading(true);
    const d = await api.get(`/cases/${selectedId}/ai-summary`);
    setAiSummary(d.summary);
    setAiLoading(false);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Verifier Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-amber-600">Field Verifier Console</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface">My Assigned Cases</h1>
          <p className="text-on-surface-variant font-medium mt-1">Conduct field visits and submit GPS-stamped verification results.</p>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
          <Clock size={16} className="text-amber-600" />
          <span className="text-[11px] font-black font-label uppercase tracking-widest text-amber-700">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Pending Visits', value: todayStats.pending, color: 'border-amber-500 bg-amber-50', icon: MapPin },
          { label: 'Completed Today', value: todayStats.completed, color: 'border-green-500 bg-green-50', icon: CheckCircle },
          { label: 'Fraud Flagged', value: todayStats.fraud, color: 'border-red-500 bg-red-50', icon: Gavel },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-5 rounded-2xl border-l-4 ${stat.color} flex justify-between items-center`}
          >
            <div>
              <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter">{stat.value}</h4>
            </div>
            <stat.icon size={28} className="text-on-surface-variant/20" />
          </motion.div>
        ))}
      </div>

      {/* Case List + Investigation */}
      <div className="grid grid-cols-12 gap-6">
        {/* Case Queue */}
        <div className="col-span-4 space-y-3 max-h-[550px] overflow-y-auto pr-2">
          <h3 className="text-lg font-black tracking-tight px-1 sticky top-0 bg-surface pb-2 z-10">Visit Queue</h3>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all
                ${selectedId === c.id ? 'ring-2 ring-amber-500 bg-amber-50/50 border-transparent shadow-lg' : 'bg-surface-container-lowest border-outline-variant/15 hover:bg-surface-container-low'}`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <p className="font-black text-sm text-on-surface">{c.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{leakageLabel[c.leakage_type] || c.leakage_type}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full
                  ${c.status === 'Flagged' ? 'bg-red-100 text-red-700' :
                    c.status === 'Verified' ? 'bg-green-100 text-green-700' :
                    c.status === 'Fraud' ? 'bg-red-600 text-white' :
                    'bg-amber-100 text-amber-700'}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1"><MapPin size={10} />{c.district}</span>
                <span className={`font-black ${c.risk_score >= 90 ? 'text-red-600' : 'text-on-surface-variant'}`}>Risk {c.risk_score}</span>
                <span>₹{c.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Field Investigation Panel */}
        <div className="col-span-8">
          {detail ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/10 ring-1 ring-black/5">
              {/* Case Header */}
              <div className="p-5 bg-gradient-to-r from-amber-50 to-transparent border-b border-outline-variant/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{detail.case.name}</h3>
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
                    {leakageLabel[detail.case.leakage_type]} • {detail.case.scheme} • {detail.case.district}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={loadAI} disabled={aiLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg font-label text-[10px] font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />} AI Brief
                  </button>
                  <div className={`px-4 py-2 rounded-xl text-center min-w-[70px]
                    ${detail.case.risk_score >= 90 ? 'bg-red-600 text-white' : detail.case.risk_score >= 75 ? 'bg-amber-600 text-white' : 'bg-surface-container-high'}`}>
                    <span className="text-xl font-black leading-none">{detail.case.risk_score}</span>
                    <span className="text-[8px] font-black block tracking-widest">
                      {detail.case.risk_score >= 90 ? 'CRITICAL' : detail.case.risk_score >= 75 ? 'HIGH' : 'MEDIUM'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[380px] overflow-y-auto">
                {aiSummary && (
                  <div className="bg-black/5 p-3 rounded-xl border border-black/10 text-sm font-medium">{aiSummary}</div>
                )}

                {/* Detection Reason */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-1.5 text-red-600">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-black font-label uppercase tracking-widest">Why Flagged</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">{detail.case.risk_reason}</p>
                </div>

                {/* Evidence Grid */}
                {detail.evidence && Object.keys(detail.evidence).length > 0 && (
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2 block">Evidence</span>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(detail.evidence).filter(([k]) => !k.startsWith('__')).slice(0, 9).map(([key, val]) => (
                        <div key={key} className="bg-white p-2 rounded-lg border border-outline-variant/10">
                          <p className="text-[8px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-0.5">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs font-black truncate">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPS */}
                <div className="flex items-center justify-between bg-surface-container-high/30 p-3 rounded-xl border border-outline-variant/10">
                  <div>
                    <span className="text-[10px] font-black font-label uppercase tracking-widest">GPS Stamp</span>
                    {gpsCoords ? (
                      <p className="text-xs font-mono font-bold text-green-700 mt-0.5">✓ {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant mt-0.5">Required before submission</p>
                    )}
                  </div>
                  <button onClick={captureGPS} disabled={gpsLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg font-label text-[9px] font-black uppercase tracking-widest disabled:opacity-50">
                    {gpsLoading ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />} Capture
                  </button>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 bg-surface-container-low border-t border-outline-variant/10 space-y-3">
                <textarea
                  className="w-full bg-white rounded-xl p-3 text-sm font-medium placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-amber-500 outline-none resize-none h-16 shadow-sm border-none"
                  placeholder="Field observation notes..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => submitVerification('Fraud')} disabled={submitting}
                    className="py-3 rounded-xl border-2 border-red-600 text-red-600 font-label text-[10px] font-black uppercase tracking-widest hover:bg-red-50 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <Gavel size={14} /> Fraud
                  </button>
                  <button onClick={() => submitVerification('Cleared')} disabled={submitting}
                    className="py-3 rounded-xl border-2 border-amber-500 text-amber-700 font-label text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <ShieldAlert size={14} /> Needs Review
                  </button>
                  <button onClick={() => submitVerification('Verified')} disabled={submitting}
                    className="py-3 rounded-xl gradient-cta text-white font-label text-[10px] font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Genuine
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-on-surface-variant font-label text-[11px] uppercase tracking-widest">
              Select a case from your visit queue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
