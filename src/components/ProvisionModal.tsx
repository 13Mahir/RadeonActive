import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProvisionModal({ isOpen, onClose, onSuccess }: ProvisionModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({ name: '', role: 'VERIFIER', district: 'Ahmedabad' });
  const [newCredentials, setNewCredentials] = useState({ username: '', staffId: '' });

  const handleGenerate = async () => {
    if (!formData.name) return;
    setStep('processing');
    try {
      const res: any = await api.post('/users', formData);
      setNewCredentials({ username: res.username, staffId: res.staffId });
      setTimeout(() => {
        setStep('success');
      }, 1500);
    } catch (err) {
      console.error(err);
      setStep('form');
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    setStep('form');
    setFormData({ name: '', role: 'VERIFIER', district: 'Ahmedabad' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={step === 'processing' ? undefined : handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-gray-900">Provision Staff</h3>
                <p className="text-[11px] font-label uppercase tracking-widest text-gray-500 mt-1">Identity & Access Management</p>
              </div>
              {step !== 'processing' && (
                <button onClick={handleClose} className="p-2 hover:bg-gray-200 text-gray-900 rounded-full transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Form Step */}
            {step === 'form' && (
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">System Role</label>
                    <select 
                      value={formData.role} 
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="VERIFIER">Field Verifier</option>
                      <option value="AUDITOR">Compliance Auditor</option>
                      <option value="DFO">DFO Admin</option>
                      <option value="ADMIN">State Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Jurisdiction</label>
                    <select 
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-black"
                    >
                      {['Statewide', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={!formData.name}
                    onClick={handleGenerate}
                    className="w-full py-4 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:active:scale-100"
                  >
                    <UserPlus size={16} />
                    Create Secure Profile
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="p-16 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-100 rounded-full animate-ping opacity-75" />
                  <div className="relative w-20 h-20 bg-gray-50 text-black rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Generating Credentials...</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2">Writing to SQLite Keycloak system.</p>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="p-16 flex flex-col items-center justify-center text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} type="spring"
                  className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-lg border border-green-100"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2">
                    Profile Initialized <Sparkles size={20} className="text-amber-500" />
                  </h3>
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left w-full max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Staff ID</span>
                      <span className="font-mono text-sm font-bold">{newCredentials.staffId}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Username</span>
                      <span className="font-mono text-sm font-bold text-blue-600">{newCredentials.username}</span>
                    </div>
                     <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</span>
                      <span className="font-mono text-sm font-bold">password123</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                >
                  Close & Refresh Roster
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
