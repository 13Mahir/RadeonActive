import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, ShieldCheck, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import AuditExport from '../components/AuditExport';

export default function AuditorDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [crossCases, setCrossCases] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/cases?type=CROSS_SCHEME&limit=10'),
      api.get('/analytics/district-heatmap'),
    ]).then(([s, c, h]) => {
      setSummary(s);
      setCrossCases(c.cases);
      setHeatmap(h.heatmap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatCrore = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-[11px] font-black font-label uppercase tracking-widest text-on-surface-variant">Loading Audit Console...</span>
      </div>
    </div>
  );

  const byType = summary?.by_leakage_type || [];
  const totalFlags = summary?.summary?.total_flagged || 1;

  return (
    <div className="p-8 space-y-8">
      {/* Auditor Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-blue-600">Audit Team Console</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface">Compliance Audit View</h1>
          <p className="text-on-surface-variant font-medium mt-1">Cross-scheme duplicate flags and compliance summary. Read-only access.</p>
        </div>
        <AuditExport />
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Total Flagged', value: summary?.summary?.total_flagged?.toLocaleString('en-IN') || '0', color: 'border-blue-600', sub: 'All patterns combined' },
          { label: 'Cross-Scheme Flags', value: byType.find((t: any) => t.leakage_type === 'CROSS_SCHEME')?.count || 0, color: 'border-indigo-600', sub: 'Aadhaar duplication' },
          { label: 'Amount at Risk', value: formatCrore(summary?.summary?.flagged_amount || 0), color: 'border-amber-600', sub: 'Potential leakage value' },
          { label: 'District Coverage', value: heatmap.length, color: 'border-green-600', sub: 'Districts with flags' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-surface-container-lowest p-6 rounded-2xl border-t-4 ${stat.color} shadow-sm`}
          >
            <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">{stat.label}</p>
            <h4 className="text-3xl font-black tracking-tighter mb-1">{stat.value}</h4>
            <p className="text-[10px] text-on-surface-variant">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Pattern Distribution */}
        <div className="col-span-5 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <h3 className="text-lg font-black tracking-tight mb-5 flex items-center gap-2">
            <BarChart3 size={18} /> Leakage Pattern Distribution
          </h3>
          <div className="space-y-4">
            {byType.map((item: any) => {
              const pct = Math.round((item.count / totalFlags) * 100);
              const colors: Record<string, string> = { DECEASED: 'bg-red-600', DUPLICATE: 'bg-black', UNWITHDRAWN: 'bg-amber-500', CROSS_SCHEME: 'bg-blue-600' };
              return (
                <div key={item.leakage_type}>
                  <div className="flex justify-between text-[11px] font-black mb-1.5">
                    <span>{item.leakage_type.replace('_', ' ')}</span>
                    <span className="text-on-surface-variant">{item.count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${colors[item.leakage_type] || 'bg-gray-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compliance Score */}
          <div className="mt-6 pt-5 border-t border-outline-variant/10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">System Compliance Score</p>
                <p className="text-3xl font-black tracking-tighter text-on-surface">
                  {Math.max(0, 100 - Math.round(Number(summary?.summary?.leakage_percentage || 0))).toFixed(0)}%
                </p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black font-label uppercase tracking-widest
                ${Number(summary?.summary?.leakage_percentage) > 50 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {Number(summary?.summary?.leakage_percentage) > 50 ? 'Needs Attention' : 'Acceptable'}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Scheme Flags */}
        <div className="col-span-7 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <AlertTriangle size={18} /> Cross-Scheme Duplicate Flags
            </h3>
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
              {crossCases.length} Records
            </span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {crossCases.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant text-[11px] font-label uppercase tracking-widest">No cross-scheme flags found</p>
            ) : crossCases.map(c => (
              <div key={c.id} className="p-4 bg-surface-container-low rounded-xl flex justify-between items-center hover:bg-surface-container-high transition-colors group">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black">{c.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                      ${c.risk_score >= 85 ? 'bg-red-100 text-red-700' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      Risk {c.risk_score}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{c.scheme} • {c.district} • ₹{c.amount?.toLocaleString('en-IN')}</p>
                </div>
                <ChevronRight size={14} className="text-on-surface-variant/30 group-hover:text-on-surface transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Summary Table */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ShieldCheck size={18} /> District-wise Compliance Summary
          </h3>
          <button className="px-4 py-2 bg-surface-container-high rounded-xl text-[10px] font-black font-label uppercase tracking-widest flex items-center gap-2 hover:ring-2 hover:ring-black transition-all">
            <Download size={12} /> Export CSV
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/10">
              {['District', 'Flagged', 'Avg Risk', 'Deceased', 'Duplicate', 'Unwithdrawn', 'Cross-Scheme', 'Amount at Risk'].map(h => (
                <th key={h} className="pb-3 px-3 text-[9px] font-black font-label uppercase tracking-widest text-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {heatmap.map((row: any) => (
              <tr key={row.district} className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-3 font-bold text-sm">{row.district}</td>
                <td className="py-3 px-3 font-black text-red-600">{row.flagged_count}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black
                    ${Number(row.avg_risk_score) > 80 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                    {Number(row.avg_risk_score).toFixed(0)}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs">{row.deceased_count}</td>
                <td className="py-3 px-3 text-xs">{row.duplicate_count}</td>
                <td className="py-3 px-3 text-xs">{row.unwithdrawn_count}</td>
                <td className="py-3 px-3 text-xs">{row.cross_scheme_count}</td>
                <td className="py-3 px-3 font-bold text-sm">{formatCrore(row.total_amount_at_risk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
