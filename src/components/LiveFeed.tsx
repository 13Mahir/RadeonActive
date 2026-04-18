import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface FeedItem {
  id: number;
  leakage_type: string;
  name: string;
  district: string;
  risk_score: number;
  amount: number;
  date_flagged: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  DECEASED: { label: 'Deceased Flag', color: 'bg-red-600', textColor: 'text-red-600' },
  DUPLICATE: { label: 'Duplicate Identity', color: 'bg-black', textColor: 'text-on-surface' },
  UNWITHDRAWN: { label: 'Unwithdrawn Funds', color: 'bg-amber-600', textColor: 'text-amber-600' },
  CROSS_SCHEME: { label: 'Cross-Scheme', color: 'bg-blue-600', textColor: 'text-blue-600' },
};

export default function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const data = await api.get('/cases?minRisk=75&limit=8&status=Flagged');
      setItems(data.cases || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/10 flex flex-col overflow-hidden">
      <div className="p-6 space-y-5 overflow-y-auto max-h-[460px]">
        {loading ? (
          <div className="py-8 text-center text-on-surface-variant font-label text-[10px] uppercase tracking-widest">
            Loading feed...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant font-label text-[10px] uppercase tracking-widest">
            No active alerts
          </div>
        ) : items.map((item, idx) => {
          const config = TYPE_CONFIG[item.leakage_type] || TYPE_CONFIG.DUPLICATE;
          return (
            <div key={item.id} className="flex gap-4 group">
              <div className="mt-1.5 flex flex-col items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${config.color} shadow-sm group-hover:scale-125 transition-transform`}></div>
                {idx < items.length - 1 && <div className="w-px h-14 bg-outline-variant/20" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-black font-label uppercase tracking-widest ${config.textColor}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] font-medium text-on-surface-variant">{timeAgo(item.date_flagged)}</span>
                </div>
                <p className="text-sm font-medium leading-snug text-on-surface">
                  {item.name} — {item.district} District.{' '}
                  ₹{item.amount.toLocaleString('en-IN')} flagged.{' '}
                  Risk: <strong>{item.risk_score}/100</strong>
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <button className="w-full py-4 bg-surface-container-low font-label text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-colors border-t border-outline-variant/15">
        View Full Ledger
      </button>
    </div>
  );
}
