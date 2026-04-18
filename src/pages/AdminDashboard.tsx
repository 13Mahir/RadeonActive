import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Database, Activity, Cpu, Shield, Globe, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import GujaratHeatmap from '../components/GujaratHeatmap';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/summary').then(d => { setSummary(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reprocessData = async () => {
    setReprocessing(true);
    setReprocessResult(null);
    const result = await api.post('/ingest/process', {});
    setReprocessResult(result);
    setReprocessing(false);
    // Refresh summary
    const s = await api.get('/analytics/summary');
    setSummary(s);
  };

  const formatCrore = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <span className="text-[11px] font-black font-label uppercase tracking-widest text-on-surface-variant">Loading Admin Console...</span>
      </div>
    </div>
  );

  const lastRun = summary?.last_processing_run;
  const byType = summary?.by_leakage_type || [];

  const [detectionRules, setDetectionRules] = useState([
    { name: 'Deceased Beneficiary Detection', desc: 'Cross-reference Aadhaar + fuzzy name matching against death register', enabled: true, sensitivity: 'High', icon: '💀' },
    { name: 'Duplicate Identity Detection', desc: 'Same scheme, 82%+ name similarity via Gujarati transliteration normalizer', enabled: true, sensitivity: 'Medium', icon: '👥' },
    { name: 'Unwithdrawn Funds Detection', desc: 'SUCCESS status but withdrawn=0 after 90+ days threshold', enabled: true, sensitivity: 'Low', icon: '💰' },
    { name: 'Cross-Scheme Duplication', desc: 'Same Aadhaar enrolled in 2+ schemes simultaneously', enabled: true, sensitivity: 'High', icon: '🔗' },
  ]);

  const toggleRule = (idx: number) => {
    const updated = [...detectionRules];
    updated[idx].enabled = !updated[idx].enabled;
    setDetectionRules(updated);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Admin Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full" />
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-purple-600">State Admin Console</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface">System Administration</h1>
          <p className="text-on-surface-variant font-medium mt-1">Configure detection rules, monitor system health, and manage state-level operations.</p>
        </div>
        <button
          onClick={reprocessData}
          disabled={reprocessing}
          className="flex items-center gap-2 px-5 py-2.5 gradient-cta text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50"
        >
          {reprocessing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
          {reprocessing ? 'Processing...' : 'Reprocess All Data'}
        </button>
      </div>

      {reprocessResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-sm font-bold text-green-700">
            Reprocessed {reprocessResult.transactionsIngested?.toLocaleString()} transactions in {(reprocessResult.durationMs / 1000).toFixed(1)}s — {reprocessResult.casesFlagged?.toLocaleString()} cases flagged
          </span>
        </motion.div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Database', value: 'SQLite WAL', status: 'online', icon: Database, color: 'text-green-600' },
          { label: 'Risk Engine', value: '4 Detectors', status: 'active', icon: Cpu, color: 'text-green-600' },
          { label: 'Transactions', value: summary?.summary?.total_transactions?.toLocaleString('en-IN') || '—', status: 'loaded', icon: Activity, color: 'text-blue-600' },
          { label: 'Processing Time', value: lastRun ? `${(lastRun.duration_ms / 1000).toFixed(1)}s` : '—', status: lastRun ? 'optimal' : 'idle', icon: Zap, color: 'text-amber-600' },
          { label: 'API Health', value: 'All endpoints', status: 'online', icon: Globe, color: 'text-green-600' },
        ].map((item, idx) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <item.icon size={16} className={item.color} />
              <span className={`text-[8px] font-black font-label uppercase tracking-widest px-2 py-0.5 rounded-full
                ${item.status === 'online' || item.status === 'active' || item.status === 'loaded' || item.status === 'optimal'
                  ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {item.status}
              </span>
            </div>
            <p className="text-[9px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-0.5">{item.label}</p>
            <p className="text-sm font-black">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Detection Rules */}
        <div className="col-span-7 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} />
            <h3 className="text-lg font-black tracking-tight">Leakage Detection Rules</h3>
          </div>

          <div className="space-y-3">
            {detectionRules.map((rule, idx) => {
              const typeCount = byType.find((t: any) =>
                t.leakage_type === ['DECEASED', 'DUPLICATE', 'UNWITHDRAWN', 'CROSS_SCHEME'][idx]
              )?.count || 0;
              return (
                <div key={rule.name} className="p-4 bg-surface-container-low rounded-xl flex items-center gap-4 hover:bg-surface-container-high transition-colors group">
                  <span className="text-2xl">{rule.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black">{rule.name}</p>
                      <span className={`text-[8px] font-black font-label uppercase tracking-widest px-2 py-0.5 rounded-full
                        ${rule.sensitivity === 'High' ? 'bg-red-100 text-red-700' :
                          rule.sensitivity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {rule.sensitivity}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{rule.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{typeCount.toLocaleString()}</p>
                    <p className="text-[9px] text-on-surface-variant font-label uppercase tracking-widest">flags</p>
                  </div>
                  <div 
                    onClick={() => toggleRule(idx)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${rule.enabled ? 'bg-green-500 justify-end' : 'bg-surface-container-highest justify-start'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Heatmap */}
        <div className="col-span-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} />
            <h3 className="text-lg font-black tracking-tight">State-Level Risk Map</h3>
          </div>
          <GujaratHeatmap />
        </div>
      </div>
    </div>
  );
}
