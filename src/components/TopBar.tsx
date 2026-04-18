import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { useState, createContext, useContext } from 'react';

// Role context for the app
export type UserRole = 'DFO' | 'VERIFIER' | 'AUDITOR';

export const RoleContext = createContext<{
  role: UserRole;
  setRole: (r: UserRole) => void;
}>({ role: 'DFO', setRole: () => {} });

export function useRole() {
  return useContext(RoleContext);
}

const ROLE_CONFIG: Record<UserRole, { label: string; title: string; badge: string }> = {
  DFO: { label: 'District Finance Officer', title: 'DFO Admin', badge: 'bg-black text-white' },
  VERIFIER: { label: 'Field Verifier', title: 'Scheme Verifier', badge: 'bg-amber-600 text-white' },
  AUDITOR: { label: 'State Auditor', title: 'Read-Only Audit', badge: 'bg-blue-600 text-white' },
};

export default function TopBar() {
  const { role, setRole } = useRole();
  const [roleOpen, setRoleOpen] = useState(false);
  const config = ROLE_CONFIG[role];

  return (
    <header className="h-20 bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/10 px-8 flex items-center justify-between">
      <div className="flex-1">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">Sovereign Lens</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search cases, beneficiaries..."
            className="w-full bg-surface-container-high border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-on-surface-variant font-label"
          />
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-label text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${config.badge}`}
          >
            {config.title}
            <ChevronDown size={12} className={`transition-transform ${roleOpen ? 'rotate-180' : ''}`} />
          </button>

          {roleOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 py-2 w-56 z-50 animate-in fade-in slide-in-from-top-2">
              {(Object.entries(ROLE_CONFIG) as [UserRole, typeof config][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setRole(key); setRoleOpen(false); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface-container-low transition-colors ${role === key ? 'bg-surface-container-high' : ''}`}
                >
                  <div>
                    <p className="text-xs font-black">{cfg.title}</p>
                    <p className="text-[10px] text-on-surface-variant">{cfg.label}</p>
                  </div>
                  {role === key && <div className="w-2 h-2 bg-black rounded-full" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-outline-variant/15 pl-6 h-8">
          <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors relative active:scale-90 duration-200">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
          </button>
          <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors active:scale-90 duration-200">
            <Settings size={20} />
          </button>
          <div className="w-10 h-10 rounded-full ml-2 border-2 border-outline-variant/15 p-0.5 bg-surface-container-high flex items-center justify-center font-black text-sm text-on-surface">
            {role === 'DFO' ? 'DFO' : role === 'VERIFIER' ? 'FV' : 'SA'}
          </div>
        </div>
      </div>
    </header>
  );
}
