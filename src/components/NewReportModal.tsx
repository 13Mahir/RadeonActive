import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewReportModal({ isOpen, onClose }: ReportModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleGenerate = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  const handleClose = () => {
    setStep('form');
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
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-blue-900">New Investigation Report</h3>
                <p className="text-[11px] font-label uppercase tracking-widest text-blue-600/70 mt-1">Audit Bureau Data Extraction</p>
              </div>
              {step !== 'processing' && (
                <button onClick={handleClose} className="p-2 hover:bg-blue-100 text-blue-900 rounded-full transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Form Step */}
            {step === 'form' && (
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Report Title</label>
                  <input 
                    type="text" defaultValue="Q4 Compliance & Leakage Audit"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Target Scope</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-blue-600">
                      <option>Statewide Audit</option>
                      <option>District Analysis</option>
                      <option>Scheme Sub-Audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Priority Level</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 outline-none focus:ring-2 focus:ring-blue-600">
                      <option>Critical (Immediate)</option>
                      <option>High Priority</option>
                      <option>Standard Review</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black font-label uppercase tracking-widest text-gray-500 mb-2">Analysis Dimensions</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Deceased Matches', 'Aadhaar Duplication', 'Unwithdrawn Funds', 'Cross-Scheme Variance'].map(dim => (
                      <label key={dim} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                        <span className="text-xs font-bold text-gray-700">{dim}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGenerate}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                  >
                    <FileText size={16} />
                    Initialize Report Generation
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="p-16 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75" />
                  <div className="relative w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-lg border border-blue-100">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Compiling Intel...</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2">Aggregating cross-scheme data and risk telemetry.</p>
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
                    Report Created <Sparkles size={20} className="text-amber-500" />
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-2 px-6">The custom investigation report has been securely initialized and added to your active dashboard.</p>
                </div>
                <button
                  onClick={handleClose}
                  className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                >
                  Close Wizard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
