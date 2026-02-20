import { BADGE_COLOR, SemanticColor } from '@/lib/designTokens';

interface Props {
  label: string;
  count: number;
  color: SemanticColor;
}

export default function EquipBadge({ label, count, color }: Props) {
  return (
    <div className={`px-3 py-2 rounded-lg text-sm font-medium ${BADGE_COLOR[color]}`}>
      {label} <span className="font-bold">{count}</span>대
    </div>
  );
}
