import { Search, Settings, LogOut } from 'lucide-react';
import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export type UserRole = 'DFO' | 'VERIFIER' | 'AUDITOR' | 'ADMIN';

export const RoleContext = createContext<{
  role: UserRole;
  setRole: (r: UserRole) => void;
}>({ role: 'DFO', setRole: () => {} });

export function useRole() {
  return useContext(RoleContext);
}

const ROLE_CONFIG: Record<UserRole, { label: string; title: string; badge: string; home: string }> = {
  DFO: { label: 'District Finance Officer', title: 'DFO Admin', badge: 'bg-black text-white', home: '/' },
  VERIFIER: { label: 'Scheme Verifier', title: 'Field Verifier', badge: 'bg-amber-600 text-white', home: '/verifier' },
  AUDITOR: { label: 'Compliance Auditor', title: 'Audit Team', badge: 'bg-blue-600 text-white', home: '/auditor' },
  ADMIN: { label: 'State DBT Administrator', title: 'State Admin', badge: 'bg-purple-600 text-white', home: '/admin' },
};

export default function TopBar() {
  const { role } = useRole();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role];

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    setRoleOpen(false);
    navigate(ROLE_CONFIG[newRole].home);
  };

  return (
    <header className="h-16 bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/10 px-8 flex items-center justify-between">
      <div className="flex-1">
        <h2 className="text-lg font-bold tracking-tight text-on-surface">Sovereign Lens</h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search cases, beneficiaries..."
            className="w-full bg-surface-container-high border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-on-surface-variant font-label"
          />
        </div>

        {/* Role Label — static, no switcher */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-label text-[10px] font-black uppercase tracking-widest ${config.badge}`}>
          {config.title}
        </div>

        <div className="flex items-center gap-2 border-l border-outline-variant/15 pl-5 h-8">
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-8 h-8 rounded-full ml-1 flex items-center justify-center font-black text-xs text-white ${config.badge.split(' ')[0]}`}
            >
              {role === 'DFO' ? 'DF' : role === 'VERIFIER' ? 'FV' : role === 'AUDITOR' ? 'AT' : 'SA'}
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 py-2 w-48 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/10">
                    <p className="text-xs font-black text-on-surface">{authUser?.full_name || config.title}</p>
                    <p className="text-[10px] text-on-surface-variant">{authUser?.staff_id || ''}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2"
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
