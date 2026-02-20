'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_LABEL: Record<WoStatus, string> = {
  draft:       '초안',
  issued:      '발행',
  in_progress: '진행중',
  completed:   '완료',
  cancelled:   '취소',
};

const STATUS_COLOR: Record<WoStatus, string> = {
  draft:       'bg-slate-100 text-slate-500',
  issued:      'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-500 text-white',
  completed:   'bg-slate-700 text-white',
  cancelled:   'bg-red-100 text-red-500',
};

const PROGRESS_COLOR: Record<WoStatus, string> = {
  draft:       'bg-slate-300',
  issued:      'bg-blue-400',
  in_progress: 'bg-blue-600',
  completed:   'bg-slate-600',
  cancelled:   'bg-red-300',
};

interface WorkOrder {
  id:          string;
  woNo:        string;
  plannedQty:  number;
  producedQty: number;
  defectQty:   number;
  status:      WoStatus;
  dueDate:     string;
  product:     { name: string; code: string };
  createdBy:   { name: string };
}

const FILTER_OPTIONS = [
  { value: 'active',    label: '현재 작업지시 현황' },
  { value: 'all',       label: '전체 현황' },
  { value: 'completed', label: '완료 현황' },
];

export default function PopPage() {
  const [orders,  setOrders]  = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('active');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let statusParam = '';
    if (filter === 'active')    statusParam = 'status=issued&status2=in_progress';
    if (filter === 'completed') statusParam = 'status=completed';

    const params = new URLSearchParams({ limit: '50' });
    if (filter === 'active') { params.set('status', 'in_progress'); }
    if (filter === 'completed') { params.set('status', 'completed'); }

    const res = await fetch(`/api/work-orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      // For active: include both issued and in_progress
      if (filter === 'active') {
        const res2 = await fetch(`/api/work-orders?status=issued&limit=50`);
        const data2 = res2.ok ? await res2.json() : { items: [] };
        const combined = [...(data.items ?? []), ...(data2.items ?? [])];
        combined.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setOrders(combined);
      } else {
        setOrders(data.items ?? []);
      }
    }
    setLastUpdated(new Date());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // 30초 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchOrders, 30000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">POP / 작업지시 상태</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-0.5">
              최종 갱신: {lastUpdated.toLocaleTimeString('ko-KR')} · 30초마다 자동 갱신
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 필터 드롭다운 */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">POP 작업지시 현황</caption>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">작업 번호</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">품목명</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">생산수량</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">마감일</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">상태</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: '180px' }}>진행률</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">작업자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-300" />
                  로딩 중...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  해당하는 작업지시가 없습니다.
                </td>
              </tr>
            ) : orders.map((wo) => {
              const pct = wo.plannedQty > 0
                ? Math.min(100, Math.round((wo.producedQty / wo.plannedQty) * 100))
                : 0;
              const isOverdue = new Date(wo.dueDate) < new Date() && wo.status !== 'completed';

              return (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  {/* 작업번호 */}
                  <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-medium">
                    {wo.woNo}
                  </td>
                  {/* 품목명 */}
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-800">{wo.product.name}</span>
                    <span className="ml-1.5 text-xs text-slate-400">{wo.product.code}</span>
                  </td>
                  {/* 생산수량 */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold text-slate-800">{wo.producedQty.toLocaleString()}</span>
                    <span className="text-slate-400 text-xs"> / {wo.plannedQty.toLocaleString()}</span>
                  </td>
                  {/* 마감일 */}
                  <td className={`px-5 py-3.5 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                    {new Date(wo.dueDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('. ', '.').replace('.', '')}
                    {isOverdue && <span className="ml-1 text-xs">⚠</span>}
                  </td>
                  {/* 상태 */}
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_COLOR[wo.status]}`}>
                      {STATUS_LABEL[wo.status]}
                    </span>
                  </td>
                  {/* 진행률 */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700 w-9 text-right shrink-0">{pct}%</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`진행률 ${pct}%`}>
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${PROGRESS_COLOR[wo.status]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {/* 작업자 */}
                  <td className="px-5 py-3.5 text-slate-600 text-sm">
                    {wo.createdBy.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 하단 요약 */}
        {orders.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-6 text-xs text-slate-500">
            <span>총 <strong className="text-slate-700">{orders.length}</strong>건</span>
            <span>진행중 <strong className="text-green-600">{orders.filter((o) => o.status === 'in_progress').length}</strong>건</span>
            <span>대기 <strong className="text-blue-600">{orders.filter((o) => o.status === 'issued').length}</strong>건</span>
            <span>완료 <strong className="text-slate-600">{orders.filter((o) => o.status === 'completed').length}</strong>건</span>
          </div>
        )}
      </div>
    </div>
  );
}
