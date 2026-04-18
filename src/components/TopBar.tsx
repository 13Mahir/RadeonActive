import { Search } from 'lucide-react';
import { createContext, useContext } from 'react';

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

export { ROLE_CONFIG };

export default function TopBar() {
  const { role } = useRole();
  const config = ROLE_CONFIG[role];

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

        {/* Static role label */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-label text-[10px] font-black uppercase tracking-widest ${config.badge}`}>
          {config.title}
        </div>
      </div>
    </header>
  );
}
