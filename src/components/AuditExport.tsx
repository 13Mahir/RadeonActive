import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function AuditExport() {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const data = await api.get('/cases/export/pdf-data?minRisk=60');
    setLoading(false);

    const html = buildAuditHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.focus();
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
    <button
      onClick={generateReport}
      disabled={loading}
      className="px-5 py-2.5 gradient-cta text-white rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
      <span className="font-label text-[11px] font-black uppercase tracking-wider">
        {loading ? 'Generating...' : 'Export PDF Report'}
      </span>
    </button>
  );
}
