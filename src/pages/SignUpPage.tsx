import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Eye, EyeOff, Loader2, AlertTriangle, UserPlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME: Record<string, string> = {
  DFO: '/dashboard',
  VERIFIER: '/dashboard/verifier',
  AUDITOR: '/dashboard/auditor',
  ADMIN: '/dashboard/admin'
};

const ROLES = [
  { value: 'VERIFIER', label: 'Field Verifier', color: 'bg-amber-600', desc: 'Conduct field visits & verify beneficiaries' },
  { value: 'AUDITOR', label: 'Auditor', color: 'bg-blue-600', desc: 'Review cases & generate audit reports' },
  { value: 'DFO', label: 'District Finance Officer', color: 'bg-black', desc: 'Manage investigations & oversee schemes' },
  { value: 'ADMIN', label: 'State Admin', color: 'bg-purple-600', desc: 'Full system administration access' },
];

const DISTRICTS = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar'];

export default function SignUpPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    role: '',
    district: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.username.trim() || !form.password.trim() || !form.role) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth data and navigate
      localStorage.setItem('dbt_auth_token', data.token);
      localStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
      // Re-login to sync context
      await login(form.username, form.password);
      navigate(ROLE_HOME[form.role] || '/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

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
              Join the DBT<br />Intelligence Network
            </h1>
            <p className="text-white/60 font-medium text-sm leading-relaxed max-w-xs">
              Register as a new officer to access Gujarat's fraud detection
              and audit intelligence platform.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { stat: '4', label: 'Role-Based Dashboards' },
              { stat: '10+', label: 'District Coverage' },
              { stat: 'AI', label: 'Powered Investigation Briefs' },
              { stat: '24/7', label: 'Real-Time Monitoring' },
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

        {/* Right — sign up form */}
        <div className="bg-surface-container-lowest p-12 flex flex-col justify-center overflow-y-auto max-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </button>

            <h2 className="text-3xl font-black tracking-tighter mb-2">Create Account</h2>
            <p className="text-on-surface-variant text-sm font-medium mb-8">
              Register as a new officer in the DBT Intelligence System.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => update('username', e.target.value)}
                  placeholder="e.g. rajesh_kumar"
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Min 4 characters"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-on-surface-variant/40 pr-12"
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

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => update('role', r.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all active:scale-[0.98]
                        ${form.role === r.value
                          ? 'border-black bg-gray-50 shadow-md'
                          : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                        <span className="text-xs font-black">{r.label}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  District (optional)
                </label>
                <select
                  value={form.district}
                  onChange={e => update('district', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 transition-all"
                >
                  <option value="">Select district...</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-cta text-white py-4 rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-xl transition-all mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-on-surface-variant mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-black text-black hover:underline">
                Sign In
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
