import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, X, MessageSquare, Send } from 'lucide-react';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  responses: number;
}

const INITIAL_TICKETS: SupportTicket[] = [];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newTicket: SupportTicket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      description: newDesc,
      status: 'OPEN',
      priority: newPriority,
      createdAt: 'Just now',
      responses: 0
    };

    setTickets([newTicket, ...tickets]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('MEDIUM');
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: TicketStatus }) => {
    const config = {
      OPEN: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: AlertCircle, label: 'Open' },
      IN_PROGRESS: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'In Progress' },
      RESOLVED: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Resolved' }
    }[status];

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const PriorityDot = ({ priority }: { priority: TicketPriority }) => {
    const color = {
      LOW: 'bg-slate-400',
      MEDIUM: 'bg-amber-400',
      HIGH: 'bg-orange-500',
      CRITICAL: 'bg-red-500 animate-pulse'
    }[priority];

    return (
      <div className="flex items-center gap-2" title={`Priority: ${priority}`}>
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{priority}</span>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-on-surface">Support Center</h1>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">IT Helpdesk & System Support</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-5 py-3 rounded-xl font-label text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
        >
          <Plus size={16} />
          Create Ticket
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 bg-surface-container-lowest p-4 border border-outline-variant/10 rounded-2xl">
        <div className="relative w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search tickets by ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-on-surface-variant font-label"
          />
        </div>
        <button className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors border border-outline-variant/5">
          <Filter size={18} />
        </button>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/5">
            <Ticket className="mx-auto text-on-surface-variant mb-4" size={32} />
            <h3 className="text-sm font-black mb-1">No tickets found</h3>
            <p className="text-xs text-on-surface-variant">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredTickets.map((ticket, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={ticket.id}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 hover:shadow-md transition-all group hover:border-outline-variant/30 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md">
                      {ticket.id}
                    </span>
                    <StatusBadge status={ticket.status} />
                    <PriorityDot priority={ticket.priority} />
                  </div>
                  <h3 className="text-base font-bold text-on-surface mb-2 group-hover:text-blue-600 transition-colors">
                    {ticket.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant line-clamp-1 mb-4">
                    {ticket.description}
                  </p>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} />
                      {ticket.createdAt}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare size={12} />
                      {ticket.responses} Responses
                    </span>
                  </div>
                </div>
                
                {/* Simulated action button */}
                <button className="w-10 h-10 rounded-xl bg-surface-container relative overflow-hidden group-hover:bg-blue-50 transition-colors shrink-0 flex items-center justify-center">
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                  <span className="font-black text-lg text-on-surface-variant group-hover:text-blue-600">→</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl p-8 border border-outline-variant/10"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center mb-4 border border-outline-variant/20">
                  <MessageSquare className="text-on-surface" size={24} />
                </div>
                <h2 className="text-2xl font-black">Submit Support Ticket</h2>
                <p className="text-sm text-on-surface-variant mt-1">Our technical team will review and resolve your request.</p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black tracking-widest uppercase text-on-surface-variant mb-2 ml-1">
                    Ticket Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-widest uppercase text-on-surface-variant mb-2 ml-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`py-2 border rounded-xl text-xs font-bold transition-all ${
                          newPriority === p 
                            ? 'bg-black text-white border-black shadow-md' 
                            : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-outline-variant/50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-widest uppercase text-on-surface-variant mb-2 ml-1">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide specific details, error messages, or steps to reproduce..."
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-on-surface-variant/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-label text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container transition-all active:scale-95 border border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-black text-white rounded-xl font-label text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                  >
                    <Send size={14} />
                    Submit Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
