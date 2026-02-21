'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { FlaskConical, Search, Filter } from 'lucide-react';

interface Batch {
  id: string;
  woNumber: string;
  productName: string;
  productCategory: string;
  customerName: string;
  plannedQty: number;
  actualQty: number;
  defectQty: number;
  status: string;
  startDate: string;
  endDate: string;
  actualStart: string | null;
  actualEnd: string | null;
  dueDate: string;
  recipeVersion: string | null;
  batchSizeKg: number | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed:   { label: '완료',     color: 'bg-green-100 text-green-800' },
  in_progress: { label: '진행중',   color: 'bg-blue-100 text-blue-800' },
  issued:      { label: '작업지시', color: 'bg-yellow-100 text-yellow-800' },
  draft:       { label: '대기',     color: 'bg-gray-100 text-gray-800' },
  cancelled:   { label: '취소',     color: 'bg-red-100 text-red-800' },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BatchProductionPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const url = statusFilter === 'all'
    ? '/api/production/batch'
    : `/api/production/batch?status=${statusFilter}`;
  const { data, isLoading } = useSWR(url, fetcher);
  const batches: Batch[] = data?.success ? data.data : [];

  const filtered = batches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.woNumber.toLowerCase().includes(q) ||
      b.productName.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: batches.length,
    inProgress: batches.filter((b) => b.status === 'in_progress').length,
    completed: batches.filter((b) => b.status === 'completed').length,
    totalPlanned: batches.reduce((s, b) => s + b.plannedQty, 0),
    totalProduced: batches.reduce((s, b) => s + b.actualQty, 0),
  };

  const achievementRate = stats.totalPlanned > 0
    ? Math.round((stats.totalProduced / stats.totalPlanned) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <FlaskConical size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">배치생산 관리</h1>
          <p className="text-sm text-slate-500">작업지시 기반 배치 생산 현황 조회</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">전체 배치</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">진행중 {stats.inProgress}건</p>
        </div>
        <div className="bg-white border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600">완료 배치</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600">총 생산량</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalProduced.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">계획 {stats.totalPlanned.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600">달성률</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{achievementRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="배치번호, 품목명, 고객명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">전체 상태</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="issued">작업지시</option>
            <option value="draft">대기</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
          <p>등록된 배치 생산 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">배치번호</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">품목명</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">고객</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">배합비</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">계획수량</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">실적수량</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">달성률</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">상태</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">납기일</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((batch) => {
                  const status = STATUS_MAP[batch.status] ?? { label: batch.status, color: 'bg-gray-100 text-gray-800' };
                  const rate = batch.plannedQty > 0
                    ? Math.round((batch.actualQty / batch.plannedQty) * 100)
                    : 0;
                  const rateColor = rate >= 100 ? 'text-green-600' : rate >= 50 ? 'text-blue-600' : 'text-slate-500';
                  return (
                    <tr key={batch.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 font-mono text-xs">{batch.woNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{batch.productName}</div>
                        {batch.batchSizeKg && (
                          <span className="text-xs text-slate-400">배치 {batch.batchSizeKg}kg</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{batch.customerName}</td>
                      <td className="px-4 py-3 text-center">
                        {batch.recipeVersion ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                            v{batch.recipeVersion}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{batch.plannedQty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{batch.actualQty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate >= 100 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${rateColor}`}>{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs">
                        {new Date(batch.dueDate).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
