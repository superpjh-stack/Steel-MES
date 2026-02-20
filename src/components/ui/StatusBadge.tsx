type ColorKey = 'green' | 'gray' | 'yellow' | 'red' | 'blue' | 'purple';

const COLOR_MAP: Record<ColorKey, string> = {
  green:  'bg-green-100 text-green-700 border-green-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};

const WO_STATUS: Record<string, { label: string; color: ColorKey }> = {
  draft:       { label: '초안',    color: 'gray' },
  issued:      { label: '발행',    color: 'blue' },
  in_progress: { label: '진행중',  color: 'yellow' },
  completed:   { label: '완료',    color: 'green' },
  cancelled:   { label: '취소',    color: 'red' },
};

const EQUIP_STATUS: Record<string, { label: string; color: ColorKey }> = {
  running:     { label: '가동',  color: 'green' },
  stopped:     { label: '정지',  color: 'gray' },
  maintenance: { label: '보전',  color: 'yellow' },
  breakdown:   { label: '고장',  color: 'red' },
};

const INSP_RESULT: Record<string, { label: string; color: ColorKey }> = {
  pass:        { label: '합격',  color: 'green' },
  fail:        { label: '불합격', color: 'red' },
  conditional: { label: '조건부', color: 'yellow' },
};

const SHIP_STATUS: Record<string, { label: string; color: ColorKey }> = {
  planned:   { label: '예정', color: 'gray' },
  packed:    { label: '포장', color: 'blue' },
  shipped:   { label: '출하', color: 'yellow' },
  delivered: { label: '납품', color: 'green' },
};

type StatusType = 'wo' | 'equipment' | 'inspection' | 'shipment';

interface Props {
  value: string;
  type?: StatusType;
}

export default function StatusBadge({ value, type = 'wo' }: Props) {
  const map =
    type === 'equipment'  ? EQUIP_STATUS  :
    type === 'inspection' ? INSP_RESULT   :
    type === 'shipment'   ? SHIP_STATUS   :
    WO_STATUS;

  const config = map[value] ?? { label: value, color: 'gray' as ColorKey };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${COLOR_MAP[config.color]}`}>
      {config.label}
    </span>
  );
}
