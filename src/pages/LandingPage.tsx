// src/pages/LandingPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShieldAlert, ShieldCheck, Search, BarChart3, Globe, ArrowRight,
  Fingerprint, Users, AlertTriangle, Zap, Lock, Eye, MapPin,
  ChevronDown, Database, Brain, TrendingUp, CheckCircle
} from 'lucide-react';

const CAPABILITIES = [
  { value: '4', label: 'Detection Engines', delay: 0 },
  { value: '<5s', label: 'Full Pipeline Runtime', delay: 0.1 },
  { value: '100%', label: 'Gujarati-Aware NLP', delay: 0.2 },
  { value: '4', label: 'Role-Based Dashboards', delay: 0.3 },
];

const DETECTORS = [
  {
    icon: AlertTriangle,
    title: 'Deceased Beneficiary',
    description: 'Cross-references death register with active payments using Aadhaar + fuzzy Gujarati name matching.',
    color: 'from-red-500 to-rose-600',
    tag: 'Death Register',
  },
  {
    icon: Fingerprint,
    title: 'Duplicate Identity',
    description: 'Detects multiple beneficiaries sharing the same Aadhaar across different schemes and districts.',
    color: 'from-slate-700 to-slate-900',
    tag: 'Aadhaar Dedup',
  },
  {
    icon: Lock,
    title: 'Unwithdrawn Funds',
    description: 'Flags ₹0-withdrawal transactions older than 90 days — potential ghost beneficiaries.',
    color: 'from-amber-500 to-orange-600',
    tag: 'Withdrawal Audit',
  },
  {
    icon: Globe,
    title: 'Cross-Scheme Duplication',
    description: 'Identifies beneficiaries enrolled in mutually exclusive schemes simultaneously.',
    color: 'from-blue-500 to-indigo-600',
    tag: 'Scheme Overlap',
  },
];

const ROLES = [
  { title: 'State Admin', desc: 'Statewide macro analytics and heatmap oversight', color: 'bg-purple-600', icon: Globe },
  { title: 'DFO Admin', desc: 'District-level investigation queue and case management', color: 'bg-black', icon: ShieldAlert },
  { title: 'Field Verifier', desc: 'Ground-level physical verification with GPS capture', color: 'bg-amber-600', icon: MapPin },
  { title: 'Audit Team', desc: 'Compliance audit trails and exportable ledgers', color: 'bg-blue-600', icon: Eye },
];

const TECH_STACK = [
  { name: 'React + Vite', desc: 'Frontend SPA' },
  { name: 'Node.js + Express', desc: 'API Server' },
  { name: 'SQLite (WAL)', desc: 'Embedded DB' },
  { name: 'Leaflet Heatmap', desc: 'District Map' },
  { name: 'Gemini AI', desc: 'Case Summaries' },
  { name: 'Gujarati NLP', desc: 'Name Matching' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 overflow-x-hidden">

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY > 40 ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-black/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <span className="text-sm font-black uppercase tracking-wider">Sovereign Lens</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-xl font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-black text-white rounded-xl font-label text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
            >
              Launch System
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/5 rounded-full mb-8">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Government of Gujarat · Active System</span>
                </div>

                <h1 className="text-[4.5rem] font-black tracking-tighter leading-[0.9] mb-6">
                  DBT Leakage<br />
                  <span className="bg-gradient-to-r from-red-600 via-amber-600 to-blue-600 bg-clip-text text-transparent">
                    Intelligence System
                  </span>
                </h1>

                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mb-10">
                  AI-powered fraud detection engine that identifies deceased beneficiary payments,
                  duplicate identities, unwithdrawn funds, and cross-scheme duplication across
                  Gujarat's Direct Benefit Transfer pipeline.
                </p>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="group px-8 py-4 bg-black text-white rounded-2xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl flex items-center gap-3"
                  >
                    Access System
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="#features"
                    className="px-8 py-4 bg-white text-slate-700 rounded-2xl font-label text-[11px] font-black uppercase tracking-widest border border-black/10 hover:border-black/20 transition-all flex items-center gap-3 shadow-sm"
                  >
                    Explore Features
                    <ChevronDown size={14} />
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Hero visual — animated cards */}
            <motion.div
              className="col-span-5 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                {/* Floating feature cards */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white rounded-3xl p-6 shadow-2xl ring-1 ring-black/5 mb-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Deceased Detection</p>
                      <p className="text-xs text-slate-500 font-medium">Aadhaar + Name Fuzzy Match</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-lg uppercase tracking-widest">Active</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="bg-white rounded-3xl p-6 shadow-xl ring-1 ring-black/5 ml-8 mb-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Lock size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Fund Withdrawal Audit</p>
                      <p className="text-xs text-slate-500 font-medium">90-Day Inactivity Threshold</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-lg uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 8 ? 'bg-amber-400' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="bg-white rounded-3xl p-6 shadow-lg ring-1 ring-black/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Globe size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Cross-Scheme Engine</p>
                      <p className="text-xs text-slate-500 font-medium">Multi-Scheme Overlap Check</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-lg uppercase tracking-widest">Active</span>
                  </div>
                </motion.div>

                {/* Decorative glow */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-red-200/30 via-amber-200/30 to-blue-200/30 rounded-full blur-3xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-4 gap-8">
          {CAPABILITIES.map((cap, idx) => (
            <motion.div
              key={cap.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: cap.delay }}
              className="text-center"
            >
              <p className="text-4xl font-black tracking-tighter mb-1">{cap.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cap.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Detection Engine ── */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Detection Engine</span>
            <h2 className="text-5xl font-black tracking-tighter mb-4">Four-Layer Risk Analysis</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              Each transaction passes through four independent detectors that cross-reference
              multiple government databases in under 5 seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-4 gap-6">
            {DETECTORS.map((det, idx) => (
              <motion.div
                key={det.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${det.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <det.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-black tracking-tight mb-2">{det.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">{det.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method</span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-lg">{det.tag}</span>
                </div>
                {/* hover glow */}
                <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${det.color} opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity duration-500`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-4">Pipeline</span>
            <h2 className="text-5xl font-black tracking-tighter mb-4">How It Works</h2>
            <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto">
              From raw CSV datasets to actionable case files in a single pipeline execution.
            </p>
          </motion.div>

          <div className="grid grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Ingest', desc: 'CSV upload of transactions and death register', icon: Database },
              { step: '02', title: 'Normalize', desc: 'Gujarati transliteration + Aadhaar dedup', icon: Brain },
              { step: '03', title: 'Detect', desc: '4-layer risk engine flags anomalies', icon: Search },
              { step: '04', title: 'Score', desc: 'Composite risk scoring (0-100)', icon: TrendingUp },
              { step: '05', title: 'Action', desc: 'Dashboard + investigation queue', icon: CheckCircle },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <span className="text-6xl font-black text-white/5 absolute top-4 right-6">{item.step}</span>
                <item.icon size={24} className="text-white/60 mb-4 group-hover:text-white transition-colors" />
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role-Based Access ── */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Access Control</span>
            <h2 className="text-5xl font-black tracking-tighter mb-4">Role-Based Intelligence</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              Four distinct interfaces tailored for each stakeholder's responsibilities in the fraud resolution chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-4 gap-6">
            {ROLES.map((role, idx) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-black/5 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 ${role.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <role.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-black tracking-tight mb-2">{role.title}</h3>
                <p className="text-sm text-slate-400 font-medium">{role.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="py-16 px-8 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Technology</span>
              <h3 className="text-2xl font-black tracking-tight">Built With</h3>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="bg-white rounded-2xl p-5 ring-1 ring-black/5 text-center hover:shadow-md transition-all">
                <p className="text-sm font-black mb-0.5">{tech.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-black text-white rounded-[3rem] p-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, #ef4444 0%, transparent 50%), radial-gradient(circle at 70% 50%, #3b82f6 0%, transparent 50%)',
            }} />
            <div className="relative">
              <h2 className="text-5xl font-black tracking-tighter mb-4">Ready to audit?</h2>
              <p className="text-white/50 font-medium mb-10 max-w-lg mx-auto">
                Access the system as any of the 4 roles using demo credentials.
                No installation required — runs entirely in-browser.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="group px-10 py-5 bg-white text-black rounded-2xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-2xl inline-flex items-center gap-3"
              >
                Launch Intelligence System
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Sovereign Lens · DBT Intelligence System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Team RadeonActive</span>
            <span className="text-white/20">—</span>
            <span className="text-[10px] font-bold text-white/70">Krish Kotadia <span className="text-[9px] font-black text-white/40 ml-0.5">(Lead)</span></span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] font-bold text-white/70">Mahir Shah</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] font-bold text-white/70">Vishwa Shah</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] font-bold text-white/70">Sachi Patel</span>
          </div>
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">LDCE Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
