// src/pages/LoginPage.tsx
import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_HOME: Record<string, string> = {
  DFO: '/dashboard',
  VERIFIER: '/dashboard/verifier',
  AUDITOR: '/dashboard/auditor',
  ADMIN: '/dashboard/admin'
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      // Read user from localStorage to get role for redirect
      const storedUser = JSON.parse(localStorage.getItem('dbt_auth_user') || '{}');
      navigate(ROLE_HOME[storedUser.role] || '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  // Quick login buttons for demo
  const demoUsers = [
    { label: 'DFO Admin', username: 'dfo_admin', password: 'dfo123', color: 'bg-black text-white' },
    { label: 'Field Verifier', username: 'verifier_01', password: 'verify123', color: 'bg-amber-600 text-white' },
    { label: 'Auditor', username: 'auditor_01', password: 'audit123', color: 'bg-blue-600 text-white' },
    { label: 'State Admin', username: 'state_admin', password: 'admin123', color: 'bg-purple-600 text-white' },
  ];

  const quickLogin = async (u: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(u, p);
      const storedUser = JSON.parse(localStorage.getItem('dbt_auth_user') || '{}');
      navigate(ROLE_HOME[storedUser.role] || '/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-2 gap-0 shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-black/5">

        {/* Left — branding panel */}
        <div className="bg-black text-white p-16 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-10">
              <ShieldAlert size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter leading-tight mb-4">
              DBT Intelligence<br />System
            </h1>
            <p className="text-white/60 font-medium text-sm leading-relaxed max-w-xs">
              Government-grade fraud detection and audit intelligence for Gujarat's Direct
              Benefit Transfer program.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { stat: '4', label: 'Leakage Pattern Detectors' },
              { stat: '50K+', label: 'Transactions Processed' },
              { stat: '< 5s', label: 'Full Pipeline Runtime' },
              { stat: '100%', label: 'Gujarati-Aware Matching' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="text-2xl font-black tracking-tighter text-white/90 w-16 shrink-0">{item.stat}</span>
                <span className="text-white/50 text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-[10px] font-label uppercase tracking-widest">
            Government of Gujarat · Classified System
          </p>
        </div>

        {/* Right — login form */}
        <div className="bg-surface-container-lowest p-16 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-black tracking-tighter mb-2">Sign In</h2>
            <p className="text-on-surface-variant text-sm font-medium mb-10">
              Enter your official credentials to access the system.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. dfo_admin"
                  autoComplete="username"
                  className="w-full px-4 py-3.5 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-on-surface-variant/40 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-cta text-white py-4 rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-xl transition-all mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Authenticating...' : 'Sign In to System'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full border-2 border-black text-black py-4 rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black hover:text-white active:scale-95 transition-all mt-3"
              >
                Create Account
              </button>
            </form>

            {/* Demo quick login */}
            <div className="mt-8 pt-8 border-t border-outline-variant/15">
              <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-4 text-center">
                Demo Quick Access
              </p>
              <div className="grid grid-cols-2 gap-3">
                {demoUsers.map(u => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u.username, u.password)}
                    disabled={loading}
                    className={`py-2.5 px-4 rounded-xl font-label text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 ${u.color}`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
