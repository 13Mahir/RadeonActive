// src/pages/LoginPage.tsx
import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Loader2, AlertTriangle, LayoutDashboard, ShieldCheck, FileSearch, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, GoogleProfile } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

// ── Google Icon SVG (official Google brand colors) ──────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Role selection cards shown to new Google users ───────────────────────────
const ROLE_OPTIONS = [
  {
    role: 'DFO' as const,
    label: 'District Finance Officer',
    shortLabel: 'DFO Admin',
    description: 'Manages investigation queue, assigns cases, exports audit reports',
    icon: LayoutDashboard,
    color: 'bg-black',
    home: '/dashboard'
  },
  {
    role: 'VERIFIER' as const,
    label: 'Field Verifier',
    shortLabel: 'Field Verifier',
    description: 'Receives assigned cases, conducts field visits, submits GPS verification',
    icon: ShieldCheck,
    color: 'bg-amber-600',
    home: '/dashboard/verifier'
  },
  {
    role: 'AUDITOR' as const,
    label: 'Compliance Auditor',
    shortLabel: 'Auditor',
    description: 'Queries cross-scheme flags, generates compliance summaries',
    icon: FileSearch,
    color: 'bg-blue-600',
    home: '/dashboard/auditor'
  },
  {
    role: 'ADMIN' as const,
    label: 'State DBT Administrator',
    shortLabel: 'State Admin',
    description: 'Configures leakage rules, views state-level heatmaps, manages users',
    icon: Settings,
    color: 'bg-purple-600',
    home: '/dashboard/admin'
  },
];

// ── Role home map ─────────────────────────────────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  DFO: '/dashboard',
  VERIFIER: '/dashboard/verifier',
  AUDITOR: '/dashboard/auditor',
  ADMIN: '/dashboard/admin'
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Existing form state (unchanged)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null);
  const [roleSelectLoading, setRoleSelectLoading] = useState<string | null>(null);
  // googleProfile !== null means we're on the role-select screen

  // ── Existing handlers (unchanged) ─────────────────────────────────────────
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
      const storedUser = JSON.parse(sessionStorage.getItem('dbt_auth_user') || '{}');
      navigate(ROLE_HOME[storedUser.role] || '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  // ── Google OAuth handler ────────────────────────────────────────────────────
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError(null);
      try {
        // Fetch user profile from Google using access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        if (!userInfoRes.ok) throw new Error('Failed to fetch Google profile');
        const userInfo = await userInfoRes.json() as {
          sub: string; email: string; name: string; picture: string; email_verified: boolean;
        };

        // POST to our backend with the user info directly
        const response = await fetch('/api/auth/google-userinfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_id: userInfo.sub,
            email: userInfo.email,
            full_name: userInfo.name,
            avatar_url: userInfo.picture,
            email_verified: userInfo.email_verified
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Google sign-in failed');
        }

        const data = await response.json();

        if (data.registered) {
          // Existing user — store session and navigate
          sessionStorage.setItem('dbt_auth_token', data.token);
          sessionStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
          // Force full reload to sync auth context
          window.location.href = ROLE_HOME[data.user.role] || '/dashboard';
        } else {
          // New user — show role selection
          setGoogleProfile(data.google_profile);
        }
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed. Try again.');
      }
      setGoogleLoading(false);
    },
    onError: (err) => {
      console.error('Google OAuth error:', err);
      setError('Google sign-in was cancelled or failed. Please try again.');
      setGoogleLoading(false);
    },
    flow: 'implicit'
  });

  // ── Role selection handler (for new Google users) ──────────────────────────
  const handleRoleSelect = async (role: string, home: string) => {
    if (!googleProfile) return;
    setRoleSelectLoading(role);
    setError(null);
    try {
      const response = await fetch('/api/auth/google/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, google_profile: googleProfile })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Registration failed');
      }

      const data = await response.json();
      sessionStorage.setItem('dbt_auth_token', data.token);
      sessionStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
      window.location.href = home;
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Try again.');
    }
    setRoleSelectLoading(null);
  };



  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-2 gap-0 shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-black/5">

        {/* ── Left — branding panel (unchanged) ─────────────────────────────── */}
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

        {/* ── Right — login form OR role selection ────────────────────────── */}
        <div className="bg-surface-container-lowest flex flex-col justify-center overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── SCREEN A: Normal login form (shown when googleProfile is null) ── */}
            {!googleProfile && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-16"
              >
                <h2 className="text-3xl font-black tracking-tighter mb-2">Sign In</h2>
                <p className="text-on-surface-variant text-sm font-medium mb-8">
                  Enter your official credentials to access the system.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm font-bold text-red-700">{error}</p>
                  </div>
                )}

                {/* Google Sign-In Button — NEW */}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setGoogleLoading(true);
                    triggerGoogleLogin();
                  }}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-outline-variant/30 rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:border-black/40 hover:shadow-md active:scale-95 transition-all disabled:opacity-50 mb-4 shadow-sm"
                >
                  {googleLoading
                    ? <Loader2 size={16} className="animate-spin text-on-surface-variant" />
                    : <GoogleIcon />
                  }
                  {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-outline-variant/20" />
                  <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">or</span>
                  <div className="flex-1 h-px bg-outline-variant/20" />
                </div>

                {/* Username/Password form (completely unchanged) */}
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


              </motion.div>
            )}

            {/* ── SCREEN B: Role selection (shown after Google sign-in for new user) ── */}
            {googleProfile && (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-12"
              >
                {/* User's Google profile preview */}
                <div className="flex items-center gap-4 mb-8 p-4 bg-surface-container-high rounded-2xl">
                  {googleProfile.avatar_url ? (
                    <img
                      src={googleProfile.avatar_url}
                      alt={googleProfile.full_name}
                      className="w-12 h-12 rounded-full ring-2 ring-black/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-black text-sm">
                      {googleProfile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-sm text-on-surface">{googleProfile.full_name}</p>
                    <p className="text-[11px] text-on-surface-variant">{googleProfile.email}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-black tracking-tighter mb-1">Welcome to the System</h2>
                <p className="text-on-surface-variant text-sm font-medium mb-8">
                  First time here. Select your role to set up your account.
                </p>

                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm font-bold text-red-700">{error}</p>
                  </div>
                )}

                {/* 4 Role selection buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {ROLE_OPTIONS.map(option => {
                    const isLoading = roleSelectLoading === option.role;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.role}
                        onClick={() => handleRoleSelect(option.role, option.home)}
                        disabled={roleSelectLoading !== null}
                        className={`${option.color} text-white p-5 rounded-2xl text-left flex flex-col gap-3 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-lg`}
                      >
                        <div className="flex items-center justify-between">
                          {isLoading
                            ? <Loader2 size={20} className="animate-spin" />
                            : <Icon size={20} />
                          }
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-wide leading-tight">
                            {option.shortLabel}
                          </p>
                          <p className="text-[10px] font-medium text-white/70 mt-1 leading-tight">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleProfile(null);
                    setError(null);
                  }}
                  className="mt-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors w-full text-center"
                >
                  ← Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
