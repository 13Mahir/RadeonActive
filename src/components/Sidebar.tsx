import { LayoutDashboard, ReceiptText, ShieldCheck, Landmark, BarChart3, Users, HelpCircle, Archive, Plus, ShieldAlert, Upload } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Intelligence Hub', path: '/' },
    { icon: ShieldAlert, label: 'Investigation Queue', path: '/investigation' },
    { icon: ShieldCheck, label: 'Scheme Verification', path: '/verification' },
    { icon: Landmark, label: 'Audit Ledger', path: '/ledger' },
    { icon: BarChart3, label: 'Leakage Analytics', path: '/analytics' },
    { icon: Upload, label: 'Data Ingestion', path: '/upload' },
    { icon: Users, label: 'User Management', path: '/users' },
  ];

  const footerItems = [
    { icon: HelpCircle, label: 'Support', path: '#' },
    { icon: Archive, label: 'Archive', path: '#' },
  ];

  return (
    <aside className="w-72 bg-surface-container-low h-screen sticky left-0 top-0 flex flex-col p-6 border-r border-outline-variant/15">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 rounded-lg gradient-cta flex items-center justify-center text-white scale-110 shadow-lg">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight uppercase tracking-tighter">Intelligence Unit</h2>
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest font-label">Official Auditor</p>
        </div>
      </div>

      <button className="w-full gradient-cta text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-sm shadow-xl hover:opacity-90 transition-all active:scale-95 mb-10 group">
        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
        <span className="font-label uppercase tracking-wider text-[11px]">New Investigation</span>
      </button>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 py-3 px-4 rounded-xl transition-all font-label font-semibold text-[11px] uppercase tracking-wider
              ${isActive 
                ? 'bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-outline-variant/10 border-r-4 border-black' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }
            `}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        {footerItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className="flex items-center gap-4 py-3 px-4 text-on-surface-variant hover:text-on-surface transition-colors font-label font-semibold text-[11px] uppercase tracking-wider"
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </a>
        ))}
        <div className="pt-4 border-t border-outline-variant/15 mt-4">
          <div className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 bg-surface-container-high flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface leading-none">Admin Profile</p>
              <p className="text-[9px] text-on-surface-variant mt-0.5 font-label">ID: IU-8839</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
