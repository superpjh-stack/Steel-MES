import Link from 'next/link';

interface Props {
  id: string;
  woNo: string;
  productName: string;
  customerName: string;
  plannedQty: number;
  producedQty: number;
  defectQty: number;
  status: 'issued' | 'in_progress';
  dueDate: string;
  href?: string;
}

export default function WorkOrderCard({
  id,
  woNo,
  productName,
  customerName,
  plannedQty,
  producedQty,
  defectQty,
  status,
  dueDate,
  href,
}: Props) {
  const rate = plannedQty > 0 ? Math.round((producedQty / plannedQty) * 100) : 0;
  const link = href ?? `/operator/${id}/input`;

  const dueDateObj = new Date(dueDate);
  const isUrgent = (dueDateObj.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

  return (
    <Link
      href={link}
      className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-xl p-5 transition-colors block select-none"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-blue-300 text-sm">{woNo}</p>
          <p className="font-bold text-lg mt-0.5 text-white truncate">{productName}</p>
          <p className="text-gray-400 text-sm">{customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'in_progress' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
          }`}>
            {status === 'in_progress' ? '진행중' : '발행'}
          </span>
          {isUrgent && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">긴급</span>
          )}
        </div>
      </div>

      <div className="flex gap-4 text-sm mb-3">
        <span className="text-gray-400">목표 <strong className="text-white">{plannedQty.toLocaleString()}</strong></span>
        <span className="text-gray-400">양품 <strong className="text-green-400">{producedQty.toLocaleString()}</strong></span>
        <span className="text-gray-400">불량 <strong className="text-red-400">{defectQty.toLocaleString()}</strong></span>
        <span className="text-gray-400 ml-auto text-xs">
          납기 {dueDateObj.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
        </span>
      </div>

      <div className="bg-gray-600 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all ${rate >= 90 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-gray-400'}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{rate}%</p>
    </Link>
  );
}
