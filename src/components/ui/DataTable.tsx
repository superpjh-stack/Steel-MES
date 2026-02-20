'use client';

import { useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface Props<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  caption?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  caption,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  emptyMessage = '데이터가 없습니다.',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const totalPages = total != null ? Math.ceil(total / pageSize) : 1;

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => {
                const colKey = String(col.key);
                const isSorted = sortKey === colKey;
                const ariaSort = col.sortable
                  ? isSorted
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                  : undefined;

                return (
                  <th
                    key={colKey}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''} ${col.width ?? ''}`}
                    onClick={() => col.sortable && toggleSort(colKey)}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="ml-1 text-gray-400" aria-hidden="true">
                        {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-2.5 text-gray-700">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                    </td>
                  ))}
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
