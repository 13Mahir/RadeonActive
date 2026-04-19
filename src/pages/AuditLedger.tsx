import { Filter as FilterIcon, Download as DownloadIcon, Eye, ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AuditLedger() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [topClusters, setTopClusters] = useState<any[]>([]);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    setLoading(true);
    let url = `/cases?type=CROSS_SCHEME&page=${page}&limit=10`;
    if (minRisk > 0) url += `&minRisk=${minRisk}`;
    api.get(url).then((data: any) => {
      setCases(data.cases);
      setPagination(data.pagination);
      setLoading(false);
    });
  }, [page, minRisk]);

  useEffect(() => {
    api.get('/cases?minRisk=90&limit=2').then((data: any) => {
      setTopClusters(data.cases || []);
    });
  }, []);

  const handleExport = async () => {
    const data = await api.get('/cases/export/pdf-data?type=CROSS_SCHEME');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cross-scheme-audit-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  return (
    <div className="p-10 space-y-10" onClick={() => showFilter && setShowFilter(false)}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">Pattern Analysis</h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Cross-scheme deduplication and pattern recognition. Gujarat DBT fraud cluster analysis.
          </p>
        </div>
        <div className="flex gap-4 relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }}
            className={`bg-surface-container-digits border px-5 py-2.5 rounded-xl font-bold flex items-center gap-3 hover:bg-surface-container transition-all shadow-sm active:scale-95 ${minRisk > 0 ? 'border-black bg-gray-50 ring-2 ring-black' : 'border-outline-variant/10 bg-surface-container-highest'}`}
          >
            <FilterIcon size={16} />
            <span className="font-label text-[11px] font-black uppercase tracking-wider">
              {minRisk > 0 ? `Risk > ${minRisk}` : 'Filter View'}
            </span>
          </button>

          {showFilter && (
            <div className="absolute top-12 left-0 w-48 bg-white border border-outline-variant/10 shadow-xl shadow-black/5 rounded-xl py-1.5 z-20">
              <button onClick={() => { setMinRisk(0); setShowFilter(false); setPage(1); }} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low flex items-center justify-between">
                 <span className={minRisk === 0 ? 'text-black' : 'text-on-surface-variant'}>All Records</span>
                 {minRisk === 0 && <div className="w-1.5 h-1.5 rounded-full bg-black"/>}
              </button>
              <button onClick={() => { setMinRisk(50); setShowFilter(false); setPage(1); }} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low flex items-center justify-between">
                 <span className={minRisk === 50 ? 'text-amber-600' : 'text-on-surface-variant'}>Medium Risk (50+)</span>
                 {minRisk === 50 && <div className="w-1.5 h-1.5 rounded-full bg-amber-600"/>}
              </button>
              <button onClick={() => { setMinRisk(80); setShowFilter(false); setPage(1); }} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low flex items-center justify-between">
                 <span className={minRisk === 80 ? 'text-red-600' : 'text-on-surface-variant'}>High Risk (80+)</span>
                 {minRisk === 80 && <div className="w-1.5 h-1.5 rounded-full bg-red-600"/>}
              </button>
            </div>
          )}

          <button onClick={handleExport} className="gradient-cta text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-3 hover:opacity-90 transition-all shadow-xl active:scale-95">
            <DownloadIcon size={16} />
            <span className="font-label text-[11px] font-black uppercase tracking-wider">Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Insight Cards */}
        <div className="col-span-4 space-y-8">
          <h3 className="text-2xl font-black tracking-tight border-b-2 border-black pb-2 w-fit">Advanced Insights</h3>

          {topClusters[0] ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border-t-8 border-red-500 shadow-xl relative overflow-hidden group">
              <AlertTriangle className="absolute top-4 right-4 text-red-100 group-hover:text-red-200 transition-colors" size={64} />
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-label text-[10px] font-black uppercase tracking-widest">Critical Flag</span>
                <span className="text-[10px] font-bold text-on-surface-variant font-label">Case #{topClusters[0].id}</span>
              </div>
              <h4 className="text-xl font-black leading-tight mb-4 group-hover:translate-x-1 transition-transform">
                {topClusters[0].leakage_type.replace('_', ' ')} — Risk {topClusters[0].risk_score}/100
              </h4>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-8 line-clamp-4">
                {topClusters[0].risk_reason}
              </p>
              <div className="flex items-center justify-between border-t border-outline-variant/15 pt-6">
                <div>
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">Risk Score</p>
                  <p className="text-xl font-black text-red-600">{topClusters[0].risk_score}/100</p>
                </div>
                <button className="flex items-center gap-2 text-[11px] font-black font-label uppercase tracking-widest hover:underline hover:gap-3 transition-all">
                  Review <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : null}

          {topClusters[1] ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border-t-8 border-amber-500 shadow-xl relative overflow-hidden group">
              <ShieldAlert className="absolute top-4 right-4 text-amber-100 group-hover:text-amber-200 transition-colors" size={64} />
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-label text-[10px] font-black uppercase tracking-widest">Pattern Alert</span>
              </div>
              <h4 className="text-xl font-black leading-tight mb-4 group-hover:translate-x-1 transition-transform">
                {topClusters[1].name} — {topClusters[1].scheme}
              </h4>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed mb-8 line-clamp-4">
                {topClusters[1].risk_reason}
              </p>
              <div className="flex items-center justify-between border-t border-outline-variant/15 pt-6">
                <div>
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">Risk Score</p>
                  <p className="text-xl font-black text-on-surface">{topClusters[1].risk_score}/100</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Table */}
        <div className="col-span-8 space-y-8">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <h3 className="text-2xl font-black tracking-tight">Cross-Scheme Duplicate Analysis</h3>
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
              {pagination.total} Flagged Records
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col">
            <div className="grid grid-cols-12 bg-surface-container-highest px-8 py-4 border-b-2 border-outline-variant/10">
              <div className="col-span-3 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Beneficiary</div>
              <div className="col-span-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Scheme</div>
              <div className="col-span-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">District</div>
              <div className="col-span-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant text-center">Risk Score</div>
              <div className="col-span-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Amount</div>
              <div className="col-span-1 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant text-right">Act</div>
            </div>

            <div className="divide-y divide-outline-variant/5">
              {loading ? (
                <div className="py-12 text-center text-on-surface-variant font-label text-[11px] uppercase tracking-widest">Loading...</div>
              ) : cases.map((row: any) => (
                <div key={row.id} className="grid grid-cols-12 px-8 py-5 items-center hover:bg-surface-container-low transition-colors group">
                  <div className="col-span-3">
                    <p className="font-black text-on-surface">{row.name}</p>
                    <p className="text-[10px] font-black text-on-surface-variant font-label mt-0.5 tracking-wider">
                      **** {row.aadhaar?.slice(-4)}
                    </p>
                  </div>
                  <div className="col-span-2 text-sm font-bold text-on-surface-variant">{row.scheme}</div>
                  <div className="col-span-2 text-sm font-bold text-on-surface-variant">{row.district}</div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-3 py-1.5 rounded-xl font-black text-sm ring-1 shadow-sm
                      ${row.risk_score > 80 ? 'bg-red-50 text-red-600 ring-red-100' :
                        row.risk_score > 50 ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                        'bg-surface-container-high text-on-surface ring-black/5'}`}
                    >
                      {row.risk_score}
                    </span>
                  </div>
                  <div className="col-span-2 font-bold text-sm">₹{row.amount?.toLocaleString('en-IN')}</div>
                  <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate('/dashboard/verification', { state: { caseId: row.id } })}
                      title="View case detail"
                      className="p-1.5 hover:bg-white rounded-lg shadow-sm border border-outline-variant/10 transition-colors hover:border-black"
                    >
                      <Eye size={14} className="text-on-surface-variant" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-low px-8 py-4 border-t border-outline-variant/15 flex justify-between items-center">
              <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
                {pagination.total} cross-scheme records
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="p-1.5 px-3 rounded-lg hover:bg-white disabled:opacity-30">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[11px] font-black font-label px-2">{page}/{pagination.pages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="p-1.5 px-3 rounded-lg hover:bg-white disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
