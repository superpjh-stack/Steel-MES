'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Log {
  id: string; action: string; resource: string | null;
  detail: string | null; userName: string | null;
  ipAddress: string | null; createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-600',
  LOGIN:  'bg-gray-100 text-gray-600',
};

export default function ChangeHistoryPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const limit = 30;

  const load = (p = 1) => {
    setLoading(true);
    fetch(`/api/sales/change-history?page=${p}&limit=${limit}`)
      .then(r => r.json())
      .then(res => { setLogs(res.data ?? []); setTotal(res.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">수주변경이력관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">수주 관련 등록·수정·삭제 이력을 조회합니다.</p>
        </div>
        <button onClick={() => load(page)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />새로고침
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">수주변경이력 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['일시', '작업', '작업자', '상세 내용', 'IP'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">수주 변경 이력이 없습니다.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOR[l.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{l.userName ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.detail ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.ipAddress ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            aria-label="이전 페이지"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center px-3 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed">
            이전
          </button>
          <span className="text-sm text-gray-600" aria-live="polite">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            aria-label="다음 페이지"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center px-3 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed">
            다음
          </button>
        </div>
      )}
    </div>
  );
}
