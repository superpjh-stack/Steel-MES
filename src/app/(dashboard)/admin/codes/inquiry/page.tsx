'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface Code {
  id: string; groupCode: string; groupName: string;
  code: string; codeName: string; sortOrder: number;
  isActive: boolean; description: string | null;
}

export default function CodeInquiryPage() {
  const [items,   setItems]   = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [groupF,  setGroupF]  = useState('');

  useEffect(() => {
    fetch('/api/admin/codes').then(r => r.ok ? r.json() : { data: [] })
      .then(res => setItems(res.data ?? res))
      .finally(() => setLoading(false));
  }, []);

  const groups = Array.from(new Set(items.map(i => i.groupCode))).sort();
  const filtered = items.filter(i =>
    (!groupF || i.groupCode === groupF) &&
    (!q || i.codeName.includes(q) || i.code.includes(q) || i.groupName.includes(q)),
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">공통코드조회</h1>
        <span className="text-sm text-gray-500">총 {filtered.length}건</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="코드명·코드값 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={groupF} onChange={e => setGroupF(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 그룹</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">공통코드 조회 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['그룹코드', '그룹명', '코드', '코드명', '정렬', '활성', '설명'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">조회된 코드가 없습니다.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{c.groupCode}</td>
                <td className="px-4 py-3 text-gray-700">{c.groupName}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.codeName}</td>
                <td className="px-4 py-3 text-gray-500 text-center">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{c.description ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
