import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Database, Activity, Cpu, Shield, Globe, Zap, RefreshCw, CheckCircle, UploadCloud, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import GujaratHeatmap from '../components/GujaratHeatmap';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState<any>(null);

  // Upload DB States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [txnFile, setTxnFile] = useState<File | null>(null);
  const [deathFile, setDeathFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [detectionRules, setDetectionRules] = useState([
    { name: 'Deceased Beneficiary Detection', desc: 'Cross-reference Aadhaar + fuzzy name matching against death register', enabled: true, sensitivity: 'High', icon: '💀' },
    { name: 'Duplicate Identity Detection', desc: 'Same scheme, 82%+ name similarity via Gujarati transliteration normalizer', enabled: true, sensitivity: 'Medium', icon: '👥' },
    { name: 'Unwithdrawn Funds Detection', desc: 'SUCCESS status but withdrawn=0 after 90+ days threshold', enabled: true, sensitivity: 'Low', icon: '💰' },
    { name: 'Cross-Scheme Duplication', desc: 'Same Aadhaar enrolled in 2+ schemes simultaneously', enabled: true, sensitivity: 'High', icon: '🔗' },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/rules')
    ])
    .then(([summaryData, rulesData]) => {
      setSummary(summaryData);
      
      // Update local rules state based on backend configuration
      setDetectionRules(prev => prev.map(rule => {
        let key = '';
        if (rule.name.includes('Deceased')) key = 'DECEASED';
        else if (rule.name.includes('Duplicate')) key = 'DUPLICATE';
        else if (rule.name.includes('Unwithdrawn')) key = 'UNWITHDRAWN';
        else if (rule.name.includes('Cross-Scheme')) key = 'CROSS_SCHEME';
        
        return {
          ...rule,
          enabled: (rulesData as any)[key] ?? rule.enabled
        };
      }));
      setLoading(false);
    })
    .catch(() => setLoading(false));
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

  const toggleRule = async (idx: number) => {
    const rule = detectionRules[idx];
    const newStatus = !rule.enabled;
    
    // Optimistic UI update
    setDetectionRules(prev => prev.map((r, i) => 
      i === idx ? { ...r, enabled: newStatus } : r
    ));

    let key = '';
    if (rule.name.includes('Deceased')) key = 'DECEASED';
    else if (rule.name.includes('Duplicate')) key = 'DUPLICATE';
    else if (rule.name.includes('Unwithdrawn')) key = 'UNWITHDRAWN';
    else if (rule.name.includes('Cross-Scheme')) key = 'CROSS_SCHEME';

    // Persist to backend
    if (key) {
      await api.post('/analytics/rules', { id: key, enabled: newStatus });
    }
  };

  const formatCrore = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnFile || !deathFile) {
      setUploadError("Both Transactions and Deaths CSV files are required.");
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('transactions', txnFile);
      formData.append('deaths', deathFile);

      const result = await api.uploadFiles('/ingest/upload', formData);
      setReprocessResult(result);
      setUploadModalOpen(false);
      setTxnFile(null);
      setDeathFile(null);

      // Refresh summary
      const s = await api.get('/analytics/summary');
      setSummary(s);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload database");
    } finally {
      setUploading(false);
    }
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
        <div className="flex gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-surface-container-highest active:scale-95 shadow-sm transition-all"
          >
            <Database size={16} className="text-blue-600" />
            Change Database
          </button>
          <button
            onClick={reprocessData}
            disabled={reprocessing}
            className="flex items-center gap-2 px-5 py-2.5 gradient-cta text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50"
          >
            {reprocessing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            {reprocessing ? 'Processing...' : 'Reprocess All Data'}
          </button>
        </div>
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

      {/* Change Database Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5"
            >
              <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Database size={16} />
                  </div>
                  <div>
                    <h3 className="font-black text-on-surface">Change Database</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium">Upload new CSV sources for analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => !uploading && setUploadModalOpen(false)}
                  className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <p className="text-xs font-bold text-red-700">{uploadError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Transactions File Input */}
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                       1. Transactions Dataset (CSV)
                    </label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => setTxnFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                      />
                      <div className={`w-full px-4 py-4 border-2 border-dashed ${txnFile ? 'border-blue-400 bg-blue-50' : 'border-outline-variant/30 bg-surface-container-lowest'} rounded-xl flex items-center justify-center gap-2 transition-all group-hover:border-blue-400`}>
                        <UploadCloud size={16} className={txnFile ? 'text-blue-600' : 'text-on-surface-variant'} />
                        <span className="text-sm font-medium text-on-surface">
                          {txnFile ? txnFile.name : 'Select TS-1 CSV file...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deaths File Input */}
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                       2. Death Register Dataset (CSV)
                    </label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={(e) => setDeathFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                      />
                      <div className={`w-full px-4 py-4 border-2 border-dashed ${deathFile ? 'border-amber-400 bg-amber-50' : 'border-outline-variant/30 bg-surface-container-lowest'} rounded-xl flex items-center justify-center gap-2 transition-all group-hover:border-amber-400`}>
                        <UploadCloud size={16} className={deathFile ? 'text-amber-600' : 'text-on-surface-variant'} />
                        <span className="text-sm font-medium text-on-surface">
                          {deathFile ? deathFile.name : 'Select TS-2 CSV file...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !txnFile || !deathFile}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50"
                  >
                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                    {uploading ? 'Processing Database...' : 'Upload & Reprocess'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
