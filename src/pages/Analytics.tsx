import {
  AreaChart, BarChart, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, Bar
} from 'recharts';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Analytics() {
  const [trend, setTrend] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/leakage-trend'),
      api.get('/analytics/scheme-comparison'),
      api.get('/analytics/district-heatmap'),
    ]).then(([t, c, h]) => {
      setTrend(t.trend.map((d: any) => ({
        name: d.month,
        leakage: d.flagged_count,
        amount: Math.round(d.amount_at_risk / 1000),
        deceased: d.deceased,
        duplicate: d.duplicate,
        unwithdrawn: d.unwithdrawn,
        cross_scheme: d.cross_scheme,
      })));
      setComparison(c.comparison.map((s: any) => ({
        name: s.scheme,
        flagged: s.flagged_count,
        total: s.total_transactions,
        flagRate: s.flag_rate_pct,
      })));
      setHeatmap(h.heatmap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-10 flex items-center justify-center h-96 text-on-surface-variant font-label text-[11px] uppercase tracking-widest">
      Loading analytics...
    </div>
  );

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">Leakage Analytics</h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Real detection data across 3 Gujarat DBT schemes: PM-KISAN, Pension, Scholarship.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Leakage Trend */}
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/10 h-[400px]">
          <h3 className="text-xl font-black tracking-tight mb-6">Leakage Flags by Month</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="leakage" stroke="#000" fill="#000" fillOpacity={0.05} strokeWidth={3} name="Flagged Cases" />
              <Area type="monotone" dataKey="deceased" stroke="#dc2626" fill="#dc2626" fillOpacity={0.03} strokeWidth={2} name="Deceased" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scheme Comparison */}
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/10 h-[400px]">
          <h3 className="text-xl font-black tracking-tight mb-6">Scheme Risk Comparison</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <Tooltip cursor={{ fill: '#f8f9ff' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="flagged" fill="#000" radius={[10, 10, 0, 0]} name="Flagged" />
              <Bar dataKey="total" fill="#e2e8f0" radius={[10, 10, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Heatmap Table */}
      <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/10">
        <h3 className="text-xl font-black tracking-tight mb-6">District Risk Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10">
                {['District', 'Flagged', 'Avg Risk', 'Deceased', 'Duplicate', 'Unwithdrawn', 'Cross-Scheme', 'Amount at Risk'].map(h => (
                  <th key={h} className="pb-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {heatmap.map((row: any) => (
                <tr key={row.district} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-4 font-black text-on-surface">{row.district}</td>
                  <td className="py-4 px-4 font-black text-red-600">{row.flagged_count}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${Number(row.avg_risk_score) > 80 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {Number(row.avg_risk_score).toFixed(0)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-on-surface-variant">{row.deceased_count}</td>
                  <td className="py-4 px-4 text-sm text-on-surface-variant">{row.duplicate_count}</td>
                  <td className="py-4 px-4 text-sm text-on-surface-variant">{row.unwithdrawn_count}</td>
                  <td className="py-4 px-4 text-sm text-on-surface-variant">{row.cross_scheme_count}</td>
                  <td className="py-4 px-4 font-bold text-on-surface">
                    ₹{(row.total_amount_at_risk / 100000).toFixed(1)}L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
