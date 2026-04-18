import { useState } from 'react';
import { Play, CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function DataUpload() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDefaultIngest = async () => {
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post('/ingest/process', {});
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setProcessing(false);
  };

  return (
    <div className="p-10 space-y-10">
      <div>
        <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">Data Ingestion</h1>
        <p className="text-on-surface-variant font-medium max-w-2xl">
          Load Gujarat DBT transaction data and run the complete risk detection pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Default Ingest */}
        <div className="bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-xl border-t-8 border-black ring-1 ring-black/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Process Default Dataset</h3>
              <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
                TS-PS4-1.csv + TS-PS4-2.csv
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-8">
            Ingest the pre-loaded Gujarat DBT transaction dataset (50,000 records across PM-KISAN,
            Pension, and Scholarship schemes) and death register (1,000 records). Runs all 4 leakage
            detectors and generates the risk scores.
          </p>

          <button
            onClick={runDefaultIngest}
            disabled={processing}
            className="w-full gradient-cta text-white py-4 rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {processing ? 'Processing...' : 'Run Detection Pipeline'}
          </button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-50 rounded-2xl border border-green-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-[11px] font-black font-label uppercase tracking-widest text-green-700">Pipeline Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Transactions Processed', value: result.transactionsIngested?.toLocaleString() },
                  { label: 'Death Records', value: result.deathRecordsIngested?.toLocaleString() },
                  { label: 'Cases Flagged', value: result.casesFlagged?.toLocaleString() },
                  { label: 'Processing Time', value: `${(result.durationMs / 1000).toFixed(1)}s` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[9px] font-black font-label uppercase tracking-widest text-green-600 mb-0.5">{item.label}</p>
                    <p className="text-lg font-black text-green-800">{item.value}</p>
                  </div>
                ))}
              </div>
              {result.durationMs && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-[10px] font-black text-green-600 font-label uppercase tracking-widest">
                    ⚡ Processed {result.transactionsIngested?.toLocaleString()} transactions in {(result.durationMs / 1000).toFixed(2)} seconds
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <div className="bg-surface-container-low p-8 rounded-[2rem]">
            <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest font-label border-b border-outline-variant/15 pb-2 mb-6">
              Detection Pipeline
            </h4>
            <div className="space-y-4">
              {[
                { step: '01', label: 'CSV Parse & Normalize', desc: 'Gujarati name transliteration normalization' },
                { step: '02', label: 'Deceased Detection', desc: 'Aadhaar + fuzzy name vs death register' },
                { step: '03', label: 'Duplicate Detection', desc: '82%+ name similarity within scheme' },
                { step: '04', label: 'Unwithdrawn Funds', desc: 'SUCCESS transactions not withdrawn 90+ days' },
                { step: '05', label: 'Cross-Scheme Duplication', desc: 'Same Aadhaar across PM-KISAN, Pension, Scholarship' },
                { step: '06', label: 'Risk Score Assignment', desc: '0–100 with explainable evidence' },
              ].map(item => (
                <div key={item.step} className="flex gap-4 items-start">
                  <span className="text-[10px] font-black font-label text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-lg w-8 text-center flex-shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-black text-on-surface">{item.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
