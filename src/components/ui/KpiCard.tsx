import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'purple';
type Trend = 'up' | 'down' | 'flat';

const ACCENT: Record<Color, string> = {
  blue:   'border-l-blue-500   bg-white',
  green:  'border-l-green-500  bg-white',
  yellow: 'border-l-amber-400  bg-white',
  red:    'border-l-red-500    bg-white',
  gray:   'border-l-gray-400   bg-white',
  indigo: 'border-l-indigo-500 bg-white',
  purple: 'border-l-purple-500 bg-white',
};

const VALUE_COLOR: Record<Color, string> = {
  blue:   'text-blue-700',
  green:  'text-green-700',
  yellow: 'text-amber-600',
  red:    'text-red-600',
  gray:   'text-gray-700',
  indigo: 'text-indigo-700',
  purple: 'text-purple-700',
};

const PROGRESS_COLOR: Record<Color, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-amber-400',
  red:    'bg-red-500',
  gray:   'bg-gray-400',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
};

const TREND_ICON: Record<Trend, React.ElementType> = {
  up:   TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLOR: Record<Trend, string> = {
  up:   'text-green-500',
  down: 'text-red-500',
  flat: 'text-gray-400',
};

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  color?: Color;
  sub?: string;
  icon?: React.ElementType;
  progress?: number;   // 0–100
  trend?: Trend;
  trendLabel?: string;
}

export default function KpiCard({
  label, value, unit, color = 'blue', sub, icon: Icon, progress, trend, trendLabel,
}: Props) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <div className={`rounded-lg border border-l-4 p-4 shadow-sm ${ACCENT[color]}`}>
      {/* 상단: 라벨 + 아이콘 */}
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        {Icon && (
          <div className={`p-1.5 rounded-md bg-gray-50 ${VALUE_COLOR[color]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* 값 */}
      <div className="flex items-end gap-1.5">
        <p className={`text-2xl font-bold leading-none ${VALUE_COLOR[color]}`}>{value}</p>
        {unit && <span className="text-sm text-gray-400 mb-0.5">{unit}</span>}
      </div>

      {/* 트렌드 */}
      {(trend || sub || trendLabel) && (
        <div className="flex items-center gap-1 mt-1.5">
          {TrendIcon && <TrendIcon size={13} className={TREND_COLOR[trend!]} />}
          <p className="text-xs text-gray-400">{trendLabel ?? sub}</p>
        </div>
      )}
      {!trend && sub && !trendLabel && (
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      )}

      {/* 진행률 바 */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>달성률</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${PROGRESS_COLOR[color]}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
