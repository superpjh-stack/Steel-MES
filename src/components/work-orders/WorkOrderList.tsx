'use client';

import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { WorkOrderSummary } from '@/types';

interface Props {
  items: WorkOrderSummary[];
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  basePath?: string;
}

export default function WorkOrderList({
  items,
  total,
  page = 1,
  onPageChange,
  basePath = '/production/work-orders',
}: Props) {
  const pageSize = 20;
  const totalPages = total != null ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <caption className="sr-only">작업지시 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">작업지시번호</th>
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">품목</th>
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">고객사</th>
              <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">계획/실적</th>
              <th scope="col" className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">달성률</th>
              <th scope="col" className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">상태</th>
              <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">납기일</th>
              <th scope="col" className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">우선순위</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  작업지시가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`${basePath}/${wo.id}`} className="font-mono text-blue-600 hover:underline">
                      {wo.woNo}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{wo.productName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{wo.customerName}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {wo.producedQty.toLocaleString()} / {wo.plannedQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 bg-gray-200 rounded-full h-3"
                        role="progressbar"
                        aria-valuenow={wo.achievementRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`달성률 ${wo.achievementRate}%`}
                      >
                        <div
                          className={`h-3 rounded-full ${wo.achievementRate >= 90 ? 'bg-green-500' : wo.achievementRate >= 50 ? 'bg-blue-500' : 'bg-gray-400'}`}
                          style={{ width: `${Math.min(wo.achievementRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-9 text-right" aria-hidden="true">{wo.achievementRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusBadge value={wo.status} type="wo" />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">
                    {new Date(wo.dueDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <PriorityBadge priority={wo.priority} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total != null && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>총 {total.toLocaleString()}건</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label="이전 페이지"
              className="min-w-[44px] min-h-[44px] px-3 py-2 rounded border disabled:opacity-30 hover:bg-gray-100 flex items-center justify-center"
            >
              ‹
            </button>
            <span className="px-3" aria-live="polite">{page} / {totalPages}</span>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="다음 페이지"
              className="min-w-[44px] min-h-[44px] px-3 py-2 rounded border disabled:opacity-30 hover:bg-gray-100 flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const label = priority <= 2 ? '긴급' : priority <= 4 ? '높음' : priority <= 7 ? '보통' : '낮음';
  const color = priority <= 2 ? 'bg-red-100 text-red-700' : priority <= 4 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
}
