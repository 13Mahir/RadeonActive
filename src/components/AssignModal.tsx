import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface Verifier {
  id: number;
  full_name: string;
  staff_id: string;
  district: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caseIds: number[];
  onAssigned: () => void;
}

export default function AssignModal({ isOpen, onClose, caseIds, onAssigned }: Props) {
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedId(null);
      setDone(false);
      api.get('/auth/verifiers')
        .then(data => setVerifiers(data.verifiers || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      for (const id of caseIds) {
        await api.post(`/cases/${id}/assign`, { investigator_id: selectedId, actor_id: 'DFO' });
      }
      setDone(true);
      setTimeout(() => {
        onAssigned();
        onClose();
      }, 1200);
    } catch {
      // handle error
    }
    setAssigning(false);
  };

  const isBulk = caseIds.length > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <UserPlus size={18} className="text-amber-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {done ? 'Assignment Complete' : 'Assign to Field Verifier'}
                  </h3>
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-gray-400">
                    {isBulk ? `${caseIds.length} cases selected` : `Case #${caseIds[0]?.toString().padStart(6, '0')}`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-80 overflow-y-auto">
              {done ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                  </motion.div>
                  <p className="font-black text-lg">
                    {isBulk ? `${caseIds.length} cases assigned` : 'Case assigned'} successfully
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    The verifier will see it in their dashboard.
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-10">
                  <Loader2 size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Loading verifiers...</p>
                </div>
              ) : verifiers.length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus size={24} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No active field verifiers found</p>
                  <p className="text-xs text-gray-400 mt-1">Add verifiers in User Management first.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-gray-400 mb-3">
                    Select a field verifier
                  </p>
                  {verifiers.map(v => (
                    <button
                      key={v.staff_id}
                      onClick={() => setSelectedId(v.staff_id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-[0.98]
                        ${selectedId === v.staff_id
                          ? 'border-amber-500 bg-amber-50 shadow-md'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0
                        ${selectedId === v.staff_id ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {v.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm">{v.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-label font-black uppercase tracking-widest text-gray-400">
                            {v.staff_id}
                          </span>
                          {v.district && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-[10px] font-label uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                <MapPin size={9} />
                                {v.district}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {selectedId === v.staff_id && (
                        <CheckCircle size={18} className="text-amber-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!done && !loading && verifiers.length > 0 && (
              <div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedId || assigning}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {assigning ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {assigning ? 'Assigning...' : isBulk ? `Assign ${caseIds.length} Cases` : 'Assign Case'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
