interface Props {
  score: number;
  showBar?: boolean;
}

export default function RiskBadge({ score, showBar = false }: Props) {
  const color = score >= 90 ? 'text-red-600' : score >= 75 ? 'text-amber-600' : 'text-on-surface';
  const barColor = score >= 90 ? 'bg-red-600' : score >= 75 ? 'bg-amber-600' : 'bg-on-surface/40';

  return (
    <div className="flex items-center gap-3">
      <span className={`font-black font-label text-sm ${color}`}>{score}</span>
      {showBar && (
        <div className="w-20 h-2 bg-surface-variant/30 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  );
}
