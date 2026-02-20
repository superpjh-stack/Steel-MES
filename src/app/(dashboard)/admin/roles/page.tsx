import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const ROLES = [
  { value: 'admin',      label: '관리자',     color: 'bg-red-100 text-red-700',        desc: '전체 시스템 접근 및 설정 변경 가능' },
  { value: 'manager',    label: '매니저',     color: 'bg-purple-100 text-purple-700',  desc: '운영 전반 관리, 보고서·KPI 조회' },
  { value: 'supervisor', label: '슈퍼바이저', color: 'bg-blue-100 text-blue-700',      desc: '현장 감독, 생산·품질·출하 관리' },
  { value: 'qc',         label: '품질관리',   color: 'bg-green-100 text-green-700',    desc: '검사·불량·NCR 전담 관리' },
  { value: 'me',         label: '설비관리',   color: 'bg-orange-100 text-orange-700',  desc: '설비 현황·유지보수 전담 관리' },
  { value: 'operator',   label: '작업자',     color: 'bg-slate-100 text-slate-600',    desc: 'POP 작업화면·작업지시 전용' },
] as const;

const ROUTE_MATRIX: { label: string; roles: string[] }[] = [
  { label: '대시보드',     roles: ['supervisor', 'manager', 'admin'] },
  { label: '기준정보관리', roles: ['supervisor', 'manager', 'admin'] },
  { label: '수주관리',     roles: ['supervisor', 'manager', 'admin'] },
  { label: '재고관리',     roles: ['supervisor', 'manager', 'admin'] },
  { label: '생산관리',     roles: ['supervisor', 'manager', 'admin'] },
  { label: '품질관리',     roles: ['qc', 'supervisor', 'manager', 'admin'] },
  { label: '출하관리',     roles: ['supervisor', 'manager', 'admin'] },
  { label: 'POP관리',     roles: ['operator', 'supervisor', 'manager', 'admin'] },
  { label: '모니터링/KPI', roles: ['supervisor', 'manager', 'admin'] },
  { label: '설비관리',     roles: ['me', 'supervisor', 'manager', 'admin'] },
  { label: '시스템관리',   roles: ['admin'] },
];

export default async function RolesPage() {
  await auth();

  // 역할별 사용자 수 집계
  const roleCounts = await prisma.user.groupBy({
    by:     ['role'],
    where:  { isActive: true },
    _count: { id: true },
  });
  const countMap = Object.fromEntries(roleCounts.map((r) => [r.role, r._count.id]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">권한/역할 관리</h1>
        <p className="text-sm text-slate-500 mt-0.5">시스템 역할 정의 및 메뉴 접근 권한 현황</p>
      </div>

      {/* 역할 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((role) => (
          <div key={role.value} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${role.color}`}>
                {role.label}
              </span>
              <span className="text-2xl font-bold text-slate-800">
                {countMap[role.value] ?? 0}
                <span className="text-sm font-normal text-slate-400 ml-1">명</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">{role.desc}</p>
          </div>
        ))}
      </div>

      {/* 권한 매트릭스 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">메뉴별 접근 권한 매트릭스</h2>
        </div>
        <table className="w-full text-sm min-w-[640px]">
          <caption className="sr-only">메뉴별 역할 접근 권한</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500">메뉴</th>
              {ROLES.map((r) => (
                <th key={r.value} scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-500">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROUTE_MATRIX.map(({ label, roles }) => (
              <tr key={label} className="hover:bg-slate-50">
                <td className="px-5 py-2.5 text-slate-700 font-medium text-xs">{label}</td>
                {ROLES.map((r) => (
                  <td key={r.value} className="px-3 py-2.5 text-center">
                    {roles.includes(r.value) ? (
                      <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs leading-5">✓</span>
                    ) : (
                      <span className="inline-block w-5 h-5 rounded-full bg-slate-100 text-slate-300 text-xs leading-5">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
