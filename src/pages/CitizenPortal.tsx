import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, FileText, AlertTriangle, X, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CitizenPortal() {
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<{ aadhaar: string, mobile: string } | null>(null);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Grievance Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const sessionStr = sessionStorage.getItem('dbt_citizen_session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    
    const sessionData = JSON.parse(sessionStr);
    setCitizen(sessionData);
    
    fetchCitizenData(sessionData.aadhaar);
  }, [navigate]);

  const fetchCitizenData = async (aadhaarNumber: string) => {
    try {
      setLoading(true);
      const [txnsRes, grvsRes] = await Promise.all([
        fetch(`/api/citizens/transactions?aadhaar=${aadhaarNumber}`),
        fetch(`/api/citizens/grievances?aadhaar=${aadhaarNumber}`)
      ]);
      
      if (txnsRes.ok) setTransactions(await txnsRes.json());
      if (grvsRes.ok) setGrievances(await grvsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dbt_citizen_session');
    navigate('/login');
  };

  const openTicketModal = (txn?: any) => {
    setSelectedTxn(txn || null);
    setSubject(txn ? `Issue with Transaction for ${txn.scheme}` : '');
    setDescription('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const submitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/citizens/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar: citizen.aadhaar,
          mobile: citizen.mobile,
          transaction_id: selectedTxn?.id,
          subject,
          description
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      fetchCitizenData(citizen.aadhaar); // Refresh grievances
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  if (!citizen) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-[#0066cc] text-white px-8 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Citizen Portal</h1>
            <p className="text-white/80 text-xs font-medium">Aadhaar: xxxx-xxxx-{citizen.aadhaar.slice(-4)}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-bold shadow-sm"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8">
        
        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-amber-900">Report DBT Anomalies</h3>
            <p className="text-sm font-medium text-amber-800 mt-1">
              If you see a transaction below that you did not receive, or if you suspect identity fraud under your Aadhaar, please file a grievance immediately using the "Report Issue" button. Your ticket will be directed to the District nodal officers.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            
            {/* Left Col: Transactions */}
            <div className="col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-on-surface flex items-center gap-2">
                  <FileText size={24} className="text-[#0066cc]" />
                  Your DBT Transactions
                </h2>
              </div>
              
              <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/15 overflow-hidden">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center text-on-surface-variant font-medium">
                    No transactions found for this Aadhaar number.
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {transactions.map(txn => (
                      <div key={txn.id} className="p-6 flex items-center justify-between hover:bg-surface-container/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-black font-label py-1 px-2.5 rounded-lg bg-blue-100 text-blue-800 shrink-0">
                              {txn.scheme}
                            </span>
                            <span className="text-on-surface-variant text-xs font-medium font-mono">
                              TXN-{txn.id.toString().padStart(6, '0')}
                            </span>
                          </div>
                          <p className="font-bold text-on-surface">Credited: {txn.transaction_date}</p>
                          <p className={`text-sm font-medium ${txn.withdrawn > 0 ? 'text-green-700' : 'text-amber-600'}`}>
                            {txn.withdrawn > 0 ? `Withdrawn ₹${txn.withdrawn.toLocaleString('en-IN')}` : 'Not yet withdrawn'}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-3">
                          <p className="text-2xl font-black text-green-700">₹{txn.amount.toLocaleString('en-IN')}</p>
                          <button 
                            onClick={() => openTicketModal(txn)}
                            className="text-xs font-label uppercase tracking-widest font-black text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                          >
                            Report Issue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Grievances */}
            <div className="col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-on-surface">Tickets</h2>
                <button 
                  onClick={() => openTicketModal()}
                  className="w-8 h-8 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-lg hover:opacity-90 transition-all shadow-sm"
                >
                  +
                </button>
              </div>

              <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/15 p-5 min-h-[300px]">
                {grievances.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant/60">
                    <CheckCircle size={40} className="mb-3 opacity-20" />
                    <p className="font-medium text-sm">No active grievances</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grievances.map(g => (
                      <div key={g.id} className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black font-label uppercase px-2 py-0.5 rounded-sm tracking-widest ${
                            g.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {g.status}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                            <Clock size={10} /> {new Date(g.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-on-surface leading-snug">{g.subject}</p>
                        {g.scheme && (
                          <p className="text-xs text-on-surface-variant mt-2 font-mono">Linked: {g.scheme}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
                <h3 className="text-lg font-black text-on-surface">Raise a Grievance</h3>
                <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitGrievance} className="p-6 space-y-5">
                {submitError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
                    {submitError}
                  </div>
                )}

                {selectedTxn && (
                  <div className="bg-[#0066cc]/10 border border-[#0066cc]/20 p-4 rounded-xl">
                    <p className="text-[10px] uppercase font-black text-[#0066cc] tracking-widest mb-1">Linked Transaction</p>
                    <p className="font-bold text-sm">{selectedTxn.scheme} - ₹{selectedTxn.amount}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Date: {selectedTxn.transaction_date}</p>
                  </div>
                )}

                <div className="space-y-1.5 focus-within:text-[#0066cc]">
                  <label className="text-[10px] font-black font-label uppercase tracking-widest text-inherit">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Money not received, Wrong recipient"
                  />
                </div>

                <div className="space-y-1.5 focus-within:text-[#0066cc]">
                  <label className="text-[10px] font-black font-label uppercase tracking-widest text-inherit">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/30 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] outline-none transition-all text-sm font-medium resize-none"
                    placeholder="Please explain the issue clearly..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#0066cc] text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
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
