import { Download, Receipt, AlertTriangle, Landmark, TrendingUp, TrendingDown, BarChart3, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import GujaratHeatmap from '../components/GujaratHeatmap';
import LiveFeed from '../components/LiveFeed';
import ProcessingBanner from '../components/ProcessingBanner';
import AuditExport from '../components/AuditExport';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsSummary {
  summary: {
    total_transactions: number;
    total_flagged: number;
    action_required: number;
    high_risk_cases: number;
    leakage_percentage: string;
    total_disbursed: number;
    flagged_amount: number;
  };
  by_leakage_type: Array<{ leakage_type: string; count: number; total_amount: number }>;
  last_processing_run: { duration_ms: number; transactions_processed: number; completed_at: string } | null;
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapScheme, setMapScheme] = useState('All Schemes');
  const [mapLayer, setMapLayer] = useState('scheme');
  const [mapLeakageType, setMapLeakageType] = useState<string | undefined>(undefined);
  const [mapMinRisk, setMapMinRisk] = useState<number | undefined>(undefined);
  const [mapMaxRisk, setMapMaxRisk] = useState<number | undefined>(undefined);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/analytics/summary').then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatCrore = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  // Find top fraud pattern
  const topPattern = data?.by_leakage_type?.reduce((a, b) => a.count > b.count ? a : b, { leakage_type: '', count: 0, total_amount: 0 });
  const totalFlags = data?.summary.total_flagged || 1;
  const topPatternPct = topPattern ? Math.round((topPattern.count / totalFlags) * 100) : 0;

  const metrics = data ? [
    {
      label: 'Total Transactions',
      value: data.summary.total_transactions.toLocaleString('en-IN'),
      trend: `${data.summary.total_flagged} flagged`,
      isUp: false,
      icon: Receipt,
      color: 'border-on-surface'
    },
    {
      label: 'Flagged Anomalies',
      value: data.summary.total_flagged.toLocaleString('en-IN'),
      trend: `Action Required: ${data.summary.action_required}`,
      isUp: false,
      icon: AlertTriangle,
      color: 'border-red-500',
      isAlert: true
    },
    {
      label: 'Est. Leakage Value',
      value: formatCrore(data.summary.flagged_amount),
      trend: `${data.summary.leakage_percentage}% of disbursed (Score ≥ 85)`,
      isUp: false,
      icon: Landmark,
      color: 'border-amber-600'
    },
    {
      label: 'High Risk Cases',
      value: data.summary.high_risk_cases.toLocaleString('en-IN'),
      trend: `Risk score ≥ 85`,
      isUp: false,
      icon: ShieldAlert,
      color: 'border-red-700',
      isAlert: true
    },
  ] : [];

  const handleExport = async () => {
    const pdfData = await api.get('/cases/export/pdf-data');
    const blob = new Blob([JSON.stringify(pdfData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dbt-audit-report-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  if (loading) return (
    <div className="p-10 space-y-10">
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-[11px] font-black font-label uppercase tracking-widest text-on-surface-variant">Loading Intelligence Hub...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-10 space-y-10">
      {data?.last_processing_run && (
        <ProcessingBanner run={data.last_processing_run} />
      )}

      <div className="flex justify-between items-end">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tighter text-on-surface mb-2"
          >
            System Governance Hub
          </motion.h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Real-time oversight of Gujarat DBT distribution and anomaly detection across 3 schemes.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-surface-container-highest px-4 py-2 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>
            <span className="text-xs font-bold font-label uppercase tracking-widest">Live Sync: Optimal</span>
          </div>
          <AuditExport />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-surface-container-lowest p-7 rounded-2xl relative overflow-hidden shadow-sm border-t-8 ${metric.color} flex flex-col justify-between h-40`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">{metric.label}</span>
              <metric.icon className="text-on-surface-variant/40" size={22} />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter text-on-surface leading-none">{metric.value}</div>
              <div className="flex items-center gap-1.5 mt-2">
                {metric.icon === Landmark
                  ? <TrendingDown size={14} className="text-amber-600" />
                  : <TrendingUp size={14} className={metric.isUp ? 'text-black' : 'text-red-500'} />
                }
                <span className={`text-[10px] font-black font-label uppercase tracking-wider ${(metric as any).isAlert ? 'bg-red-100 text-red-600 px-2 py-0.5 rounded' : 'text-on-surface-variant'}`}>
                  {metric.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Fraud Pattern + Leakage Summary */}
      {data?.by_leakage_type && data.by_leakage_type.length > 0 && (
        <div className="grid grid-cols-12 gap-6">
          {/* Top Fraud Pattern */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-4 bg-surface-container-lowest p-8 rounded-2xl border-t-8 border-red-600 shadow-xl relative overflow-hidden"
          >
            <BarChart3 className="absolute top-4 right-4 text-red-100" size={56} />
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-red-600 mb-4 block">Top Fraud Pattern</span>
            <h3 className="text-3xl font-black tracking-tighter mb-2">
              {topPattern?.leakage_type.replace('_', ' ')}
            </h3>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black tracking-tighter text-red-600">{topPatternPct}%</span>
              <span className="text-sm font-bold text-on-surface-variant mb-1">of all flags</span>
            </div>
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${topPatternPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-red-600 rounded-full"
              />
            </div>
          </motion.div>

          {/* Leakage Type Breakdown */}
          <div className="col-span-8 grid grid-cols-4 gap-4">
            {data.by_leakage_type.map((item, idx) => {
              const colors: Record<string, { border: string; bg: string; text: string }> = {
                DECEASED: { border: 'border-red-600', bg: 'bg-red-50', text: 'text-red-600' },
                DUPLICATE: { border: 'border-black', bg: 'bg-surface-container-lowest', text: 'text-on-surface' },
                UNWITHDRAWN: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
                CROSS_SCHEME: { border: 'border-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
              };
              const c = colors[item.leakage_type] || { border: 'border-gray-400', bg: 'bg-surface-container-lowest', text: 'text-on-surface' };
              return (
                <motion.div
                  key={item.leakage_type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-5 rounded-2xl border-t-4 shadow-sm ${c.border} ${c.bg}`}
                >
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label mb-1">
                    {item.leakage_type.replace('_', ' ')}
                  </p>
                  <div className={`text-3xl font-black tracking-tighter ${c.text}`}>{item.count.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-on-surface-variant mt-1 font-medium">
                    {formatCrore(item.total_amount)} at risk
                  </div>
                  <div className="text-[10px] font-bold text-on-surface-variant mt-2">
                    {Math.round((item.count / totalFlags) * 100)}% of total
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap + Live Feed */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-surface-container-low rounded-3xl p-1.5 shadow-xl ring-1 ring-black/5">
          <div className="bg-surface-container-lowest h-full rounded-[1.25rem] p-8 flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black tracking-tight">{t('dashboard.heatmap_title')}</h3>
                {/* Layer selector */}
                <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl">
                  {[
                    { key: 'scheme', label: t('heatmap.layer.scheme') },
                    { key: 'leakage_type', label: t('heatmap.layer.leakage_type') },
                    { key: 'risk_level', label: t('heatmap.layer.risk_level') },
                    { key: 'amount', label: t('heatmap.layer.amount') },
                    { key: 'deceased', label: t('heatmap.layer.deceased') },
                    { key: 'unwithdrawn', label: t('heatmap.layer.unwithdrawn') },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setMapLayer(key);
                        setMapLeakageType(undefined);
                        setMapMinRisk(undefined);
                        setMapMaxRisk(undefined);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-label uppercase tracking-widest transition-all
                        ${mapLayer === key ? 'bg-white shadow-sm ring-1 ring-black/5 text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-filter row — shown when a layer needs a sub-selection */}
              {mapLayer === 'scheme' && (
                <div className="flex gap-2">
                  {['All Schemes', 'PM-KISAN', 'Pension', 'Scholarship'].map((scheme) => (
                    <button
                      key={scheme}
                      onClick={() => setMapScheme(scheme)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold font-label uppercase tracking-widest border transition-all
                        ${mapScheme === scheme ? 'border-black bg-black text-white' : 'border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-black/30'}`}
                    >
                      {scheme}
                    </button>
                  ))}
                </div>
              )}

              {mapLayer === 'leakage_type' && (
                <div className="flex gap-2">
                  {[
                    { key: undefined, label: 'All Types' },
                    { key: 'DECEASED', label: t('leakage.DECEASED') },
                    { key: 'DUPLICATE', label: t('leakage.DUPLICATE') },
                    { key: 'UNWITHDRAWN', label: t('leakage.UNWITHDRAWN') },
                    { key: 'CROSS_SCHEME', label: t('leakage.CROSS_SCHEME') },
                  ].map(({ key, label }) => (
                    <button
                      key={key || 'all'}
                      onClick={() => setMapLeakageType(key)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold font-label uppercase tracking-widest border transition-all
                        ${mapLeakageType === key ? 'border-black bg-black text-white' : 'border-outline-variant/20 text-on-surface-variant hover:border-black/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {mapLayer === 'risk_level' && (
                <div className="flex gap-2">
                  {[
                    { label: 'All Risk', min: undefined, max: undefined },
                    { label: 'Critical (85+)', min: 85, max: 100 },
                    { label: 'High (70-84)', min: 70, max: 84 },
                    { label: 'Medium (55-69)', min: 55, max: 69 },
                    { label: 'Low (<55)', min: 0, max: 54 },
                  ].map(({ label, min, max }) => (
                    <button
                      key={label}
                      onClick={() => { setMapMinRisk(min); setMapMaxRisk(max); }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold font-label uppercase tracking-widest border transition-all
                        ${mapMinRisk === min && mapMaxRisk === max
                          ? 'border-black bg-black text-white'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-black/30'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <GujaratHeatmap
              activeFilter={mapScheme}
              activeLayer={mapLayer}
              activeLeakageType={mapLeakageType}
              minRisk={mapMinRisk}
              maxRisk={mapMaxRisk}
            />
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-6">
          <h3 className="text-2xl font-black tracking-tight px-2">{t('dashboard.live_feed_title')}</h3>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}
