'use client';

import { useEffect, useState } from 'react';

type Role = 'admin' | 'manager' | 'supervisor' | 'operator' | 'qc' | 'viewer';
interface User {
  id: string; email: string; name: string; role: Role;
  department: string | null; isActive: boolean;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: '시스템관리자', manager: '관리자', supervisor: '감독자',
  operator: '작업자', qc: '품질담당', viewer: '조회자',
};
const ROLE_COLOR: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  manager: 'bg-purple-100 text-purple-700 border-purple-200',
  supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
  operator: 'bg-green-100 text-green-700 border-green-200',
  qc: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
};
const ALL_ROLES: Role[] = ['admin', 'manager', 'supervisor', 'operator', 'qc', 'viewer'];

export default function RoleInquiryPage() {
  const [items,   setItems]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Role | null>(null);

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  const byRole = ALL_ROLES.map(r => ({ role: r, users: items.filter(u => u.role === r) }));
  const detail = selected ? items.filter(u => u.role === selected) : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">권한역할조회</h1>

      {/* 역할별 현황 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading ? (
          <div className="col-span-6 text-center py-8 text-gray-400">불러오는 중…</div>
        ) : byRole.map(({ role, users }) => (
          <button
            key={role}
            onClick={() => setSelected(selected === role ? null : role)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selected === role
                ? ROLE_COLOR[role] + ' shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{ROLE_LABEL[role]}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">활성 {users.filter(u => u.isActive).length}명</p>
          </button>
        ))}
      </div>

      {/* 선택 역할 상세 */}
      {selected && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className={`px-4 py-3 border-b flex items-center justify-between ${ROLE_COLOR[selected]}`}>
            <span className="font-semibold text-sm">{ROLE_LABEL[selected]} 상세 ({detail.length}명)</span>
            <button onClick={() => setSelected(null)} className="text-xs underline opacity-70 hover:opacity-100">닫기</button>
          </div>
          <table className="w-full text-sm">
            <caption className="sr-only">{ROLE_LABEL[selected]} 사용자 목록</caption>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['이름', '아이디', '부서', '상태'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detail.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">해당 역할의 사용자가 없습니다.</td></tr>
              ) : detail.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.department ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
