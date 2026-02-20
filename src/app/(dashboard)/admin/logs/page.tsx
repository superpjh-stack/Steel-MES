import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const ACTION_LABEL: Record<string, string> = {
  LOGIN:  '로그인',
  LOGOUT: '로그아웃',
  CREATE: '등록',
  UPDATE: '수정',
  DELETE: '삭제',
};

const ACTION_COLOR: Record<string, string> = {
  LOGIN:  'bg-green-100 text-green-700',
  LOGOUT: 'bg-slate-100 text-slate-500',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-600',
};

export default async function SystemLogsPage() {
  await auth();

  const [logs, totalCount] = await Promise.all([
    prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.systemLog.count(),
  ]);

  // 오늘 날짜 기준 통계
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter((l) => new Date(l.createdAt) >= today);
  const loginCount  = todayLogs.filter((l) => l.action === 'LOGIN').length;
  const changeCount = todayLogs.filter((l) => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">시스템 로그</h1>
        <p className="text-sm text-slate-500 mt-0.5">접속 및 데이터 변경 이력 (최근 100건)</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 로그', value: totalCount, color: 'border-blue-500' },
          { label: '오늘 로그인', value: loginCount, color: 'border-green-500' },
          { label: '오늘 변경', value: changeCount, color: 'border-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 p-5 border-l-4 ${color}`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {value.toLocaleString()}<span className="text-sm font-normal text-slate-500 ml-1">건</span>
            </p>
          </div>
        ))}
      </div>

      {/* 로그 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">시스템 접속 및 변경 로그</caption>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">일시</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">사용자</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">작업</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">대상</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">상세</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <p className="mb-1">기록된 로그가 없습니다.</p>
                  <p className="text-xs text-slate-300">사용자 로그인·데이터 변경 시 자동 기록됩니다.</p>
                </td>
              </tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('ko-KR', {
                    month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </td>
                <td className="px-5 py-2.5">
                  <span className="text-sm font-medium text-slate-800">
                    {log.user?.name ?? log.userName ?? '—'}
                  </span>
                  {log.user?.role && (
                    <span className="ml-1.5 text-xs text-slate-400">{log.user.role}</span>
                  )}
                </td>
                <td className="px-5 py-2.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLOR[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-600">{log.resource ?? '—'}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500 max-w-[250px] truncate">
                  {log.detail ?? '—'}
                </td>
                <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{log.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
