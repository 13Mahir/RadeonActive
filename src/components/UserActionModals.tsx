import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, CheckCircle2, Loader2, Shield, Key, AlertTriangle, Clock, FileSearch, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

// ─── Edit Profile Modal ─────────────────────────────────────────────────────
export function EditProfileModal({ user, isOpen, onClose, onSuccess }: {
  user: any; isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.patch(`/users/${user.id}`, { name, district });
    setSaving(false);
    setDone(true);
    setTimeout(() => { setDone(false); onSuccess(); onClose(); }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-gray-600" />
                <div>
                  <h3 className="font-black text-gray-900">Edit Profile</h3>
                  <p className="text-[10px] font-label uppercase tracking-widest text-gray-500">{user?.id}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full"><X size={16} /></button>
            </div>
            {done ? (
              <div className="p-10 flex flex-col items-center gap-4">
                <CheckCircle2 size={40} className="text-green-500" />
                <p className="font-black text-gray-900">Profile Updated!</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Jurisdiction</label>
                  <select value={district} onChange={e => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black">
                    {['Statewide', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={handleSave} disabled={saving || !name}
                  className="w-full py-3.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save Changes
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Reset Credentials Modal ────────────────────────────────────────────────
export function ResetCredentialsModal({ user, isOpen, onClose }: {
  user: any; isOpen: boolean; onClose: () => void;
}) {
  const [step, setStep] = useState<'confirm' | 'loading' | 'done'>('confirm');
  const [newPassword, setNewPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const handleReset = async () => {
    setStep('loading');
    const res: any = await api.post(`/users/${user.id}/reset-credentials`, {});
    setNewPassword(res.newPassword);
    setStep('done');
  };

  const handleClose = () => { setStep('confirm'); setNewPassword(''); setVisible(false); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 'loading' ? undefined : handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50">
              <div className="flex items-center gap-3">
                <Key size={18} className="text-amber-600" />
                <div>
                  <h3 className="font-black text-gray-900">Reset Credentials</h3>
                  <p className="text-[10px] font-label uppercase tracking-widest text-gray-500">{user?.name}</p>
                </div>
              </div>
              {step !== 'loading' && <button onClick={handleClose} className="p-1.5 hover:bg-amber-100 rounded-full"><X size={16} /></button>}
            </div>
            {step === 'confirm' && (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-gray-700">This will immediately invalidate the current password. A new temporary password will be generated.</p>
                </div>
                <button onClick={handleReset} className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95">
                  Generate New Password
                </button>
              </div>
            )}
            {step === 'loading' && (
              <div className="p-10 flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-gray-400" />
                <p className="font-black text-gray-500 text-sm">Generating secure credential...</p>
              </div>
            )}
            {step === 'done' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-black text-sm"><CheckCircle2 size={18} /> Password reset successful</div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">New Temporary Password</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="font-mono text-base font-black tracking-widest text-blue-600">
                      {visible ? newPassword : '••••••••••'}
                    </code>
                    <button onClick={() => setVisible(!visible)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                      {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium">User must change this on next login.</p>
                <button onClick={handleClose} className="w-full py-3 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest">Done</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Audit Trail Modal ──────────────────────────────────────────────────────
export function AuditTrailModal({ user, isOpen, onClose }: {
  user: any; isOpen: boolean; onClose: () => void;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const res: any = await api.get(`/users/${user.id}/audit-trail`);
    setLogs(res.logs || []);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ marginTop: 0 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onAnimationComplete={loadLogs}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
              <div className="flex items-center gap-3">
                <FileSearch size={18} className="text-blue-600" />
                <div>
                  <h3 className="font-black text-gray-900">Audit Trail</h3>
                  <p className="text-[10px] font-label uppercase tracking-widest text-gray-500">{user?.name} • {user?.id}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-blue-100 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10">
                  <Shield size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">No audit activity found for this user.</p>
                  <p className="text-xs text-gray-300 mt-1">Activity is recorded when the user verifies or actions a case.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900">{log.action} — Case #{log.case_id}</p>
                        {log.beneficiary_name && <p className="text-xs text-gray-500 font-medium">{log.beneficiary_name}</p>}
                        {log.new_value && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{log.new_value}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Suspend Confirm Modal ──────────────────────────────────────────────────
export function SuspendModal({ user, isOpen, onClose, onSuccess }: {
  user: any; isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isSuspended = user?.status === 'Suspended';

  const handleAction = async () => {
    setLoading(true);
    await api.patch(`/users/${user.id}/suspend`, {});
    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`p-6 border-b border-gray-100 ${isSuspended ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-black text-gray-900 text-lg">{isSuspended ? 'Restore Access' : 'Suspend Access'}</h3>
              <p className="text-[10px] font-label uppercase tracking-widest text-gray-500 mt-1">{user?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-gray-700">
                {isSuspended
                  ? `This will restore login access for ${user?.name}. They will be able to use the system immediately.`
                  : `This will immediately revoke login access for ${user?.name}. All active sessions will be terminated.`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onClose} className="py-3 border border-gray-200 rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAction} disabled={loading}
                  className={`py-3 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50 ${isSuspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isSuspended ? 'Restore' : 'Suspend'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
