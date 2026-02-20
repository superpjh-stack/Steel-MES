'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

type Role = 'admin' | 'manager' | 'supervisor' | 'operator' | 'qc' | 'viewer';
interface User {
  id: string; email: string; name: string; role: Role;
  department: string | null; shift: string | null;
  isActive: boolean; lastLoginAt: string | null;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: '시스템관리자', manager: '관리자', supervisor: '감독자',
  operator: '작업자', qc: '품질담당', viewer: '조회자',
};
const ROLE_COLOR: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700', manager: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700', operator: 'bg-green-100 text-green-700',
  qc: 'bg-yellow-100 text-yellow-700', viewer: 'bg-gray-100 text-gray-600',
};

export default function UserInquiryPage() {
  const [items,   setItems]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [roleF,   setRoleF]   = useState('');

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(u =>
    (!q || u.name.includes(q) || u.email.includes(q) || (u.department ?? '').includes(q)) &&
    (!roleF || u.role === roleF),
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">사용자계정조회</h1>
        <span className="text-sm text-gray-500">총 {filtered.length}명</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="이름·아이디·부서 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={roleF} onChange={e => setRoleF(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 역할</option>
          {(Object.keys(ROLE_LABEL) as Role[]).map(r => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">사용자계정 조회 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['이름', '아이디', '역할', '부서', '교대', '상태', '최근 로그인'].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">조회된 계정이 없습니다.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.department ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{u.shift ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
