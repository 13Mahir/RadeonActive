import { LayoutDashboard, ShieldCheck, Landmark, BarChart3, Users, HelpCircle, Archive, Plus, ShieldAlert, Upload, ClipboardCheck, FileSearch, Settings, Globe, MapPin, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRole, UserRole } from './TopBar';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

type NavItem = { icon: any; label: string; path: string };

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  DFO: [
    { icon: LayoutDashboard, label: 'Intelligence Hub', path: '/' },
    { icon: ShieldAlert, label: 'Investigation Queue', path: '/investigation' },
    { icon: ShieldCheck, label: 'Scheme Verification', path: '/verification' },
    { icon: Landmark, label: 'Audit Ledger', path: '/ledger' },
    { icon: BarChart3, label: 'Leakage Analytics', path: '/analytics' },
    { icon: Upload, label: 'Data Ingestion', path: '/upload' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  VERIFIER: [
    { icon: ClipboardCheck, label: 'My Assignments', path: '/verifier' },
    { icon: MapPin, label: 'Field Verification', path: '/verification' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  AUDITOR: [
    { icon: FileSearch, label: 'Audit Console', path: '/auditor' },
    { icon: Landmark, label: 'Pattern Analysis', path: '/ledger' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  ADMIN: [
    { icon: Settings, label: 'System Admin', path: '/admin' },
    { icon: LayoutDashboard, label: 'DFO Dashboard', path: '/' },
    { icon: ShieldAlert, label: 'Investigation Queue', path: '/investigation' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Upload, label: 'Data Ingestion', path: '/upload' },
    { icon: Globe, label: 'State Heatmap', path: '/admin' },
    { icon: Settings, label: 'Settings', path: '/settings' },
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
    <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className={`w-10 h-10 ${roleColor[role]} rounded-xl flex items-center justify-center`}>
          <ShieldCheck className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-wider">{header.title}</h1>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{header.subtitle}</p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <button className={`w-full ${roleColor[role]} text-white rounded-xl py-3 font-label text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 hover:opacity-90 transition-all active:scale-95 shadow-lg`}>
          <Plus size={16} />
          {role === 'VERIFIER' ? 'Start Visit' : role === 'AUDITOR' ? 'New Report' : role === 'ADMIN' ? 'System Config' : 'New Investigation'}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            end={item.path === '/' || item.path === '/verifier' || item.path === '/auditor' || item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-label text-[11px] font-black uppercase tracking-widest transition-all group
              ${isActive
                ? `${roleColor[role]} text-white shadow-lg`
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <item.icon size={18} className="transition-transform group-hover:scale-110" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 mt-auto space-y-1.5 border-t border-outline-variant/10 pt-4">
        <NavLink
          to="/users"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          <HelpCircle size={18} />
          Support
        </NavLink>
        <NavLink
          to="/users"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all"
        >
          <Archive size={18} />
          Archive
        </NavLink>
      </div>

      <div className="p-4 border-t border-outline-variant/10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${roleColor[role]}/10 flex items-center justify-center`}>
            <Users size={18} className="text-on-surface-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">
              {authUser?.full_name || (role === 'DFO' ? 'DFO Admin' : role === 'VERIFIER' ? 'Field Agent' : role === 'AUDITOR' ? 'Audit Officer' : 'State Admin')}
            </p>
            <p className="text-[10px] text-on-surface-variant">{authUser?.staff_id || stableId}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-label text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all active:scale-95"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
