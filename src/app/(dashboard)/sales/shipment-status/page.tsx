'use client';

import { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

type SoStatus = 'received' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
interface Row {
  id: string; soNo: string;
  customer: { name: string; code: string };
  product:  { name: string; code: string };
  orderedQty: number; shippedQty: number; rate: number;
  dueDate: string; status: SoStatus;
}

const STATUS_LABEL: Record<SoStatus, string> = {
  received: '수주접수', confirmed: '수주확정', in_production: '생산중',
  completed: '완료', cancelled: '취소',
};
const STATUS_COLOR: Record<SoStatus, string> = {
  received: 'bg-gray-100 text-gray-600', confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function ShipmentStatusPage() {
  const [rows,    setRows]    = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/sales/shipment-status').then(r => r.json())
      .then(res => setRows(res.data ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = rows.filter(r =>
    !q || r.soNo.includes(q) || r.customer.name.includes(q) || r.product.name.includes(q),
  );

  const total = { ordered: filtered.reduce((s, r) => s + r.orderedQty, 0), shipped: filtered.reduce((s, r) => s + r.shippedQty, 0) };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">수주대비출고현황</h1>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '총 수주 건수', value: `${filtered.length}건` },
          { label: '총 수주 수량', value: `${total.ordered.toLocaleString()} EA` },
          { label: '총 출고 수량', value: `${total.shipped.toLocaleString()} EA`, sub: `달성률 ${total.ordered > 0 ? Math.round(total.shipped / total.ordered * 100) : 0}%` },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
            {c.sub && <p className="text-xs text-blue-600 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="수주번호·고객사·품목 검색"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">수주대비출고현황 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['수주번호', '고객사', '품목', '납기일', '상태', '수주량', '출고량', '달성률'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">데이터가 없습니다.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{r.soNo}</td>
                <td className="px-4 py-3 text-gray-900">{r.customer.name}</td>
                <td className="px-4 py-3 text-gray-700">{r.product.name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(r.dueDate).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{r.orderedQty.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-700">{r.shippedQty.toLocaleString()}</td>
                <td className="px-4 py-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${r.rate >= 100 ? 'bg-green-500' : r.rate >= 50 ? 'bg-blue-500' : 'bg-yellow-400'}`}
                        style={{ width: `${r.rate}%` }}
                        role="progressbar" aria-valuenow={r.rate} aria-valuemin={0} aria-valuemax={100}
                        aria-label={`달성률 ${r.rate}%`}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-9 text-right">{r.rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
