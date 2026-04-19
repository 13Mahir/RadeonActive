import { UserPlus, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AssignModal from '../components/AssignModal';

type LeakageType = 'ALL' | 'DECEASED' | 'DUPLICATE' | 'UNWITHDRAWN' | 'CROSS_SCHEME';
type CaseStatus = 'Flagged' | 'Reviewing' | 'Pending' | 'Verified' | 'Fraud';

interface Case {
  id: number;
  beneficiary_id: string;
  name: string;
  scheme: string;
  district: string;
  amount: number;
  transaction_date: string;
  leakage_type: string;
  risk_score: number;
  risk_reason: string;
  status: CaseStatus;
  assigned_to: string | null;
  date_flagged: string;
}

interface CaseResponse {
  cases: Case[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface AnalyticsSummary {
  by_leakage_type: Array<{ leakage_type: string; count: number }>;
}

export default function InvestigationQueue() {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<LeakageType>('ALL');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignCaseIds, setAssignCaseIds] = useState<number[]>([]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}),
      ...(search ? { search } : {}),
    });
    const data = await api.get(`/cases?${params}`);
    setCaseData(data);
    setLoading(false);
  }, [page, typeFilter, search]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    api.get('/analytics/summary').then(setAnalytics).catch(() => {});
  }, []);

  const handleAssign = (caseId: number) => {
    setAssignCaseIds([caseId]);
    setAssignModalOpen(true);
  };

  const handleBulkAssign = () => {
    setAssignCaseIds([...selectedIds]);
    setAssignModalOpen(true);
  };

  const onAssigned = () => {
    setSelectedIds(new Set());
    fetchCases();
  };

  const leakageVectors = analytics?.by_leakage_type || [];
  const maxCount = Math.max(...leakageVectors.map(v => v.count), 1);

  const typeColors: Record<string, string> = {
    DECEASED: 'bg-red-600',
    DUPLICATE: 'bg-black',
    UNWITHDRAWN: 'bg-amber-500',
    CROSS_SCHEME: 'bg-blue-600',
  };

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">District Overview</h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Priority-sorted investigation queue. Action required on critical cases first.
          </p>
        </div>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkAssign}
              className="px-5 py-2.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95"
            >
              <UserPlus size={14} />
              Assign {selectedIds.size} Cases
            </button>
          )}
          <div className="bg-surface-container-lowest px-4 py-2 rounded-xl flex items-center gap-3 border border-outline-variant/10 shadow-sm">
            <div className="w-2.5 h-2.5 bg-on-tertiary-fixed-variant rounded-full"></div>
            <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface">
              {caseData ? `${caseData.pagination.total} Total Cases` : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Command Center + Table */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] border-t-8 border-black shadow-xl flex flex-col gap-6 ring-1 ring-black/5">
            <h3 className="text-xl font-black tracking-tight">Command Center</h3>
            <div className="space-y-3">
              {(['ALL', 'DECEASED', 'DUPLICATE', 'UNWITHDRAWN', 'CROSS_SCHEME'] as LeakageType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`w-full p-4 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-left flex justify-between items-center transition-all active:scale-95 group
                    ${typeFilter === t ? 'bg-black text-white' : 'bg-surface-container-high/50 hover:bg-surface-container-high'}`}
                >
                  {t === 'ALL' ? 'All Cases' : t.replace('_', ' ')}
                  {t !== 'ALL' && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${typeFilter === t ? 'bg-white/20' : 'bg-surface-container-highest'}`}>
                      {leakageVectors.find(v => v.leakage_type === t)?.count || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-[2rem] space-y-6">
            <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest font-label border-b border-outline-variant/15 pb-2">Leakage Vectors</h4>
            <div className="space-y-6">
              {leakageVectors.map(item => (
                <div key={item.leakage_type}>
                  <div className="flex justify-between text-[11px] font-black font-label uppercase tracking-widest mb-2">
                    <span className="text-on-surface">{item.leakage_type.replace('_', ' ')}</span>
                    <span className="text-on-surface-variant">{item.count} Cases</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxCount) * 100}%` }}
                      className={`h-full ${typeColors[item.leakage_type] || 'bg-gray-400'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investigation Queue Table */}
        <div className="col-span-9">
          <section className="bg-surface-container-lowest rounded-[2.5rem] shadow-2xl border-t-8 border-red-50 overflow-hidden ring-1 ring-black/5">
            <div className="p-8 flex justify-between items-center bg-gradient-to-r from-red-50/20 to-transparent gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Priority Investigation Queue</h3>
                <p className="text-[11px] font-black font-label uppercase tracking-widest text-on-surface-variant mt-1">
                  Sorted by composite risk score. Action required.
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input
                    className="pl-9 pr-4 py-2.5 bg-surface-container-high rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 w-48 border border-outline-variant/10"
                    placeholder="Search name, ID..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <button className="px-5 py-2.5 bg-white rounded-xl text-[11px] font-black font-label uppercase tracking-widest flex items-center gap-2 hover:ring-2 hover:ring-black transition-all border border-outline-variant/10 shadow-sm">
                  <Download size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-highest/30">
                    <th className="py-4 px-6 w-10">
                      <input type="checkbox" className="rounded" onChange={e => {
                        if (e.target.checked) setSelectedIds(new Set(caseData?.cases.map(c => c.id)));
                        else setSelectedIds(new Set());
                      }} />
                    </th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Case ID</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Beneficiary</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Scheme</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Risk Score</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Type</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Amount</th>
                    <th className="py-4 px-4 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {loading ? (
                    <tr><td colSpan={8} className="py-20 text-center text-on-surface-variant font-label text-[11px] uppercase tracking-widest">Loading cases...</td></tr>
                  ) : caseData?.cases.map((row, idx) => {
                    const isCritical = row.risk_score >= 95;
                    return (
                    <tr
                      key={row.id}
                      className={`hover:bg-surface-container-low transition-colors group cursor-pointer relative
                        ${isCritical ? 'bg-red-50/40' : ''}`}
                      onClick={() => navigate(`/dashboard/verification`, { state: { caseId: row.id } })}
                    >
                      <td className="py-5 px-6 relative" onClick={e => e.stopPropagation()}>
                        {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r" />}
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedIds.has(row.id)}
                          onChange={e => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(row.id); else newSet.delete(row.id);
                            setSelectedIds(newSet);
                          }}
                        />
                      </td>
                      <td className="py-5 px-4 font-mono text-xs font-bold text-on-surface tracking-wider">
                        #{row.id.toString().padStart(6, '0')}
                      </td>
                      <td className="py-5 px-4">
                        <p className="font-black text-on-surface">{row.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-label tracking-wider">{row.district}</p>
                      </td>
                      <td className="py-5 px-4 text-sm font-bold text-on-surface-variant">{row.scheme}</td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-black font-label text-sm ${row.risk_score > 90 ? 'text-red-600' : row.risk_score > 75 ? 'text-amber-600' : 'text-on-surface'}`}>
                            {row.risk_score}
                          </span>
                          <div className="w-20 h-2 bg-surface-variant/30 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full ${row.risk_score > 90 ? 'bg-red-600' : row.risk_score > 75 ? 'bg-amber-600' : 'bg-on-surface/40'}`}
                              style={{ width: `${row.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black font-label uppercase tracking-widest
                          ${row.leakage_type === 'DECEASED' ? 'bg-red-100 text-red-700' :
                            row.leakage_type === 'DUPLICATE' ? 'bg-surface-container-high text-on-surface' :
                            row.leakage_type === 'UNWITHDRAWN' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'}`}
                        >
                          {row.leakage_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-sm font-bold text-on-surface">
                        ₹{row.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); handleAssign(row.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-surface-container-high rounded-lg"
                            title="Assign"
                          >
                            <UserPlus size={14} className="text-on-surface-variant" />
                          </button>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black font-label uppercase tracking-widest
                            ${row.status === 'Flagged' ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                              row.status === 'Reviewing' ? 'bg-black text-white' :
                              row.status === 'Fraud' ? 'bg-red-100 text-red-600' :
                              row.status === 'Verified' ? 'bg-green-100 text-green-700' :
                              'bg-surface-container ring-1 ring-black/5 text-on-surface-variant'}`}
                          >
                            {row.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {caseData && caseData.pagination.pages > 1 && (
              <div className="px-8 py-4 bg-surface-container-low border-t border-outline-variant/15 flex justify-between items-center">
                <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">
                  Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, caseData.pagination.total)} of {caseData.pagination.total.toLocaleString()} cases
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 px-3 rounded-lg hover:bg-white transition-all disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-[11px] font-black font-label px-3">
                    {page} / {caseData.pagination.pages}
                  </span>
                  <button
                    disabled={page >= caseData.pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 px-3 rounded-lg hover:bg-white transition-all disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <AssignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        caseIds={assignCaseIds}
        onAssigned={onAssigned}
      />
    </div>
  );
}
