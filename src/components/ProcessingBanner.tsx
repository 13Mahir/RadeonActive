import { Zap } from 'lucide-react';

interface Props {
  run: { duration_ms: number; transactions_processed: number; completed_at: string };
}

export default function ProcessingBanner({ run }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-black text-white rounded-2xl shadow-xl w-fit">
      <Zap size={16} className="text-amber-400" />
      <span className="font-label text-[11px] font-black uppercase tracking-widest">
        ⚡ Processed {run.transactions_processed?.toLocaleString()} transactions in{' '}
        {(run.duration_ms / 1000).toFixed(1)}s
      </span>
    </div>
  );
}
