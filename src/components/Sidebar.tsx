import { LayoutDashboard, ShieldCheck, Landmark, BarChart3, Users, HelpCircle, Archive, Plus, ShieldAlert, Upload, ClipboardCheck, FileSearch, Settings, Globe, MapPin, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRole, UserRole } from './TopBar';
import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

import NewReportModal from './NewReportModal';

type NavItem = { icon: any; label: string; path: string };

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  DFO: [
    { icon: LayoutDashboard, label: 'Intelligence Hub', path: '/dashboard' },
    { icon: ShieldAlert, label: 'Investigation Queue', path: '/dashboard/investigation' },
    { icon: ShieldCheck, label: 'Scheme Verification', path: '/dashboard/verification' },
    { icon: Landmark, label: 'Audit Ledger', path: '/dashboard/ledger' },
    { icon: BarChart3, label: 'Leakage Analytics', path: '/dashboard/analytics' },
    { icon: Upload, label: 'Data Ingestion', path: '/dashboard/upload' },
    { icon: Users, label: 'User Management', path: '/dashboard/users' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  VERIFIER: [
    { icon: ClipboardCheck, label: 'My Assignments', path: '/dashboard/verifier' },
    { icon: MapPin, label: 'Field Verification', path: '/dashboard/verification' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  AUDITOR: [
    { icon: FileSearch, label: 'Audit Console', path: '/dashboard/auditor' },
    { icon: Landmark, label: 'Pattern Analysis', path: '/dashboard/ledger' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  ADMIN: [
    { icon: Settings, label: 'System Admin', path: '/dashboard/admin' },
    { icon: Globe, label: 'State Heatmap', path: '/dashboard/admin' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Upload, label: 'Data Ingestion', path: '/dashboard/upload' },
    { icon: Users, label: 'User Management', path: '/dashboard/users' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
};

const ROLE_HEADER: Record<UserRole, { title: string; subtitle: string }> = {
  DFO: { title: 'Intelligence Unit', subtitle: 'District Finance Officer' },
  VERIFIER: { title: 'Field Console', subtitle: 'Scheme Verifier' },
  AUDITOR: { title: 'Audit Bureau', subtitle: 'Compliance Auditor' },
  ADMIN: { title: 'Control Center', subtitle: 'State DBT Admin' },
};

export default function Sidebar() {
  const { role } = useRole();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stableIdRef = useRef(`IU-${Math.floor(Math.random() * 9000 + 1000)}`);
  const stableId = stableIdRef.current;
  const navItems = NAV_BY_ROLE[role];
  const header = ROLE_HEADER[role];

  const roleColor: Record<UserRole, string> = {
    DFO: 'bg-black',
    VERIFIER: 'bg-amber-600',
    AUDITOR: 'bg-blue-600',
    ADMIN: 'bg-purple-600',
  };

  return (
    <>
      <NewReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 288 }} 
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col h-screen sticky top-0 relative z-50 shrink-0"
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-outline-variant/20 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 hover:scale-105 transition-all z-50"
        >
          {isCollapsed ? <ChevronRight size={14} className="text-gray-600" /> : <ChevronLeft size={14} className="text-gray-600" />}
        </button>

        <div className={`p-6 flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className={`w-10 h-10 shrink-0 ${roleColor[role]} rounded-xl flex items-center justify-center`}>
            <ShieldCheck className="text-white" size={20} />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <h1 className="text-sm font-black uppercase tracking-wider">{header.title}</h1>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{header.subtitle}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`px-4 mb-4 ${isCollapsed ? 'px-3' : ''}`}>
          <button 
            onClick={() => {
              if (role === 'AUDITOR') {
                setShowReportModal(true);
              } else if (role === 'DFO') {
                navigate('/dashboard/investigation');
            } else if (role === 'VERIFIER') {
              navigate('/dashboard/verifier');
            } else if (role === 'ADMIN') {
              navigate('/dashboard/admin');
            }
          }}
          title={isCollapsed ? (role === 'VERIFIER' ? 'Start Visit' : role === 'AUDITOR' ? 'New Report' : role === 'ADMIN' ? 'System Config' : 'New Investigation') : undefined}
          className={`w-full ${roleColor[role]} text-white rounded-xl py-3 font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 hover:opacity-90 transition-all active:scale-95 shadow-lg ${isCollapsed ? 'px-0' : ''}`}
        >
          <Plus size={16} />
          {!isCollapsed && <span>{role === 'VERIFIER' ? 'Start Visit' : role === 'AUDITOR' ? 'New Report' : role === 'ADMIN' ? 'System Config' : 'New Investigation'}</span>}
        </button>
      </div>

      <nav className={`flex-1 px-3 space-y-1.5 overflow-y-auto ${isCollapsed ? 'overflow-x-hidden' : ''}`}>
        {navItems.map(item => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            title={isCollapsed ? item.label : undefined}
            end={item.path === '/dashboard' || item.path === '/dashboard/verifier' || item.path === '/dashboard/auditor' || item.path === '/dashboard/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-label text-[11px] font-black uppercase tracking-widest transition-all group whitespace-nowrap
              ${isActive
                ? `${roleColor[role]} text-white shadow-lg`
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 mt-auto space-y-1.5 border-t border-outline-variant/10 pt-4">
        <NavLink
            to="/dashboard/support"
            title={isCollapsed ? "Support" : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all whitespace-nowrap ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <HelpCircle size={18} className="shrink-0" />
            {!isCollapsed && <span>Support</span>}
          </NavLink>
          <NavLink
            to="/dashboard/users"
            title={isCollapsed ? "Archive" : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all whitespace-nowrap ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Archive size={18} className="shrink-0" />
            {!isCollapsed && <span>Archive</span>}
          </NavLink>
      </div>

      <div className={`p-4 border-t border-outline-variant/10 ${isCollapsed ? 'flex flex-col items-center gap-3 px-2' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${roleColor[role]}/10 flex items-center justify-center shrink-0`}>
              <Users size={18} className="text-on-surface-variant" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {authUser?.full_name || (role === 'DFO' ? 'DFO Admin' : role === 'VERIFIER' ? 'Field Agent' : role === 'AUDITOR' ? 'Audit Officer' : 'State Admin')}
              </p>
              <p className="text-[10px] text-on-surface-variant">{authUser?.staff_id || stableId}</p>
            </div>
          </div>
        ) : (
          <div className={`w-10 h-10 mb-2 rounded-full ${roleColor[role]}/10 flex items-center justify-center shrink-0`} title={authUser?.full_name}>
            <Users size={18} className="text-on-surface-variant" />
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/'); }}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-label text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all active:scale-95 whitespace-nowrap ${isCollapsed ? 'w-10 h-10 p-0 rounded-full' : 'w-full'}`}
        >
          <LogOut size={14} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.aside>
    </>
  );
}
