import { useState } from 'react';
import { FileText, Loader2, Filter, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

export default function AuditExport() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [minRisk, setMinRisk] = useState<number>(60);
  const [type, setType] = useState<string>('');
  const [district, setDistrict] = useState<string>('');

  const generateReport = async (useFilters: boolean) => {
    setLoading(true);
    let url = '/cases/export/pdf-data';
    
    if (useFilters) {
      const params = new URLSearchParams();
      params.append('minRisk', minRisk.toString());
      if (type) params.append('type', type);
      if (district) params.append('district', district);
      url += `?${params.toString()}`;
    } else {
      url += '?minRisk=60';
    }

    try {
      const data = await api.get(url);
      const html = buildAuditHTML(data);
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (win) win.focus();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  function buildAuditHTML(data: any): string {
    const { summary, cases, report_date } = data;
    const dateStr = new Date(report_date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const rows = (cases || []).slice(0, 100).map((c: any, idx: number) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:11px;color:#64748b;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;">${c.name}</td>
        <td style="padding:10px 12px;font-size:11px;">${c.scheme}</td>
        <td style="padding:10px 12px;font-size:11px;">${c.district}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="background:${c.risk_score>=85?'#fee2e2':'#fef3c7'};color:${c.risk_score>=85?'#dc2626':'#d97706'};padding:2px 10px;border-radius:20px;font-weight:900;font-size:12px;">
            ${c.risk_score}
          </span>
        </td>
        <td style="padding:10px 12px;">
          <span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
            ${c.leakage_type.replace('_', ' ')}
          </span>
        </td>
        <td style="padding:10px 12px;font-size:12px;">₹${c.amount?.toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;font-size:11px;color:#64748b;max-width:200px;word-wrap:break-word;">${c.risk_reason?.substring(0,120)}...</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DBT Audit Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: white; padding: 40px; }
    .header { border-bottom: 4px solid #000; padding-bottom: 24px; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 900; letter-spacing: -0.05em; }
    .subtitle { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
    .meta { font-size: 11px; color: #94a3b8; margin-top: 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { border: 1px solid #e2e8f0; border-top: 4px solid #000; padding: 16px; border-radius: 8px; }
    .stat-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 900; letter-spacing: -0.05em; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th { padding: 12px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .section-title { font-size: 16px; font-weight: 900; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:20px;right:20px;z-index:999;">
    <button onclick="window.print()" style="padding:10px 20px;background:#000;color:#fff;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
      Download PDF
    </button>
  </div>

  <div class="header">
    <div class="title">DBT Leakage Detection — Audit Report</div>
    <div class="subtitle">Gujarat Direct Benefit Transfer — District Finance Officer Report</div>
    <div class="meta">Generated: ${dateStr} | System: DBT Intelligence Unit v1.0 | Classification: OFFICIAL</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Flagged</div>
      <div class="stat-value">${(summary?.total || 0).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card" style="border-top-color:#dc2626">
      <div class="stat-label">Critical (85+)</div>
      <div class="stat-value" style="color:#dc2626">${(summary?.critical || 0).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card" style="border-top-color:#d97706">
      <div class="stat-label">Amount at Risk</div>
      <div class="stat-value" style="color:#d97706">₹${((summary?.total_amount || 0) / 100000).toFixed(1)}L</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Deceased Flags</div>
      <div class="stat-value">${summary?.deceased || 0}</div>
    </div>
  </div>

  <div class="section-title">Priority Investigation Queue (Top 100 by Risk Score)</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Beneficiary</th><th>Scheme</th><th>District</th>
        <th>Risk</th><th>Type</th><th>Amount</th><th>Evidence Summary</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;">
    This report was generated automatically by the DBT Intelligence System. All flagged cases require field verification before enforcement action.
    Risk scores are computed using Gujarati-transliteration-aware fuzzy matching, death register cross-referencing, and temporal analysis.
  </div>
</body>
</html>`;
  }

  return (
    <>
      <button
        id="audit-export-btn"
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 gradient-cta text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95"
      >
        <FileText size={16} />
        <span className="font-label text-[11px] font-black uppercase tracking-wider">
          Export PDF
        </span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Configure Export</h3>
                  <p className="text-[11px] font-label uppercase tracking-widest text-gray-500 mt-1">Apply filters before generating PDF</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">District</label>
                  <select 
                    value={district} onChange={e => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Districts</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Surat">Surat</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Bhavnagar">Bhavnagar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Leakage Pattern</label>
                  <select 
                    value={type} onChange={e => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Patterns</option>
                    <option value="DECEASED">Deceased Beneficiary</option>
                    <option value="DUPLICATE">Identity Duplication</option>
                    <option value="UNWITHDRAWN">Unwithdrawn Funds</option>
                    <option value="CROSS_SCHEME">Cross-Scheme Duplication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">
                    Minimum Risk Score: <span className="text-black">{minRisk}</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" value={minRisk} onChange={e => setMinRisk(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between text-[9px] font-black font-label text-gray-400 mt-1.5">
                    <span>0</span><span>100</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                <button
                  onClick={() => generateReport(true)}
                  disabled={loading}
                  className="w-full py-3.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />}
                  Apply Filters & Export
                </button>
                
                <button
                  onClick={() => generateReport(false)}
                  disabled={loading}
                  className="w-full py-3 bg-transparent text-gray-500 rounded-xl font-label text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 hover:text-black transition-all"
                >
                  <Download size={14} />
                  Default Export (No Filters)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
