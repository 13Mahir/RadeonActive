import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Shield, MoreVertical, Search, Filter, Key, CheckCircle, XCircle, Settings, FileSearch, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import ProvisionModal from '../components/ProvisionModal';
import { EditProfileModal, ResetCredentialsModal, AuditTrailModal, SuspendModal } from '../components/UserActionModals';

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, verifiers: 0, pending: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'edit' | 'audit' | 'reset' | 'suspend'>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const openModal = (modal: 'edit' | 'audit' | 'reset' | 'suspend', user: any) => {
    setSelectedUser(user);
    setActiveModal(modal);
    setOpenMenuId(null);
  };
  const closeModal = () => { setActiveModal(null); setSelectedUser(null); };

  const loadUsers = () => {
    setLoading(true);
    api.get('/users').then((data: any) => {
      setUsers(data.users || []);
      setStats(data.stats || { totalActive: 0, verifiers: 0, pending: 0, suspended: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <ProvisionModal 
        isOpen={showProvisionModal} 
        onClose={() => setShowProvisionModal(false)}
        onSuccess={() => loadUsers()}
      />
      <div className="p-10 space-y-10" onClick={() => {
        if (openMenuId) setOpenMenuId(null);
        if (showFilterMenu) setShowFilterMenu(false);
      }}>
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">User Management</h1>
            <p className="text-on-surface-variant font-medium max-w-2xl">
              Access control panel for managing District Finance Officers, Field Verifiers, and Audit Teams.
            </p>
          </div>
          <button 
            onClick={() => setShowProvisionModal(true)}
            className="px-5 py-2.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 shadow-lg"
          >
            <UserPlus size={16} />
            Provision New User
          </button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Active Staff', value: loading ? '-' : stats.totalActive, icon: Shield, color: 'text-blue-600' },
          { label: 'Field Verifiers', value: loading ? '-' : stats.verifiers, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending Approvals', value: loading ? '-' : stats.pending, icon: Key, color: 'text-amber-600' },
          { label: 'Suspended Accounts', value: loading ? '-' : stats.suspended, icon: XCircle, color: 'text-red-600' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter text-on-surface">{stat.value}</h4>
            </div>
            <stat.icon size={28} className={`${stat.color} opacity-80`} />
          </motion.div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl border border-outline-variant/10 overflow-hidden ring-1 ring-black/5">
        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            System Access Roster
            {filteredUsers.length !== users.length && (
              <span className="px-2 py-0.5 bg-black/5 rounded-full text-xs font-bold text-on-surface-variant">{filteredUsers.length} results</span>
            )}
          </h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 w-64 shadow-sm"
              />
            </div>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                }}
                className={`px-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl flex items-center gap-2 hover:bg-surface-container-lowest transition-colors shadow-sm text-[11px] font-black uppercase tracking-widest font-label hover:ring-2 hover:ring-black ${filterRole !== 'All' ? 'ring-2 ring-black bg-gray-50' : ''}`}
              >
                <Filter size={14} /> {filterRole === 'All' ? 'Filter' : filterRole.split(' ')[0]}
              </button>
              
              {showFilterMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-12 w-48 bg-white border border-outline-variant/10 shadow-xl shadow-black/5 rounded-xl py-1.5 z-20"
                >
                  {['All', 'DFO Admin', 'Field Verifier', 'Compliance Auditor', 'State Admin'].map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setFilterRole(r);
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low flex items-center justify-between"
                    >
                      <span className={filterRole === r ? 'text-black' : 'text-on-surface-variant'}>{r}</span>
                      {filterRole === r && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-visible">
          <table className="w-full text-left relative">
            <thead>
              <tr className="bg-surface-container-highest/30 border-b border-outline-variant/10">
                <th className="py-4 px-8 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Staff Member</th>
                <th className="py-4 px-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Role</th>
                <th className="py-4 px-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Jurisdiction</th>
                <th className="py-4 px-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Assigned Cases</th>
                <th className="py-4 px-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="py-4 px-6 text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant text-sm font-bold">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant text-sm font-bold">
                    No matching users found.
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center font-black text-xs text-on-surface">
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-black text-sm text-on-surface">{user.name}</p>
                        <p className="text-[10px] font-mono text-on-surface-variant">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-2.5 py-1 rounded text-[9px] font-black font-label uppercase tracking-widest
                      ${user.role === 'DFO Admin' ? 'bg-black text-white' :
                        user.role === 'Field Verifier' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'State Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Compliance Auditor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-5 px-6 font-bold text-sm text-on-surface-variant">{user.district}</td>
                  <td className="py-5 px-6 font-black">{user.cases > 0 ? user.cases : '-'}</td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Offline' ? 'bg-gray-400' : 'bg-red-500'}`} />
                      <span className="text-[11px] font-bold">{user.status}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === user.id ? null : user.id);
                      }}
                      className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors focus:outline-none"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {openMenuId === user.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute right-12 top-6 w-48 bg-white rounded-xl shadow-xl shadow-black/5 flex flex-col font-label border border-outline-variant/10 py-1.5 z-50 overflow-hidden"
                      >
                        <button onClick={() => openModal('edit', user)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors w-full text-left">
                          <Settings size={14} className="text-on-surface-variant" /> Edit Profile
                        </button>
                        <button onClick={() => openModal('audit', user)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors w-full text-left">
                          <FileSearch size={14} className="text-on-surface-variant" /> View Audit Trail
                        </button>
                        <button onClick={() => openModal('reset', user)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors w-full text-left">
                          <ExternalLink size={14} className="text-on-surface-variant" /> Reset Credentials
                        </button>
                        <div className="h-px bg-outline-variant/10 my-1 font-sans" />
                        <button onClick={() => openModal('suspend', user)} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left">
                          <XCircle size={14} /> {user.status === 'Suspended' ? 'Restore Access' : 'Suspend Access'}
                        </button>
                      </motion.div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Action Modals */}
      {selectedUser && (
        <>
          <EditProfileModal user={selectedUser} isOpen={activeModal === 'edit'} onClose={closeModal} onSuccess={loadUsers} />
          <AuditTrailModal user={selectedUser} isOpen={activeModal === 'audit'} onClose={closeModal} />
          <ResetCredentialsModal user={selectedUser} isOpen={activeModal === 'reset'} onClose={closeModal} />
          <SuspendModal user={selectedUser} isOpen={activeModal === 'suspend'} onClose={closeModal} onSuccess={loadUsers} />
        </>
      )}
    </>
  );
}
