'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

type SoStatus = 'received' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
interface Order {
  id: string; soNo: string; dueDate: string; status: SoStatus;
  createdAt: string;
  customer: { name: string; code: string };
  product:  { name: string; code: string };
  orderedQty: number;
}

const STATUS_LABEL: Record<SoStatus, string> = {
  received: '수주접수', confirmed: '수주확정', in_production: '생산중', completed: '완료', cancelled: '취소',
};
const STATUS_COLOR: Record<SoStatus, string> = {
  received: 'bg-gray-100 text-gray-600', confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const BAR_COLOR: Record<SoStatus, string> = {
  received: 'bg-gray-400', confirmed: 'bg-blue-500',
  in_production: 'bg-yellow-500', completed: 'bg-green-500', cancelled: 'bg-red-300',
};

function getProgress(order: Order): number {
  const map: Record<SoStatus, number> = { received: 10, confirmed: 25, in_production: 60, completed: 100, cancelled: 0 };
  return map[order.status];
}

function daysDiff(from: string, to: string) {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
}

export default function ProjectSchedulePage() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [statusF, setStatusF] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/sales-orders?limit=100').then(r => r.json())
      .then(res => setOrders(res.items ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = orders.filter(o =>
    (!statusF || o.status === statusF) &&
    (!q || o.soNo.includes(q) || o.customer.name.includes(q) || o.product.name.includes(q)),
  ).filter(o => o.status !== 'cancelled');

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">프로젝트일정관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">납기 기준 수주 프로젝트 진행 일정을 관리합니다.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />새로고침
        </button>
      </div>

      {/* 상태별 요약 */}
      <div className="grid grid-cols-4 gap-3">
        {(['confirmed', 'in_production', 'completed', 'received'] as SoStatus[]).map(s => {
          const cnt = orders.filter(o => o.status === s).length;
          return (
            <div key={s} className="bg-white rounded-xl border border-gray-200 p-3">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</span>
              <p className="text-2xl font-bold text-gray-900 mt-2">{cnt}<span className="text-sm font-normal text-gray-400">건</span></p>
            </div>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="수주번호·고객사·품목 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 상태</option>
          {(Object.keys(STATUS_LABEL) as SoStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* 간트 스타일 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">프로젝트일정 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['수주번호', '고객사', '품목', '수주일', '납기일', 'D-Day', '상태', '진행률'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">해당하는 프로젝트가 없습니다.</td></tr>
            ) : filtered.map(o => {
              const dday = daysDiff(new Date().toISOString(), o.dueDate);
              const progress = getProgress(o);
              const isOverdue = new Date(o.dueDate) < new Date() && o.status !== 'completed';
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{o.soNo}</td>
                  <td className="px-4 py-3 text-gray-900">{o.customer.name}</td>
                  <td className="px-4 py-3 text-gray-700">{o.product.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className={`px-4 py-3 text-xs whitespace-nowrap font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {new Date(o.dueDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className={`px-4 py-3 text-xs font-bold ${isOverdue ? 'text-red-600' : dday <= 7 ? 'text-orange-500' : 'text-gray-700'}`}>
                    {o.status === 'completed' ? '완료' : isOverdue ? '지연' : `D-${dday}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${BAR_COLOR[o.status]}`}
                          style={{ width: `${progress}%` }}
                          role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
                          aria-label={`진행률 ${progress}%`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-9 text-right">{progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
