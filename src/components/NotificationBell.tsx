import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, ShieldAlert, FileSearch, Users, CheckCircle, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  caseId?: number;
  risk?: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  case_assigned: { icon: <FileSearch size={14} />, color: 'text-blue-600', bg: 'bg-blue-50' },
  queue_alert:   { icon: <AlertTriangle size={14} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  field_visit:   { icon: <ShieldAlert size={14} />, color: 'text-orange-600', bg: 'bg-orange-50' },
  critical:      { icon: <AlertTriangle size={14} />, color: 'text-red-600', bg: 'bg-red-50' },
  pattern:       { icon: <BarChart2 size={14} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  report:        { icon: <CheckCircle size={14} />, color: 'text-green-600', bg: 'bg-green-50' },
  alert:         { icon: <AlertTriangle size={14} />, color: 'text-red-600', bg: 'bg-red-50' },
  system:        { icon: <Users size={14} />, color: 'text-gray-600', bg: 'bg-gray-50' },
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (localStorage.getItem('dbt_notifications') === 'false') {
      setNotifications([]);
      setUnread(0);
      setLoading(false);
      return;
    }
    
    try {
      const data = await api.get(`/notifications?role=${role}`);
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Listen for cross-tab or programmatic settings changes
    const handleStorage = () => fetchNotifications();
    window.addEventListener('storage', handleStorage);
    
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [role]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className={`relative p-2.5 rounded-xl transition-all hover:bg-surface-container-high active:scale-95 ${open ? 'bg-surface-container-high' : ''}`}
      >
        <Bell size={18} className={unread > 0 ? 'text-on-surface' : 'text-on-surface-variant'} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-outline-variant/10 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-gray-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">Notifications</span>
                {unread > 0 && localStorage.getItem('dbt_notifications') !== 'false' && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black ml-2 whitespace-nowrap">{unread} new</span>
                )}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:underline whitespace-nowrap">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded-full shrink-0">
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {localStorage.getItem('dbt_notifications') === 'false' ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Notifications paused</p>
                  <p className="text-[9px] text-gray-400 mt-1">Enable in Settings to see live alerts</p>
                </div>
              ) : loading ? (
                <div className="py-8 text-center">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className={`text-[11px] font-black truncate ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">{n.message}</p>
                            {n.risk && (
                              <span className={`inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${n.risk >= 90 ? 'bg-red-100 text-red-600' : n.risk >= 75 ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                Risk {n.risk}
                              </span>
                            )}
                            <p className="text-[9px] text-gray-400 mt-1 font-label">{timeAgo(n.time)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">
                  Auto-refreshes every 60s
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
