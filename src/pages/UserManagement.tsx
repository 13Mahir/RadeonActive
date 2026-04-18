import { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Shield, MoreVertical, Search, Filter, Key, CheckCircle, XCircle } from 'lucide-react';

const mockUsers = [
  { id: 'IU-5463', name: 'DFO ADMIN', role: 'DFO Admin', district: 'Ahmedabad', status: 'Active', cases: 142 },
  { id: 'FV-2769', name: 'Anita Patel', role: 'Field Verifier', district: 'Ahmedabad', status: 'Active', cases: 45 },
  { id: 'FV-2770', name: 'Sanjay Desai', role: 'Field Verifier', district: 'Surat', status: 'Active', cases: 38 },
  { id: 'FV-2771', name: 'Manoj Shah', role: 'Field Verifier', district: 'Vadodara', status: 'Offline', cases: 12 },
  { id: 'AT-9667', name: 'Dr. Vivek Sharma', role: 'Compliance Auditor', district: 'Statewide', status: 'Active', cases: 0 },
  { id: 'SA-0001', name: 'System Administrator', role: 'State Admin', district: 'Statewide', status: 'Active', cases: 0 },
  { id: 'FV-2801', name: 'Priya Joshi', role: 'Field Verifier', district: 'Rajkot', status: 'Suspended', cases: 0 },
];

export default function UserManagement() {
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2">User Management</h1>
          <p className="text-on-surface-variant font-medium max-w-2xl">
            Access control panel for managing District Finance Officers, Field Verifiers, and Audit Teams.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 shadow-lg">
          <UserPlus size={16} />
          Provision New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Active Staff', value: '142', icon: Shield, color: 'text-blue-600' },
          { label: 'Field Verifiers', value: '118', icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending Approvals', value: '3', icon: Key, color: 'text-amber-600' },
          { label: 'Suspended Accounts', value: '1', icon: XCircle, color: 'text-red-600' },
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
          <h3 className="text-2xl font-black tracking-tight">System Access Roster</h3>
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
            <button className="px-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl flex items-center gap-2 hover:bg-surface-container-lowest transition-colors shadow-sm text-[11px] font-black uppercase tracking-widest font-label hover:ring-2 hover:ring-black">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center font-black text-xs text-on-surface">
                        {user.name.split(' ').map(n => n[0]).join('')}
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
                        'bg-blue-100 text-blue-800'}`}
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
                  <td className="py-5 px-6 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
